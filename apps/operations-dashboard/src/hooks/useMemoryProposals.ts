import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { MemoryProposalRow } from '../lib/types'
import { useVentureFilter } from '../context/VentureFilterContext'

const REFRESH_MS = 30_000

export const MEMORY_PROPOSAL_SELECT =
  'id, proposed_by, proposal_type, target_knowledge_id, related_knowledge_ids, payload, rationale, status, reviewed_at, reviewed_by, auto_approvable, created_at'

export function usePendingProposals(limit = 20) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['pending-memory-proposals', viewRole, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memory_proposals')
        .select(MEMORY_PROPOSAL_SELECT)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as MemoryProposalRow[]
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

export interface ArchivistCadence {
  last_run_at: string | null
  runs_7d: number
  median_gap_hours: number | null
}

/**
 * Cadence derived from agent_sessions (Archivist doesn't post heartbeats
 * during his nightly cron, so the heartbeats card shows him stale even
 * when he's running fine — sessions are the truth).
 */
export function useArchivistCadence() {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['archivist-cadence', viewRole],
    queryFn: async (): Promise<ArchivistCadence> => {
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
      const { data, error } = await supabase
        .from('agent_sessions')
        .select('created_at')
        .eq('agent', 'archivist')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      const rows = (data ?? []) as { created_at: string }[]
      if (rows.length === 0)
        return { last_run_at: null, runs_7d: 0, median_gap_hours: null }
      const gaps: number[] = []
      for (let i = 0; i < rows.length - 1; i++) {
        const gap =
          (new Date(rows[i].created_at).getTime() -
            new Date(rows[i + 1].created_at).getTime()) /
          3_600_000
        gaps.push(gap)
      }
      const sorted = [...gaps].sort((a, b) => a - b)
      const median =
        sorted.length === 0
          ? null
          : sorted[Math.floor(sorted.length / 2)]
      return {
        last_run_at: rows[0].created_at,
        runs_7d: rows.length,
        median_gap_hours: median,
      }
    },
    refetchInterval: 5 * 60_000,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}
