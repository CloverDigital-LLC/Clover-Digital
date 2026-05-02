/**
 * Money + gamification signals for the dashboard's top strip.
 * Mason: "I like gamification angles, and if you can relate it back to me
 * making money I will like it even more."
 *
 * Read-only.
 */
import { useQuery } from '@tanstack/react-query'
import {
  cloverOpsConfigured,
  cloverOpsSessionReady,
  cloverOpsSupabase,
  supabase,
  supabaseConfigured,
} from '../lib/supabase'

const REFRESH_MS = 60_000

// ─── Money meter ─────────────────────────────────────────────────────

export interface MoneyMeter {
  /** Paid pilots signed (will hand-track via goal completion until we add a status). */
  pilots_signed: number
  pilots_target: number
  /** Current MRR in cents. Manual / future Stripe wire — 0 today. */
  mrr_cents: number
  mrr_target_cents: number
  /** Active qualified-account count (cd_target_accounts.status='qualified'). */
  qualified_count: number
  /** Sum of monthly_value_hypothesis across qualified accounts, in cents. */
  qualified_pipeline_cents: number
}

export function useMoneyMeter() {
  return useQuery({
    queryKey: ['money-meter'],
    queryFn: async (): Promise<MoneyMeter> => {
      const client =
        cloverOpsConfigured && (await cloverOpsSessionReady())
          ? cloverOpsSupabase
          : supabase
      const { data, error } = await client
        .from('cd_target_accounts')
        .select('id, monthly_value_hypothesis_cents')
        .eq('status', 'qualified')
      if (error) throw error
      const rows = (data ?? []) as Array<{
        id: string
        monthly_value_hypothesis_cents: number | null
      }>
      const qualified_pipeline_cents = rows.reduce(
        (s, r) => s + (r.monthly_value_hypothesis_cents ?? 0),
        0,
      )
      return {
        pilots_signed: 0, // hand-tracked until we add a status
        pilots_target: 8, // from goal a9116549 success_criteria
        mrr_cents: 0, // future: pull from a payments table
        mrr_target_cents: 10_000_00, // $10k/mo from the same goal
        qualified_count: rows.length,
        qualified_pipeline_cents,
      }
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured || cloverOpsConfigured,
  })
}

// ─── Ship streak ─────────────────────────────────────────────────────

export interface ShipStreak {
  current_streak_days: number
  longest_streak_days: number
  last_shipped_at: string | null
}

export function useShipStreak() {
  return useQuery({
    queryKey: ['ship-streak'],
    queryFn: async (): Promise<ShipStreak> => {
      // Pull last 60 days of completions. 60 is generous; the longest
      // streak we care about visually.
      const since = new Date(Date.now() - 60 * 86_400_000).toISOString()
      const cloverReady = cloverOpsConfigured && (await cloverOpsSessionReady())
      const [fleetRes, cloverRes] = await Promise.all([
        supabase
          .from('agent_tasks')
          .select('completed_at')
          .eq('status', 'completed')
          .gte('completed_at', since)
          .order('completed_at', { ascending: false }),
        cloverReady
          ? cloverOpsSupabase
              .from('cd_tasks')
              .select('completed_at')
              .eq('status', 'completed')
              .gte('completed_at', since)
              .order('completed_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ])
      if (fleetRes.error) throw fleetRes.error
      if (cloverRes.error) {
        console.warn('[clover-ops] ship streak unavailable:', cloverRes.error.message)
      }
      const data = [...(fleetRes.data ?? []), ...(cloverRes.data ?? [])].sort(
        (a, b) =>
          new Date((b.completed_at as string | null) ?? 0).getTime() -
          new Date((a.completed_at as string | null) ?? 0).getTime(),
      )

      // Bucket completion timestamps to local days (YYYY-MM-DD). Walk
      // backward from today; each consecutive day with ≥1 completion
      // extends the streak.
      const days = new Set<string>()
      for (const r of (data ?? []) as Array<{ completed_at: string | null }>) {
        if (!r.completed_at) continue
        const d = new Date(r.completed_at)
        days.add(toLocalDateKey(d))
      }
      const today = toLocalDateKey(new Date())
      const cursor = new Date()
      // If today has no completion yet, "current streak" is whatever
      // run ended yesterday — start counting from yesterday.
      if (!days.has(today)) {
        cursor.setDate(cursor.getDate() - 1)
      }
      let current = 0
      while (days.has(toLocalDateKey(cursor))) {
        current += 1
        cursor.setDate(cursor.getDate() - 1)
      }
      // Longest run within the 60-day window.
      const sortedKeys = Array.from(days).sort()
      let longest = 0
      let run = 0
      let prev: Date | null = null
      for (const k of sortedKeys) {
        const d = parseLocalDateKey(k)
        if (prev && diffDays(prev, d) === 1) run += 1
        else run = 1
        if (run > longest) longest = run
        prev = d
      }
      return {
        current_streak_days: current,
        longest_streak_days: longest,
        last_shipped_at: (data?.[0]?.completed_at as string) ?? null,
      }
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured || cloverOpsConfigured,
  })
}

// ─── helpers ─────────────────────────────────────────────────────────

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseLocalDateKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function diffDays(a: Date, b: Date): number {
  return Math.round(
    (b.getTime() - a.getTime()) / 86_400_000,
  )
}
