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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [role, setRole] = useState<Role>(supabaseConfigured ? 'guest' : 'admin')
  const [roleResolved, setRoleResolved] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) {
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Secondary Clover Ops project: the dashboard still uses prairie-fleet for
  // primary auth/role, but this warms the Clover Ops client so source-aware
  // Clover reads can use a persisted Clover session when present.
  useEffect(() => {
    if (!cloverOpsConfigured) return
    cloverOpsSupabase.auth.getSession()
    const { data: sub } = cloverOpsSupabase.auth.onAuthStateChange(() => {})
    return () => sub.subscription.unsubscribe()
  }, [])

  // Source role from DB via SECURITY DEFINER RPC. The DB allowlist is the
  // source of truth — env-var inference would let anyone with a valid email
  // claim "team" client-side, even if RLS would block their queries.
  useEffect(() => {
    if (!supabaseConfigured) return
    if (!session?.user) {
      setRole('guest')
      setRoleResolved(true)
      return
    }
    let cancelled = false
    setRoleResolved(false)
    supabase
      .rpc('dashboard_role')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          // RPC returned null → email isn't on the allowlist.
          setRole('guest')
        } else {
          setRole(data as Role)
        }
        setRoleResolved(true)
      })
    return () => {
      cancelled = true
    }
  }, [session?.access_token])

  async function signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error: error as Error | null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    if (cloverOpsConfigured) await cloverOpsSupabase.auth.signOut()
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
    designMode: !supabaseConfigured,
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
