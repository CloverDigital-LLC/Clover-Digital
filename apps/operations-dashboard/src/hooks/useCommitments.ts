import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { adaptCommitment } from '../lib/adapters'
import type { MasonCommitmentRow } from '../lib/types'
import { useVentureFilter, useVentureScope } from '../context/VentureFilterContext'

export function useCommitments() {
  const { viewRole } = useVentureFilter()
  const { ventures } = useVentureScope()
  return useQuery({
    // Re-key on the active venture scope so team view ↔ admin view
    // doesn't serve a stale cross-venture cache.
    queryKey: ['mason-commitments', viewRole, ventures?.join(',') ?? 'all'],
    queryFn: async () => {
      if (viewRole !== 'admin') return []
      let q = supabase
        .from('mason_commitments')
        .select(
          'id, commitment, context, venture, status, delegated_to, source_agent, due_date, surfaced_count, last_surfaced_at, created_at, resolved_at',
        )
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(50)
      // Team view (ventures=['clover-digital']) restricts commits to that
      // venture even though Mason as admin can read all of them via RLS.
      // Without this, fleet/personal commitments surfaced as Top Tasks in
      // the Clover-only briefing.
      if (ventures) q = q.in('venture', ventures)
      const { data, error } = await q
      if (error) throw error
      return (data as unknown as MasonCommitmentRow[]).map((r) => adaptCommitment(r))
    },
    refetchInterval: 60_000,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}
