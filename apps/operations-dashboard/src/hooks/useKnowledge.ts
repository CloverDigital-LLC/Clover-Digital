import { useQuery } from '@tanstack/react-query'
import {
  cloverOpsConfigured,
  cloverOpsSessionReady,
  cloverOpsSupabase,
  supabase,
  supabaseConfigured,
} from '../lib/supabase'
import { adaptKnowledge } from '../lib/adapters'
import type { KnowledgeRow } from '../lib/types'
import { useVentureFilter, useVentureScope } from '../context/VentureFilterContext'
import {
  adaptCloverKnowledge,
  wantsCloverOps,
  type CloverKnowledgeRow,
} from '../lib/cloverOps'

const CLOVER_KNOWLEDGE_COLUMNS =
  'id, category, title, content, source_agent, source_channel, visibility, tags, is_private, confidence, related_task_id, related_goal_id, superseded_by, expires_at, last_reinforced_at, created_at, updated_at'

function warnCloverOps(label: string, error: { message?: string }) {
  console.warn(`[clover-ops] ${label} unavailable:`, error.message ?? error)
}

export function useKnowledge(limit = 6) {
  const { viewRole } = useVentureFilter()
  const { projects } = useVentureScope()
  return useQuery({
    queryKey: ['knowledge', limit, viewRole, projects?.join(',') ?? 'all'],
    queryFn: async () => {
      const cloverReady = cloverOpsConfigured && (await cloverOpsSessionReady())
      const fleetPromise = viewRole === 'admin' && supabaseConfigured
        ? (async () => {
            let q = supabase
              .from('knowledge')
              .select('id, project, category, title, content, created_at, scope')
              .in('category', ['decision', 'research', 'insight'])
              .order('created_at', { ascending: false })
              .limit(limit)
            if (projects) q = q.in('project', projects)
            const { data, error } = await q
            if (error) throw error
            return data as unknown as KnowledgeRow[]
          })()
        : Promise.resolve([] as KnowledgeRow[])

      const cloverPromise =
        cloverReady && wantsCloverOps(projects)
          ? (async () => {
              const { data, error } = await cloverOpsSupabase
                .from('cd_knowledge')
                .select(CLOVER_KNOWLEDGE_COLUMNS)
                .in('category', [
                  'decision',
                  'research',
                  'insight',
                  'product_decision',
                  'implementation_note',
                ])
                .order('created_at', { ascending: false })
                .limit(limit)
              if (error) {
                warnCloverOps('knowledge', error)
                return [] as KnowledgeRow[]
              }
              return ((data ?? []) as CloverKnowledgeRow[]).map(adaptCloverKnowledge)
            })()
          : Promise.resolve([] as KnowledgeRow[])

      const [fleetRows, cloverRows] = await Promise.all([fleetPromise, cloverPromise])
      return [...fleetRows, ...cloverRows]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
        .map(adaptKnowledge)
    },
    refetchInterval: 60_000,
    enabled: (viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured,
  })
}
