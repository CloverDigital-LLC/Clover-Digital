import { useQuery } from '@tanstack/react-query'
import {
  cloverOpsConfigured,
  supabase,
  supabaseConfigured,
} from '../lib/supabase'
import { cloverOpsReadReady, selectCloverOps } from '../lib/cloverOpsBridge'
import type { AgentTaskRow, Venture } from '../lib/types'
import {
  useVentureFilter,
  useVentureScope,
} from '../context/VentureFilterContext'
import {
  adaptCloverTask,
  sortTasksNewestFirst,
  wantsCloverOps,
  type CloverTaskRow,
} from '../lib/cloverOps'
import { CLOVER_PROJECT_FILTER, withoutCloverVentures } from '../lib/dataRouting'

const REFRESH_MS = 30_000

const TEAM_VENTURES: Venture[] = ['clover-digital']

const TASK_COLUMNS =
  'id, agent, status, title, description, venture, department, goal_id, priority, started_at, completed_at, created_at, assigned_to, due_date'

const CLOVER_TASK_COLUMNS =
  'id, ticket_key, goal_id, parent_task_id, title, description, acceptance_criteria, assigned_to, requested_by, department, status, priority, due_date, output, error, source_ref, started_at, completed_at, stale_notified_at, archived_at, archive_reason, created_at, updated_at'

function warnCloverOps(label: string, error: { message?: string }) {
  console.warn(`[clover-ops] ${label} unavailable:`, error.message ?? error)
}

function fleetVenturesForScope(
  ventures: string[] | null | undefined,
): string[] | null {
  return withoutCloverVentures(ventures)
}

export function useActiveWork() {
  const { viewRole } = useVentureFilter()
  const { ventures } = useVentureScope()
  return useQuery({
    queryKey: ['active-work', viewRole, ventures?.join(',') ?? 'all'],
    queryFn: async () => {
      const cloverReady = await cloverOpsReadReady()
      const fleetVentures = fleetVenturesForScope(ventures)
      const fleetPromise = viewRole === 'admin' && supabaseConfigured
        ? (async () => {
            if (fleetVentures?.length === 0) return [] as AgentTaskRow[]
            let q = supabase
              .from('agent_tasks')
              .select(TASK_COLUMNS)
              .not('status', 'in', '(completed,cancelled,failed)')
              .order('created_at', { ascending: false })
              .limit(15)
            if (fleetVentures) q = q.in('venture', fleetVentures)
            else q = q.not('venture', 'in', CLOVER_PROJECT_FILTER)
            const { data, error } = await q
            if (error) throw error
            return (data ?? []) as AgentTaskRow[]
          })()
        : Promise.resolve([] as AgentTaskRow[])

      const cloverPromise =
        cloverReady && wantsCloverOps(ventures)
          ? (async () => {
              const { data, error } = await selectCloverOps<CloverTaskRow>(
                'cd_tasks',
                CLOVER_TASK_COLUMNS,
                {
                  filters: [
                    { type: 'is', column: 'archived_at', value: null },
                    {
                      type: 'notIn',
                      column: 'status',
                      values: ['completed', 'cancelled', 'failed'],
                    },
                  ],
                  order: [{ column: 'created_at', ascending: false }],
                  limit: 15,
                },
              )
              if (error) {
                warnCloverOps('active tasks', error)
                return [] as AgentTaskRow[]
              }
              return ((data ?? []) as CloverTaskRow[]).map(adaptCloverTask)
            })()
          : Promise.resolve([] as AgentTaskRow[])

      const [fleetRows, cloverRows] = await Promise.all([fleetPromise, cloverPromise])
      return sortTasksNewestFirst([...fleetRows, ...cloverRows]).slice(0, 15)
    },
    refetchInterval: REFRESH_MS,
    enabled: (viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured,
  })
}

export function useRecentlyShipped(daysBack = 7) {
  const { viewRole } = useVentureFilter()
  const { ventures } = useVentureScope()
  return useQuery({
    queryKey: ['recently-shipped', daysBack, viewRole, ventures?.join(',') ?? 'all'],
    queryFn: async () => {
      const since = new Date(Date.now() - daysBack * 86_400_000).toISOString()
      const cloverReady = await cloverOpsReadReady()
      const fleetVentures = fleetVenturesForScope(ventures)
      const fleetPromise = viewRole === 'admin' && supabaseConfigured
        ? (async () => {
            if (fleetVentures?.length === 0) return [] as AgentTaskRow[]
            let q = supabase
              .from('agent_tasks')
              .select(TASK_COLUMNS)
              .eq('status', 'completed')
              .gte('completed_at', since)
              .order('completed_at', { ascending: false })
              .limit(20)
            if (fleetVentures) q = q.in('venture', fleetVentures)
            else q = q.not('venture', 'in', CLOVER_PROJECT_FILTER)
            const { data, error } = await q
            if (error) throw error
            return (data ?? []) as AgentTaskRow[]
          })()
        : Promise.resolve([] as AgentTaskRow[])

      const cloverPromise =
        cloverReady && wantsCloverOps(ventures)
          ? (async () => {
              const { data, error } = await selectCloverOps<CloverTaskRow>(
                'cd_tasks',
                CLOVER_TASK_COLUMNS,
                {
                  filters: [
                    { type: 'is', column: 'archived_at', value: null },
                    { type: 'eq', column: 'status', value: 'completed' },
                    { type: 'gte', column: 'completed_at', value: since },
                  ],
                  order: [{ column: 'completed_at', ascending: false }],
                  limit: 20,
                },
              )
              if (error) {
                warnCloverOps('recently shipped tasks', error)
                return [] as AgentTaskRow[]
              }
              return ((data ?? []) as CloverTaskRow[]).map(adaptCloverTask)
            })()
          : Promise.resolve([] as AgentTaskRow[])

      const [fleetRows, cloverRows] = await Promise.all([fleetPromise, cloverPromise])
      return sortTasksNewestFirst([...fleetRows, ...cloverRows]).slice(0, 20)
    },
    refetchInterval: REFRESH_MS,
    enabled: (viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured,
  })
}

/**
 * Cross-venture (admin section): tasks NOT in the team-default scope.
 * Independent of the active venture chip — this card is always
 * "Mason's other ventures."
 */
export function useCrossVentureWork() {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['cross-venture'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select(TASK_COLUMNS)
        .not('venture', 'in', CLOVER_PROJECT_FILTER)
        .not('status', 'in', '(completed,cancelled,failed)')
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []) as AgentTaskRow[]
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

export function useBlockedTasks() {
  const { viewRole } = useVentureFilter()
  const { ventures } = useVentureScope()
  return useQuery({
    queryKey: ['blocked-tasks', viewRole, ventures?.join(',') ?? 'all'],
    queryFn: async () => {
      const cloverReady = await cloverOpsReadReady()
      const fleetVentures = fleetVenturesForScope(ventures)
      const fleetPromise = viewRole === 'admin' && supabaseConfigured
        ? (async () => {
            if (fleetVentures?.length === 0) return [] as AgentTaskRow[]
            let q = supabase
              .from('agent_tasks')
              .select(TASK_COLUMNS)
              .eq('status', 'blocked')
              .order('created_at', { ascending: false })
              .limit(20)
            if (fleetVentures) q = q.in('venture', fleetVentures)
            else q = q.not('venture', 'in', CLOVER_PROJECT_FILTER)
            const { data, error } = await q
            if (error) throw error
            return (data ?? []) as AgentTaskRow[]
          })()
        : Promise.resolve([] as AgentTaskRow[])

      const cloverPromise =
        cloverReady && wantsCloverOps(ventures)
          ? (async () => {
              const { data, error } = await selectCloverOps<CloverTaskRow>(
                'cd_tasks',
                CLOVER_TASK_COLUMNS,
                {
                  filters: [
                    { type: 'is', column: 'archived_at', value: null },
                    { type: 'eq', column: 'status', value: 'blocked' },
                  ],
                  order: [{ column: 'created_at', ascending: false }],
                  limit: 20,
                },
              )
              if (error) {
                warnCloverOps('blocked tasks', error)
                return [] as AgentTaskRow[]
              }
              return ((data ?? []) as CloverTaskRow[]).map(adaptCloverTask)
            })()
          : Promise.resolve([] as AgentTaskRow[])

      const [fleetRows, cloverRows] = await Promise.all([fleetPromise, cloverPromise])
      return sortTasksNewestFirst([...fleetRows, ...cloverRows]).slice(0, 20)
    },
    refetchInterval: REFRESH_MS,
    enabled: (viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured,
  })
}

/**
 * All tasks active or shipped within `daysBack` days. Used by the
 * briefing's project status bars.
 *
 * - team view: scope to clover-digital so cofounders don't see other ventures
 * - admin view: no filter, every venture visible
 */
export function useTasksInWindow(daysBack = 7) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['tasks-in-window', daysBack, viewRole],
    queryFn: async () => {
      const since = new Date(Date.now() - daysBack * 86_400_000).toISOString()
      const scope = viewRole === 'team' ? TEAM_VENTURES : null
      const cloverReady = await cloverOpsReadReady()
      const fleetPromise = viewRole === 'admin' && supabaseConfigured
        ? (async () => {
            let q = supabase
              .from('agent_tasks')
              .select(TASK_COLUMNS)
              .or(`created_at.gte.${since},completed_at.gte.${since}`)
              .limit(500)
            if (scope) q = q.in('venture', scope)
            else q = q.not('venture', 'in', CLOVER_PROJECT_FILTER)
            const { data, error } = await q
            if (error) throw error
            return (data ?? []) as AgentTaskRow[]
          })()
        : Promise.resolve([] as AgentTaskRow[])

      const cloverPromise =
        cloverReady && wantsCloverOps(scope)
          ? (async () => {
              const { data, error } = await selectCloverOps<CloverTaskRow>(
                'cd_tasks',
                CLOVER_TASK_COLUMNS,
                {
                  filters: [
                    { type: 'is', column: 'archived_at', value: null },
                    { type: 'or', value: `created_at.gte.${since},completed_at.gte.${since}` },
                  ],
                  limit: 500,
                },
              )
              if (error) {
                warnCloverOps('task window', error)
                return [] as AgentTaskRow[]
              }
              return ((data ?? []) as CloverTaskRow[]).map(adaptCloverTask)
            })()
          : Promise.resolve([] as AgentTaskRow[])

      const [fleetRows, cloverRows] = await Promise.all([fleetPromise, cloverPromise])
      return sortTasksNewestFirst([...fleetRows, ...cloverRows])
    },
    refetchInterval: REFRESH_MS,
    enabled: (viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured,
  })
}
