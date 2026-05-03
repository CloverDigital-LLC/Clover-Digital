import { useQuery } from '@tanstack/react-query'
import {
  cloverOpsConfigured,
  cloverOpsSupabase,
  supabase,
  supabaseConfigured,
} from '../../lib/supabase'
import { MEMORY_PROPOSAL_SELECT } from '../../hooks/useMemoryProposals'
import type { DetailKind } from './DetailContext'
import type {
  AgentTaskRow,
  KnowledgeRow,
  MasonCommitmentRow,
  CdTargetAccountRow,
  AgentHeartbeatRow,
  GoalRow,
  MemoryProposalRow,
} from '../../lib/types'
import {
  adaptCloverGoal,
  adaptCloverKnowledge,
  adaptCloverTask,
  fromCloverOpsId,
  isCloverOpsId,
  type CloverGoalRow,
  type CloverKnowledgeRow,
  type CloverTaskRow,
} from '../../lib/cloverOps'
import { useVentureFilter } from '../../context/VentureFilterContext'

const CLOVER_TASK_COLUMNS =
  'id, ticket_key, goal_id, parent_task_id, title, description, acceptance_criteria, assigned_to, requested_by, department, status, priority, due_date, output, error, source_ref, started_at, completed_at, stale_notified_at, created_at, updated_at'
const CLOVER_GOAL_COLUMNS =
  'id, public_key, title, description, department, owner, status, priority, target_date, success_criteria, notes, created_by, created_at, updated_at, resolved_at'
const CLOVER_KNOWLEDGE_COLUMNS =
  'id, category, title, content, source_agent, source_channel, visibility, tags, is_private, confidence, related_task_id, related_goal_id, superseded_by, expires_at, last_reinforced_at, created_at, updated_at'

/**
 * Fetch the underlying record(s) for the drawer.
 * - `task` → one agent_tasks row
 * - `knowledge` → one knowledge row
 * - `commitment` → one mason_commitments row
 * - `account` → one cd_target_accounts row
 * - `agent` → all heartbeats for the agent over the last 24h (newest first)
 * - `proposal` → one memory_proposals row
 */
export function useItemDetail(kind: DetailKind | null, id: string | null) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['item-detail', viewRole, kind, id],
    enabled:
      ((viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured) &&
      Boolean(kind && id),
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!kind || !id) return null

      if (kind === 'task') {
        if (isCloverOpsId(id)) {
          const { data, error } = await cloverOpsSupabase
            .from('cd_tasks')
            .select(CLOVER_TASK_COLUMNS)
            .eq('id', fromCloverOpsId(id))
            .maybeSingle()
          if (error) throw error
          return {
            kind,
            row: data ? adaptCloverTask(data as CloverTaskRow) : null,
          }
        }
        if (viewRole !== 'admin') return { kind, row: null }
        const { data, error } = await supabase
          .from('agent_tasks')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (error) throw error
        return { kind, row: data as AgentTaskRow | null }
      }

      if (kind === 'knowledge') {
        if (isCloverOpsId(id)) {
          const { data, error } = await cloverOpsSupabase
            .from('cd_knowledge')
            .select(CLOVER_KNOWLEDGE_COLUMNS)
            .eq('id', fromCloverOpsId(id))
            .maybeSingle()
          if (error) throw error
          return {
            kind,
            row: data ? adaptCloverKnowledge(data as CloverKnowledgeRow) : null,
          }
        }
        if (viewRole !== 'admin') return { kind, row: null }
        const { data, error } = await supabase
          .from('knowledge')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (error) throw error
        return { kind, row: data as KnowledgeRow | null }
      }

      if (kind === 'commitment') {
        if (viewRole !== 'admin') return { kind, row: null }
        const { data, error } = await supabase
          .from('mason_commitments')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (error) throw error
        return { kind, row: data as MasonCommitmentRow | null }
      }

      if (kind === 'account') {
        if (isCloverOpsId(id)) {
          const { data, error } = await cloverOpsSupabase
            .from('cd_target_accounts')
            .select('*')
            .eq('id', fromCloverOpsId(id))
            .maybeSingle()
          if (error) throw error
          return { kind, row: data as CdTargetAccountRow | null }
        }
        if (viewRole !== 'admin') return { kind, row: null }
        const { data, error } = await supabase
          .from('cd_target_accounts')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (error) throw error
        return { kind, row: data as CdTargetAccountRow | null }
      }

      if (kind === 'agent') {
        if (viewRole !== 'admin') return { kind, row: null }
        const sinceIso = new Date(Date.now() - 24 * 3_600_000).toISOString()
        const { data, error } = await supabase
          .from('agent_heartbeats')
          .select('*')
          .eq('agent', id)
          .gte('created_at', sinceIso)
          .order('created_at', { ascending: false })
          .limit(50)
        if (error) throw error
        return {
          kind,
          row: { agent: id, beats: (data ?? []) as AgentHeartbeatRow[] },
        }
      }

      if (kind === 'proposal') {
        if (viewRole !== 'admin') return { kind, row: null }
        const { data, error } = await supabase
          .from('memory_proposals')
          .select(MEMORY_PROPOSAL_SELECT)
          .eq('id', id)
          .maybeSingle()
        if (error) throw error
        return { kind, row: data as MemoryProposalRow | null }
      }

      if (kind === 'goal') {
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
          if (!goalRes.data) return { kind, row: null }

          return {
            kind,
            row: {
              goal: adaptCloverGoal(goalRes.data as CloverGoalRow),
              tasks: ((tasksRes.data ?? []) as CloverTaskRow[]).map(adaptCloverTask),
              commitments: [],
              dependsOn: [] as GoalRow[],
            },
          }
        }
        if (viewRole !== 'admin') return { kind, row: null }
        const [goalRes, tasksRes, commitsRes] = await Promise.all([
          supabase.from('goals').select('*').eq('id', id).maybeSingle(),
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
        if (!goalRes.data) return { kind, row: null }

        // Resolve upstream dep goals (skip the round-trip when there are none).
        const goal = goalRes.data as GoalRow
        let dependsOn: GoalRow[] = []
        const depIds = goal.depends_on_goal_ids ?? []
        if (depIds.length > 0) {
          const depsRes = await supabase
            .from('goals')
            .select('*')
            .in('id', depIds)
          if (depsRes.error) throw depsRes.error
          dependsOn = (depsRes.data ?? []) as GoalRow[]
        }

        return {
          kind,
          row: {
            goal,
            tasks: (tasksRes.data ?? []) as AgentTaskRow[],
            commitments: (commitsRes.data ?? []) as MasonCommitmentRow[],
            dependsOn,
          },
        }
      }

      return null
    },
  })
}
