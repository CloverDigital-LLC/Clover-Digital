/**
 * Per-project (venture) data hooks. Foundation for the /projects/:slug
 * pages — every venture renders the same shape, then per-venture
 * specialty panels add what makes that venture different.
 *
 * Read-only.
 */
import { useQuery } from '@tanstack/react-query'
import {
  cloverOpsConfigured,
  supabase,
  supabaseConfigured,
} from '../lib/supabase'
import { cloverOpsReadReady, selectCloverOps } from '../lib/cloverOpsBridge'
import type {
  AgentTaskRow,
  KnowledgeRow,
  GoalRow,
} from '../lib/types'
import {
  adaptCloverGoal,
  adaptCloverKnowledge,
  adaptCloverTask,
  sortGoalsForDashboard,
  sortTasksNewestFirst,
  wantsCloverOps,
  type CloverGoalRow,
  type CloverKnowledgeRow,
  type CloverTaskRow,
} from '../lib/cloverOps'
import { useVentureFilter } from '../context/VentureFilterContext'
import { isCloverProject } from '../lib/dataRouting'

// ─── Project resources (project_registry) ────────────────────────────

export interface ProjectResource {
  id: string
  resource_type: string
  name: string | null
  value: string | null
  url: string | null
  notes: string | null
  is_sensitive: boolean | null
  verified_at: string | null
  verified_by: string | null
  created_at: string
  updated_at: string
}

export function useProjectResources(venture: string) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['project-resources', viewRole, venture],
    queryFn: async (): Promise<ProjectResource[]> => {
      const { data, error } = await supabase
        .from('project_registry')
        .select(
          'id, resource_type, name, value, url, notes, is_sensitive, verified_at, verified_by, created_at, updated_at',
        )
        .eq('venture', venture)
        .order('resource_type', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ProjectResource[]
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured && viewRole === 'admin' && Boolean(venture),
  })
}

const REFRESH_MS = 60_000

const TASK_COLUMNS =
  'id, agent, status, title, description, venture, department, priority, started_at, completed_at, created_at, assigned_to, due_date, output, error, goal_id, source_commitment_id, parent_task_id, requested_by, machine, project, plan_reviewed_by, plan_reviewed_at, code_reviewed_by, code_reviewed_at, acceptance_criteria, auto_routed, auto_tagged, stale_notified_at'
const CLOVER_TASK_COLUMNS =
  'id, ticket_key, goal_id, parent_task_id, title, description, acceptance_criteria, assigned_to, requested_by, department, status, priority, due_date, output, error, source_ref, started_at, completed_at, stale_notified_at, archived_at, archive_reason, created_at, updated_at'
const CLOVER_GOAL_COLUMNS =
  'id, public_key, title, description, department, owner, status, priority, target_date, success_criteria, notes, created_by, created_at, updated_at, resolved_at'
const CLOVER_KNOWLEDGE_COLUMNS =
  'id, category, title, content, source_agent, source_channel, visibility, tags, is_private, confidence, related_task_id, related_goal_id, superseded_by, expires_at, last_reinforced_at, created_at, updated_at'

function warnCloverOps(label: string, error: { message?: string }) {
  console.warn(`[clover-ops] ${label} unavailable:`, error.message ?? error)
}

export interface ProjectTaskBuckets {
  running: AgentTaskRow[]
  queued: AgentTaskRow[]
  blocked: AgentTaskRow[]
  recently_completed: AgentTaskRow[]
}

export function useProjectTasks(venture: string) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['project-tasks', viewRole, venture],
    queryFn: async (): Promise<ProjectTaskBuckets> => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
      const cloverReady = await cloverOpsReadReady()
      const fleetPromise = viewRole === 'admin' && supabaseConfigured && !isCloverProject(venture)
        ? (async () => {
            const [openRes, doneRes] = await Promise.all([
              supabase
                .from('agent_tasks')
                .select(TASK_COLUMNS)
                .eq('venture', venture)
                .not('status', 'in', '(completed,cancelled,failed)')
                .order('priority', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: false })
                .limit(80),
              supabase
                .from('agent_tasks')
                .select(TASK_COLUMNS)
                .eq('venture', venture)
                .eq('status', 'completed')
                .gte('completed_at', sevenDaysAgo)
                .order('completed_at', { ascending: false })
                .limit(20),
            ])
            if (openRes.error) throw openRes.error
            if (doneRes.error) throw doneRes.error
            return {
              open: (openRes.data ?? []) as AgentTaskRow[],
              done: (doneRes.data ?? []) as AgentTaskRow[],
            }
          })()
        : Promise.resolve({ open: [] as AgentTaskRow[], done: [] as AgentTaskRow[] })

      const cloverPromise =
        cloverReady && wantsCloverOps([venture])
          ? (async () => {
              const [openRes, doneRes] = await Promise.all([
                selectCloverOps<CloverTaskRow>('cd_tasks', CLOVER_TASK_COLUMNS, {
                  filters: [
                    { type: 'is', column: 'archived_at', value: null },
                    {
                      type: 'notIn',
                      column: 'status',
                      values: ['completed', 'cancelled', 'failed'],
                    },
                  ],
                  order: [
                    { column: 'priority', ascending: true, nullsFirst: false },
                    { column: 'created_at', ascending: false },
                  ],
                  limit: 80,
                }),
                selectCloverOps<CloverTaskRow>('cd_tasks', CLOVER_TASK_COLUMNS, {
                  filters: [
                    { type: 'is', column: 'archived_at', value: null },
                    { type: 'eq', column: 'status', value: 'completed' },
                    { type: 'gte', column: 'completed_at', value: sevenDaysAgo },
                  ],
                  order: [{ column: 'completed_at', ascending: false }],
                  limit: 20,
                }),
              ])
              if (openRes.error || doneRes.error) {
                warnCloverOps('project tasks', openRes.error ?? doneRes.error!)
                return { open: [] as AgentTaskRow[], done: [] as AgentTaskRow[] }
              }
              return {
                open: ((openRes.data ?? []) as CloverTaskRow[]).map(adaptCloverTask),
                done: ((doneRes.data ?? []) as CloverTaskRow[]).map(adaptCloverTask),
              }
            })()
          : Promise.resolve({ open: [] as AgentTaskRow[], done: [] as AgentTaskRow[] })

      const [fleetRows, cloverRows] = await Promise.all([fleetPromise, cloverPromise])
      const open = sortTasksNewestFirst([...fleetRows.open, ...cloverRows.open])
      return {
        running: open.filter(
          (t) =>
            t.status === 'running' ||
            t.status === 'researching' ||
            t.status === 'planned' ||
            t.status === 'plan_review' ||
            t.status === 'code_review' ||
            t.status === 'testing' ||
            t.status === 'deploying',
        ),
        queued: open.filter((t) => t.status === 'queued'),
        blocked: open.filter((t) => t.status === 'blocked'),
        recently_completed: sortTasksNewestFirst([...fleetRows.done, ...cloverRows.done]),
      }
    },
    refetchInterval: REFRESH_MS,
    enabled:
      ((viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured) &&
      Boolean(venture),
  })
}

export function useProjectGoals(venture: string) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['project-goals', viewRole, venture],
    queryFn: async (): Promise<GoalRow[]> => {
      const cloverReady = await cloverOpsReadReady()
      const fleetPromise = viewRole === 'admin' && supabaseConfigured && !isCloverProject(venture)
        ? (async () => {
            const { data, error } = await supabase
              .from('goals')
              .select('*')
              .eq('venture', venture)
              .order('priority', { ascending: true, nullsFirst: false })
              .order('target_date', { ascending: true, nullsFirst: false })
            if (error) throw error
            return (data ?? []) as GoalRow[]
          })()
        : Promise.resolve([] as GoalRow[])

      const cloverPromise =
        cloverReady && wantsCloverOps([venture])
          ? (async () => {
              const { data, error } = await selectCloverOps<CloverGoalRow>(
                'cd_goals',
                CLOVER_GOAL_COLUMNS,
                {
                  order: [
                    { column: 'priority', ascending: true, nullsFirst: false },
                    { column: 'target_date', ascending: true, nullsFirst: false },
                  ],
                },
              )
              if (error) {
                warnCloverOps('project goals', error)
                return [] as GoalRow[]
              }
              return ((data ?? []) as CloverGoalRow[]).map(adaptCloverGoal)
            })()
          : Promise.resolve([] as GoalRow[])

      const [fleetRows, cloverRows] = await Promise.all([fleetPromise, cloverPromise])
      return sortGoalsForDashboard([...fleetRows, ...cloverRows])
    },
    refetchInterval: REFRESH_MS,
    enabled:
      ((viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured) &&
      Boolean(venture),
  })
}

export function useProjectKnowledge(venture: string, limit = 12) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['project-knowledge', viewRole, venture, limit],
    queryFn: async (): Promise<KnowledgeRow[]> => {
      const cloverReady = await cloverOpsReadReady()
      const fleetPromise = viewRole === 'admin' && supabaseConfigured && !isCloverProject(venture)
        ? (async () => {
            const { data, error } = await supabase
              .from('knowledge')
              .select('*')
              .eq('project', venture)
              .order('created_at', { ascending: false })
              .limit(limit)
            if (error) throw error
            return (data ?? []) as KnowledgeRow[]
          })()
        : Promise.resolve([] as KnowledgeRow[])

      const cloverPromise =
        cloverReady && wantsCloverOps([venture])
          ? (async () => {
              const { data, error } = await selectCloverOps<CloverKnowledgeRow>(
                'cd_knowledge',
                CLOVER_KNOWLEDGE_COLUMNS,
                {
                  order: [{ column: 'created_at', ascending: false }],
                  limit,
                },
              )
              if (error) {
                warnCloverOps('project knowledge', error)
                return [] as KnowledgeRow[]
              }
              return ((data ?? []) as CloverKnowledgeRow[]).map(adaptCloverKnowledge)
            })()
          : Promise.resolve([] as KnowledgeRow[])

      const [fleetRows, cloverRows] = await Promise.all([fleetPromise, cloverPromise])
      return [...fleetRows, ...cloverRows]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
    },
    refetchInterval: REFRESH_MS,
    enabled:
      ((viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured) &&
      Boolean(venture),
  })
}

/**
 * Which agents have touched this project recently? Joins distinct
 * agent values across tasks + sessions + knowledge (any non-null
 * source) over the last 30 days.
 */
export function useProjectAgents(venture: string) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['project-agents', viewRole, venture],
    queryFn: async (): Promise<Array<{ agent: string; touch_count: number }>> => {
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
      const cloverReady = await cloverOpsReadReady()
      const [tasksRes, sessionsRes, knowledgeRes, cloverTasksRes, cloverKnowledgeRes] = await Promise.all([
        viewRole === 'admin' && supabaseConfigured
          && !isCloverProject(venture)
          ? supabase
              .from('agent_tasks')
              .select('agent, assigned_to')
              .eq('venture', venture)
              .gte('created_at', since)
          : Promise.resolve({ data: [], error: null }),
        viewRole === 'admin' && supabaseConfigured
          ? supabase
              .from('agent_sessions')
              .select('agent')
              .eq('venture', venture)
              .gte('created_at', since)
          : Promise.resolve({ data: [], error: null }),
        viewRole === 'admin' && supabaseConfigured
          ? supabase
              .from('knowledge')
              .select('source_agent')
              .eq('project', venture)
              .gte('created_at', since)
          : Promise.resolve({ data: [], error: null }),
        cloverReady && wantsCloverOps([venture])
          ? selectCloverOps<{ assigned_to: string | null }>(
              'cd_tasks',
              'assigned_to',
              {
                filters: [
                  { type: 'is', column: 'archived_at', value: null },
                  { type: 'gte', column: 'created_at', value: since },
                ],
              },
            )
          : Promise.resolve({ data: [], error: null }),
        cloverReady && wantsCloverOps([venture])
          ? selectCloverOps<{ source_agent: string | null }>(
              'cd_knowledge',
              'source_agent',
              {
                filters: [{ type: 'gte', column: 'created_at', value: since }],
              },
            )
          : Promise.resolve({ data: [], error: null }),
      ])
      // Sessions / knowledge may fail silently if RLS blocks; treat as empty.
      const counts = new Map<string, number>()
      for (const t of (tasksRes.data ?? []) as Array<{ agent: string | null; assigned_to: string | null }>) {
        if (t.agent) counts.set(t.agent, (counts.get(t.agent) ?? 0) + 1)
        if (t.assigned_to && t.assigned_to !== t.agent)
          counts.set(t.assigned_to, (counts.get(t.assigned_to) ?? 0) + 1)
      }
      for (const s of (sessionsRes.data ?? []) as Array<{ agent: string }>) {
        counts.set(s.agent, (counts.get(s.agent) ?? 0) + 1)
      }
      for (const k of (knowledgeRes.data ?? []) as Array<{ source_agent: string | null }>) {
        if (k.source_agent) counts.set(k.source_agent, (counts.get(k.source_agent) ?? 0) + 1)
      }
      if (cloverTasksRes.error) warnCloverOps('project agents tasks', cloverTasksRes.error)
      if (cloverKnowledgeRes.error) warnCloverOps('project agents knowledge', cloverKnowledgeRes.error)
      for (const t of (cloverTasksRes.data ?? []) as Array<{ assigned_to: string | null }>) {
        if (t.assigned_to) counts.set(t.assigned_to, (counts.get(t.assigned_to) ?? 0) + 1)
      }
      for (const k of (cloverKnowledgeRes.data ?? []) as Array<{ source_agent: string | null }>) {
        if (k.source_agent) counts.set(k.source_agent, (counts.get(k.source_agent) ?? 0) + 1)
      }
      return Array.from(counts.entries())
        .map(([agent, touch_count]) => ({ agent, touch_count }))
        .sort((a, b) => b.touch_count - a.touch_count)
    },
    refetchInterval: REFRESH_MS,
    enabled:
      ((viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured) &&
      Boolean(venture),
  })
}
