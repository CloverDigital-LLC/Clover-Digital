import { useQuery } from '@tanstack/react-query'
import { cloverOpsConfigured } from '../lib/supabase'
import { cloverOpsReadReady, selectCloverOps } from '../lib/cloverOpsBridge'
import type { CloverAgentTemplateRow } from '../lib/cloverAgents'

const REFRESH_MS = 60_000

const TEMPLATE_COLUMNS =
  'id, name, version, status, description, supported_services, required_integrations, created_by_team, created_by_agent, created_at, updated_at'

export function useCloverAgentTemplates() {
  return useQuery({
    queryKey: ['clover-agent-templates'],
    queryFn: async (): Promise<CloverAgentTemplateRow[]> => {
      const ready = await cloverOpsReadReady()
      if (!ready) return []
      const { data, error } = await selectCloverOps<CloverAgentTemplateRow>(
        'cd_agent_templates',
        TEMPLATE_COLUMNS,
        {
          order: [
            { column: 'status', ascending: true },
            { column: 'name', ascending: true },
          ],
        },
      )
      if (error) {
        console.warn('[clover-ops] agent templates unavailable:', error.message ?? error)
        return []
      }
      return data ?? []
    },
    refetchInterval: REFRESH_MS,
    enabled: cloverOpsConfigured,
  })
}
