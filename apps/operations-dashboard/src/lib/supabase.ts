import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
const cloverOpsUrl = import.meta.env.VITE_CLOVER_OPS_SUPABASE_URL
const cloverOpsAnon = import.meta.env.VITE_CLOVER_OPS_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anon)
export const cloverOpsConfigured = Boolean(cloverOpsUrl && cloverOpsAnon)

if (!supabaseConfigured) {
  // Soft warning instead of throwing — lets the app boot in design-only mode
  // when env isn't configured yet (so the layout can be shown without exposing
  // the anon key during early demos).
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — running in design mode (no live data).',
  )
}

// Supabase JS validates the URL synchronously and throws on construction if
// it's empty. Use a placeholder when not configured so the app can mount;
// every hook gates fetching on `supabaseConfigured` so no requests actually
// fire in design mode.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_ANON = 'placeholder-anon-key'

export const supabase = createClient(
  url || PLACEHOLDER_URL,
  anon || PLACEHOLDER_ANON,
  {
    auth: {
      persistSession: supabaseConfigured,
      autoRefreshToken: supabaseConfigured,
      detectSessionInUrl: supabaseConfigured,
      flowType: 'pkce',
    },
  },
)

export const cloverOpsSupabase = createClient(
  cloverOpsUrl || PLACEHOLDER_URL,
  cloverOpsAnon || PLACEHOLDER_ANON,
  {
    auth: {
      persistSession: cloverOpsConfigured,
      autoRefreshToken: cloverOpsConfigured,
      detectSessionInUrl: cloverOpsConfigured,
      flowType: 'pkce',
      storageKey: 'clover-ops-auth-token',
    },
  },
)

export async function cloverOpsSessionReady(): Promise<boolean> {
  if (!cloverOpsConfigured) return false
  const { data } = await cloverOpsSupabase.auth.getSession()
  return Boolean(data.session)
}
