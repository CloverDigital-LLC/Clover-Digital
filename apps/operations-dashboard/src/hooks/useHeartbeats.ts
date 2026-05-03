import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { adaptHeartbeats } from '../lib/adapters'
import type { AgentHeartbeatRow } from '../lib/types'
import { useVentureFilter } from '../context/VentureFilterContext'

export function useHeartbeats() {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['heartbeats', viewRole],
    queryFn: async () => {
      // Pull recent heartbeats; adapter takes the latest per agent.
      // Window is wide enough to surface a "stale" agent — that's the point.
      const sinceIso = new Date(Date.now() - 24 * 3_600_000).toISOString()
      const { data, error } = await supabase
        .from('agent_heartbeats')
        .select('id, agent, machine, status, current_task, uptime_hours, memory_usage_mb, created_at')
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      return adaptHeartbeats((data ?? []) as AgentHeartbeatRow[])
    },
    refetchInterval: 30_000,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}
