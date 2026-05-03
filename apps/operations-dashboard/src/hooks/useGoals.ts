import { useQuery } from '@tanstack/react-query'
import {
  cloverOpsConfigured,
  cloverOpsSessionReady,
  cloverOpsSupabase,
  supabase,
  supabaseConfigured,
} from '../lib/supabase'
import { useVentureFilter, useVentureScope } from '../context/VentureFilterContext'
import type { AgentTaskRow, GoalRow, MasonCommitmentRow } from '../lib/types'
import {
  adaptCloverGoal,
  adaptCloverTask,
  fromCloverOpsId,
  isCloverOpsId,
  sortGoalsForDashboard,
  wantsCloverOps,
  type CloverGoalRow,
  type CloverTaskRow,
} from '../lib/cloverOps'

const GOAL_COLUMNS =
  'id, title, description, venture, department, owner, status, priority, target_date, notes, depends_on_goal_ids, success_criteria, created_at, updated_at, resolved_at, created_by'
const CLOVER_GOAL_COLUMNS =
  'id, public_key, title, description, department, owner, status, priority, target_date, success_criteria, notes, created_by, created_at, updated_at, resolved_at'
const CLOVER_TASK_COLUMNS =
  'id, ticket_key, goal_id, parent_task_id, title, description, acceptance_criteria, assigned_to, requested_by, department, status, priority, due_date, output, error, source_ref, started_at, completed_at, stale_notified_at, created_at, updated_at'

function warnCloverOps(label: string, error: { message?: string }) {
  console.warn(`[clover-ops] ${label} unavailable:`, error.message ?? error)
}

/**
 * All goals, optionally filtered by the current venture lens.
 * Used by the GoalsCard. Closed goals (done/dropped) are excluded by
 * default — pass `includeClosed: true` to surface them too.
 */
export function useGoals({ includeClosed = false } = {}) {
  const { viewRole } = useVentureFilter()
  const { ventures } = useVentureScope()
  return useQuery({
    queryKey: ['goals', viewRole, ventures?.join(',') ?? 'all', includeClosed],
    queryFn: async () => {
      const cloverReady = cloverOpsConfigured && (await cloverOpsSessionReady())
      const fleetPromise = viewRole === 'admin' && supabaseConfigured
        ? (async () => {
            let q = supabase
              .from('goals')
              .select(GOAL_COLUMNS)
              .order('priority', { ascending: true, nullsFirst: false })
              .order('target_date', { ascending: true, nullsFirst: false })
            if (ventures) q = q.in('venture', ventures)
            if (!includeClosed) q = q.not('status', 'in', '(done,dropped)')
            const { data, error } = await q
            if (error) throw error
            return (data ?? []) as GoalRow[]
          })()
        : Promise.resolve([] as GoalRow[])

      const cloverPromise =
        cloverReady && wantsCloverOps(ventures)
          ? (async () => {
              let q = cloverOpsSupabase
                .from('cd_goals')
                .select(CLOVER_GOAL_COLUMNS)
                .order('priority', { ascending: true, nullsFirst: false })
                .order('target_date', { ascending: true, nullsFirst: false })
              if (!includeClosed) q = q.not('status', 'in', '(done,dropped)')
              const { data, error } = await q
              if (error) {
                warnCloverOps('goals', error)
                return [] as GoalRow[]
              }
              return ((data ?? []) as CloverGoalRow[]).map(adaptCloverGoal)
            })()
          : Promise.resolve([] as GoalRow[])

      const [fleetRows, cloverRows] = await Promise.all([fleetPromise, cloverPromise])
      return sortGoalsForDashboard([...fleetRows, ...cloverRows])
    },
    refetchInterval: 60_000,
    enabled: (viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured,
  })
}

/**
 * Counts of linked tasks per goal (split into open vs done) so the
 * GoalsCard can render progress bars without loading every linked row.
 */
export interface GoalProgress {
  goal_id: string
  open_tasks: number
  done_tasks: number
  open_commitments: number
  done_commitments: number
}

export function useGoalsProgress(goalIds: string[]) {
  return useQuery({
    queryKey: ['goals-progress', goalIds.slice().sort().join(',')],
    queryFn: async (): Promise<Record<string, GoalProgress>> => {
      if (goalIds.length === 0) return {}
      const fleetGoalIds = goalIds.filter((id) => !isCloverOpsId(id))
      const cloverGoalIds = goalIds.filter(isCloverOpsId)
      const cloverReady = cloverOpsConfigured && (await cloverOpsSessionReady())

      const [tasksRes, commitsRes, cloverTasksRes] = await Promise.all([
        supabaseConfigured && fleetGoalIds.length > 0
          ? supabase.from('agent_tasks').select('goal_id, status').in('goal_id', fleetGoalIds)
          : Promise.resolve({ data: [], error: null }),
        supabaseConfigured && fleetGoalIds.length > 0
          ? supabase
              .from('mason_commitments')
              .select('goal_id, status')
              .in('goal_id', fleetGoalIds)
          : Promise.resolve({ data: [], error: null }),
        cloverReady && cloverGoalIds.length > 0
          ? cloverOpsSupabase
              .from('cd_tasks')
              .select('goal_id, status')
              .in('goal_id', cloverGoalIds.map(fromCloverOpsId))
          : Promise.resolve({ data: [], error: null }),
      ])
      if (tasksRes.error) throw tasksRes.error
      if (commitsRes.error) throw commitsRes.error
      if (cloverTasksRes.error) warnCloverOps('goal progress', cloverTasksRes.error)

      const out: Record<string, GoalProgress> = {}
      for (const id of goalIds) {
        out[id] = {
          goal_id: id,
          open_tasks: 0,
          done_tasks: 0,
          open_commitments: 0,
          done_commitments: 0,
        }
      }
      for (const t of (tasksRes.data ?? []) as { goal_id: string; status: string }[]) {
        if (!t.goal_id || !out[t.goal_id]) continue
        if (t.status === 'completed') out[t.goal_id].done_tasks += 1
        else if (t.status !== 'cancelled' && t.status !== 'failed')
          out[t.goal_id].open_tasks += 1
      }
      for (const t of (cloverTasksRes.data ?? []) as { goal_id: string; status: string }[]) {
        const dashboardGoalId = isCloverOpsId(t.goal_id) ? t.goal_id : `clover-ops:${t.goal_id}`
        if (!t.goal_id || !out[dashboardGoalId]) continue
        if (t.status === 'completed') out[dashboardGoalId].done_tasks += 1
        else if (t.status !== 'cancelled' && t.status !== 'failed')
          out[dashboardGoalId].open_tasks += 1
      }
      for (const c of (commitsRes.data ?? []) as {
        goal_id: string
        status: string
      }[]) {
        if (!c.goal_id || !out[c.goal_id]) continue
        if (c.status === 'done') out[c.goal_id].done_commitments += 1
        else if (c.status !== 'dropped') out[c.goal_id].open_commitments += 1
      }
      return out
    },
    refetchInterval: 60_000,
    enabled: (supabaseConfigured || cloverOpsConfigured) && goalIds.length > 0,
  })
}

/**
 * Single goal + everything linked to it. Used by the drawer detail view.
 */
export interface GoalDetail {
  goal: GoalRow
  tasks: AgentTaskRow[]
  commitments: MasonCommitmentRow[]
  /** Upstream goals this one depends on. Resolved from goal.depends_on_goal_ids. */
  dependsOn: GoalRow[]
}

export function useGoalDetail(id: string | null) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['goal-detail', viewRole, id],
    queryFn: async (): Promise<GoalDetail | null> => {
      if (!id) return null
      if (isCloverOpsId(id)) {
        const rawId = fromCloverOpsId(id)
        const [goalRes, tasksRes] = await Promise.all([
          cloverOpsSupabase
            .from('cd_goals')
            .select(CLOVER_GOAL_COLUMNS)
            .eq('id', rawId)
            .maybeSingle(),
          cloverOpsSupabase
            .from('cd_tasks')
            .select(CLOVER_TASK_COLUMNS)
            .eq('goal_id', rawId)
            .order('created_at', { ascending: false }),
        ])
        if (goalRes.error) throw goalRes.error
        if (tasksRes.error) throw tasksRes.error
        if (!goalRes.data) return null
        return {
          goal: adaptCloverGoal(goalRes.data as CloverGoalRow),
          tasks: ((tasksRes.data ?? []) as CloverTaskRow[]).map(adaptCloverTask),
          commitments: [],
          dependsOn: [],
        }
      }
      if (viewRole !== 'admin') return null

      const [goalRes, tasksRes, commitsRes] = await Promise.all([
        supabase.from('goals').select(GOAL_COLUMNS).eq('id', id).maybeSingle(),
        supabase
          .from('agent_tasks')
          .select('*')
          .eq('goal_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('mason_commitments')
          .select('*')
          .eq('goal_id', id)
          .order('created_at', { ascending: false }),
      ])
      if (goalRes.error) throw goalRes.error
      if (tasksRes.error) throw tasksRes.error
      if (commitsRes.error) throw commitsRes.error
      if (!goalRes.data) return null

      // Resolve upstream deps in a second round-trip (only when present —
      // most goals have none, so skip the query).
      const goal = goalRes.data as GoalRow
      let dependsOn: GoalRow[] = []
      if (goal.depends_on_goal_ids && goal.depends_on_goal_ids.length > 0) {
        const depsRes = await supabase
          .from('goals')
          .select(GOAL_COLUMNS)
          .in('id', goal.depends_on_goal_ids)
        if (depsRes.error) throw depsRes.error
        dependsOn = (depsRes.data ?? []) as GoalRow[]
      }

      return {
        goal,
        tasks: (tasksRes.data ?? []) as AgentTaskRow[],
        commitments: (commitsRes.data ?? []) as MasonCommitmentRow[],
        dependsOn,
      }
    },
    refetchInterval: 30_000,
    enabled:
      ((viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured) &&
      Boolean(id),
  })
}
