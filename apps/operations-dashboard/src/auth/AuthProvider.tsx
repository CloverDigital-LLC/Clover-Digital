import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  cloverOpsConfigured,
  cloverOpsSupabase,
  supabase,
  supabaseConfigured,
} from '../lib/supabase'
import { adminSurfaceEnabled } from '../lib/surface'

export type Role = 'admin' | 'team' | 'guest'

interface AuthState {
  session: Session | null
  user: User | null
  role: Role
  loading: boolean
  /** True if the session is real but the email isn't on the dashboard allowlist. */
  unauthorized: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  /** True if Supabase env is unset — the app runs in design-only mode. */
  designMode: boolean
}

const AuthContext = createContext<AuthState | null>(null)

const primaryAuthClient = adminSurfaceEnabled ? supabase : cloverOpsSupabase
const primaryAuthConfigured = adminSurfaceEnabled
  ? supabaseConfigured
  : cloverOpsConfigured
const secondaryAuthClient = adminSurfaceEnabled ? cloverOpsSupabase : supabase
const secondaryAuthConfigured = adminSurfaceEnabled
  ? cloverOpsConfigured
  : supabaseConfigured

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(primaryAuthConfigured)
  const [role, setRole] = useState<Role>(
    primaryAuthConfigured ? 'guest' : 'admin',
  )
  const [roleResolved, setRoleResolved] = useState(false)

  useEffect(() => {
    if (!primaryAuthConfigured) {
      return
    }
    primaryAuthClient.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = primaryAuthClient.auth.onAuthStateChange(
      (_evt, sess) => {
        setSession(sess)
      },
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  // Keep the non-primary project warmed so sign-out clears both projects and
  // admin/cofounder surfaces can coexist in the same browser without token
  // storage collisions.
  useEffect(() => {
    if (!secondaryAuthConfigured) return
    secondaryAuthClient.auth.getSession()
    const { data: sub } = secondaryAuthClient.auth.onAuthStateChange(() => {})
    return () => sub.subscription.unsubscribe()
  }, [])

  // Source role from DB via SECURITY DEFINER RPC. The DB allowlist is the
  // source of truth — env-var inference would let anyone with a valid email
  // claim "team" client-side, even if RLS would block their queries.
  useEffect(() => {
    if (!primaryAuthConfigured) return
    if (!session?.user) {
      setRole('guest')
      setRoleResolved(true)
      return
    }
    let cancelled = false
    setRoleResolved(false)

    const resolveRole = adminSurfaceEnabled
      ? primaryAuthClient.rpc('dashboard_role')
      : cloverOpsSupabase
          .from('cd_members')
          .select('role')
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()

    resolveRole.then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          // No allowlist/member row means the user is authenticated but not
          // authorized for this dashboard.
          setRole('guest')
        } else {
          const resolvedRole = adminSurfaceEnabled
            ? (data as Role)
            : data.role === 'owner' || data.role === 'admin'
              ? 'admin'
              : 'team'
          setRole(resolvedRole)
        }
        setRoleResolved(true)
      })
    return () => {
      cancelled = true
    }
  }, [session?.access_token])

  async function signInWithMagicLink(email: string) {
    const primary = await primaryAuthClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (
      adminSurfaceEnabled &&
      secondaryAuthConfigured &&
      secondaryAuthClient !== primaryAuthClient
    ) {
      const secondary = await secondaryAuthClient.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      })
      return { error: (primary.error ?? secondary.error) as Error | null }
    }
    return { error: primary.error as Error | null }
  }

  async function signOut() {
    await primaryAuthClient.auth.signOut()
    if (secondaryAuthConfigured) await secondaryAuthClient.auth.signOut()
  }

  // "Unauthorized" = signed-in (Supabase Auth said yes) but not on the
  // dashboard allowlist. Different from "not signed in" — the user has a
  // session, they just can't see anything.
  const unauthorized =
    supabaseConfigured && Boolean(session?.user) && roleResolved && role === 'guest'

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    role,
    loading: loading || (Boolean(session?.user) && !roleResolved),
    unauthorized,
    signInWithMagicLink,
    signOut,
    designMode: !primaryAuthConfigured,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Keeping the hook next to its provider keeps auth wiring easy to follow.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
