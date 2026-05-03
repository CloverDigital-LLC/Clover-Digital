/**
 * Per-agent data hooks for the Fleet Agent profile pages.
 * Read-only — every write still flows through fleet MCP / Mason action.
 */
import { useQuery } from '@tanstack/react-query'
import {
  cloverOpsConfigured,
  cloverOpsSessionReady,
  cloverOpsSupabase,
  supabase,
  supabaseConfigured,
} from '../lib/supabase'
import type {
  AgentTaskRow,
  AgentHeartbeatRow,
  KnowledgeRow,
} from '../lib/types'
import {
  adaptCloverKnowledge,
  adaptCloverTask,
  toCloverOpsId,
  type CloverKnowledgeRow,
  type CloverTaskRow,
} from '../lib/cloverOps'
import { useVentureFilter } from '../context/VentureFilterContext'

const REFRESH_MS = 60_000

const TASK_COLUMNS =
  'id, agent, status, title, description, venture, department, goal_id, priority, started_at, completed_at, created_at, assigned_to, due_date, output, error'
const CLOVER_TASK_COLUMNS =
  'id, ticket_key, goal_id, parent_task_id, title, description, acceptance_criteria, assigned_to, requested_by, department, status, priority, due_date, output, error, source_ref, started_at, completed_at, stale_notified_at, created_at, updated_at'
const CLOVER_KNOWLEDGE_COLUMNS =
  'id, category, title, content, source_agent, source_channel, visibility, tags, is_private, confidence, related_task_id, related_goal_id, superseded_by, expires_at, last_reinforced_at, created_at, updated_at'

function warnCloverOps(label: string, error: { message?: string }) {
  console.warn(`[clover-ops] ${label} unavailable:`, error.message ?? error)
}

// ─── Tasks ───────────────────────────────────────────────────────────

export interface AgentWorkBuckets {
  running: AgentTaskRow[]
  queued: AgentTaskRow[]
  blocked: AgentTaskRow[]
  recently_completed: AgentTaskRow[]
}

export function useAgentTasks(agentId: string) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['agent-tasks', viewRole, agentId],
    queryFn: async (): Promise<AgentWorkBuckets> => {
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 86_400_000,
      ).toISOString()
      const cloverReady = cloverOpsConfigured && (await cloverOpsSessionReady())
      const [openRes, doneRes, cloverOpenRes, cloverDoneRes] = await Promise.all([
        viewRole === 'admin' && supabaseConfigured
          ? supabase
              .from('agent_tasks')
              .select(TASK_COLUMNS)
              .or(`agent.eq.${agentId},assigned_to.eq.${agentId}`)
              .not('status', 'in', '(completed,cancelled,failed)')
              .order('created_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [], error: null }),
        viewRole === 'admin' && supabaseConfigured
          ? supabase
              .from('agent_tasks')
              .select(TASK_COLUMNS)
              .or(`agent.eq.${agentId},assigned_to.eq.${agentId}`)
              .eq('status', 'completed')
              .gte('completed_at', sevenDaysAgo)
              .order('completed_at', { ascending: false })
              .limit(20)
          : Promise.resolve({ data: [], error: null }),
        cloverReady
          ? cloverOpsSupabase
              .from('cd_tasks')
              .select(CLOVER_TASK_COLUMNS)
              .eq('assigned_to', agentId)
              .not('status', 'in', '(completed,cancelled,failed)')
              .order('created_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [], error: null }),
        cloverReady
          ? cloverOpsSupabase
              .from('cd_tasks')
              .select(CLOVER_TASK_COLUMNS)
              .eq('assigned_to', agentId)
              .eq('status', 'completed')
              .gte('completed_at', sevenDaysAgo)
              .order('completed_at', { ascending: false })
              .limit(20)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (openRes.error) throw openRes.error
      if (doneRes.error) throw doneRes.error
      if (cloverOpenRes.error) warnCloverOps('agent tasks', cloverOpenRes.error)
      if (cloverDoneRes.error) warnCloverOps('agent completed tasks', cloverDoneRes.error)
      const open = [
        ...((openRes.data ?? []) as AgentTaskRow[]),
        ...((cloverOpenRes.data ?? []) as CloverTaskRow[]).map(adaptCloverTask),
      ]
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
        recently_completed: [
          ...((doneRes.data ?? []) as AgentTaskRow[]),
          ...((cloverDoneRes.data ?? []) as CloverTaskRow[]).map(adaptCloverTask),
        ],
      }
    },
    refetchInterval: REFRESH_MS,
    enabled: (viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured,
  })
}

// ─── Messages (handoff panel) ────────────────────────────────────────

export interface AgentMessageRow {
  id: string
  from_agent: string
  to_agent: string
  message_type: string
  subject: string | null
  body: string | null
  acknowledged: boolean | null
  acknowledged_at: string | null
  created_at: string
}

export function useAgentMessages(agentId: string, limit = 12) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['agent-messages', viewRole, agentId, limit],
    queryFn: async (): Promise<AgentMessageRow[]> => {
      const { data, error } = await supabase
        .from('agent_messages')
        .select(
          'id, from_agent, to_agent, message_type, subject, body, acknowledged, acknowledged_at, created_at',
        )
        .or(`from_agent.eq.${agentId},to_agent.eq.${agentId}`)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as AgentMessageRow[]
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

// ─── Sessions ────────────────────────────────────────────────────────

export interface AgentSessionRow {
  id: string
  agent: string
  venture: string | null
  task_id: string | null
  summary: string | null
  outcome: string | null
  created_at: string
}

export function useAgentSessions(agentId: string, limit = 10) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['agent-sessions', viewRole, agentId, limit],
    queryFn: async (): Promise<AgentSessionRow[]> => {
      const { data, error } = await supabase
        .from('agent_sessions')
        .select('id, agent, venture, task_id, summary, outcome, created_at')
        .eq('agent', agentId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as AgentSessionRow[]
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

// ─── Latest heartbeat ────────────────────────────────────────────────

export function useAgentLatestHeartbeat(agentId: string) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['agent-latest-heartbeat', viewRole, agentId],
    queryFn: async (): Promise<AgentHeartbeatRow | null> => {
      const { data, error } = await supabase
        .from('agent_heartbeats')
        .select('*')
        .eq('agent', agentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data ?? null) as AgentHeartbeatRow | null
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

// ─── Per-agent specialty hooks ───────────────────────────────────────
//
// Each is scoped tightly to one agent's actual job. Used by the
// AgentSpecialty panel on the profile page.

export interface DerekPipelineStats {
  active_prospects: number
  qualified_total: number
  touched_7d: number
  top_recent: Array<{
    id: string
    business_name: string
    vertical: string | null
    fit_score: number | null
    status: string
    updated_at: string
  }>
}

export function useDerekPipelineStats() {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['derek-pipeline-stats', viewRole],
    queryFn: async (): Promise<DerekPipelineStats> => {
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 86_400_000,
      ).toISOString()
      const useCloverOps = cloverOpsConfigured && (await cloverOpsSessionReady())
      const client = useCloverOps
        ? cloverOpsSupabase
        : viewRole === 'admin' && supabaseConfigured
          ? supabase
          : null
      if (!client) {
        return {
          active_prospects: 0,
          qualified_total: 0,
          touched_7d: 0,
          top_recent: [],
        }
      }
      const [activeRes, qualifiedRes, touchedRes, topRes] = await Promise.all([
        client
          .from('cd_target_accounts')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'disqualified'),
        client
          .from('cd_target_accounts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'qualified'),
        client
          .from('cd_target_accounts')
          .select('id', { count: 'exact', head: true })
          .gte('updated_at', sevenDaysAgo),
        client
          .from('cd_target_accounts')
          .select('id, business_name, vertical, fit_score, status, updated_at')
          .gte('updated_at', sevenDaysAgo)
          .order('updated_at', { ascending: false })
          .limit(5),
      ])
      if (activeRes.error) throw activeRes.error
      if (qualifiedRes.error) throw qualifiedRes.error
      if (touchedRes.error) throw touchedRes.error
      if (topRes.error) throw topRes.error
      return {
        active_prospects: activeRes.count ?? 0,
        qualified_total: qualifiedRes.count ?? 0,
        touched_7d: touchedRes.count ?? 0,
        top_recent: ((topRes.data ?? []) as DerekPipelineStats['top_recent']).map((row) =>
          useCloverOps ? { ...row, id: toCloverOpsId(row.id) } : row,
        ),
      }
    },
    refetchInterval: REFRESH_MS,
    enabled: (viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured,
  })
}

export interface HermesCommsStats {
  routed_24h: number
  acked: number
  unacked: number
  by_type: Array<{ type: string; n: number }>
  top_partners: Array<{ agent: string; n: number }>
}

export function useHermesCommsStats() {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['hermes-comms-stats', viewRole],
    queryFn: async (): Promise<HermesCommsStats> => {
      const since = new Date(Date.now() - 24 * 3_600_000).toISOString()
      const { data, error } = await supabase
        .from('agent_messages')
        .select('id, from_agent, to_agent, message_type, acknowledged, created_at')
        .or('from_agent.eq.hermes,to_agent.eq.hermes')
        .gte('created_at', since)
        .limit(500)
      if (error) throw error
      const rows = (data ?? []) as Array<{
        from_agent: string
        to_agent: string
        message_type: string
        acknowledged: boolean | null
      }>
      const byType = new Map<string, number>()
      const partners = new Map<string, number>()
      let acked = 0
      let unacked = 0
      for (const r of rows) {
        byType.set(r.message_type, (byType.get(r.message_type) ?? 0) + 1)
        const counterpart = r.from_agent === 'hermes' ? r.to_agent : r.from_agent
        partners.set(counterpart, (partners.get(counterpart) ?? 0) + 1)
        if (r.acknowledged) acked += 1
        else unacked += 1
      }
      return {
        routed_24h: rows.length,
        acked,
        unacked,
        by_type: Array.from(byType.entries())
          .map(([type, n]) => ({ type, n }))
          .sort((a, b) => b.n - a.n),
        top_partners: Array.from(partners.entries())
          .map(([agent, n]) => ({ agent, n }))
          .sort((a, b) => b.n - a.n)
          .slice(0, 5),
      }
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

export interface BigHossBuildStats {
  recent_changes: Array<{
    id: string
    description: string | null
    change_type: string
    venture: string | null
    verified: boolean | null
    created_at: string
  }>
  deploys_7d: number
}

export function useBigHossBuildStats() {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['bighoss-build-stats', viewRole],
    queryFn: async (): Promise<BigHossBuildStats> => {
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 86_400_000,
      ).toISOString()
      const [recentRes, deployRes] = await Promise.all([
        supabase
          .from('change_log')
          .select('id, description, change_type, venture, verified, created_at')
          .eq('agent', 'bighoss')
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('change_log')
          .select('id', { count: 'exact', head: true })
          .eq('agent', 'bighoss')
          .gte('created_at', sevenDaysAgo)
          .ilike('change_type', '%deploy%'),
      ])
      if (recentRes.error) throw recentRes.error
      if (deployRes.error) throw deployRes.error
      return {
        recent_changes: (recentRes.data ?? []) as BigHossBuildStats['recent_changes'],
        deploys_7d: deployRes.count ?? 0,
      }
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

// ─── Knowledge authored ──────────────────────────────────────────────

export function useAgentKnowledge(agentId: string, limit = 8) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['agent-knowledge', viewRole, agentId, limit],
    queryFn: async (): Promise<KnowledgeRow[]> => {
      const [fleetRes, cloverRes] = await Promise.all([
        viewRole === 'admin' && supabaseConfigured
          ? supabase
              .from('knowledge')
              .select('*')
              .eq('source_agent', agentId)
              .order('created_at', { ascending: false })
              .limit(limit)
          : Promise.resolve({ data: [], error: null }),
        cloverOpsConfigured && (await cloverOpsSessionReady())
          ? cloverOpsSupabase
              .from('cd_knowledge')
              .select(CLOVER_KNOWLEDGE_COLUMNS)
              .eq('source_agent', agentId)
              .order('created_at', { ascending: false })
              .limit(limit)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (fleetRes.error) throw fleetRes.error
      if (cloverRes.error) warnCloverOps('agent knowledge', cloverRes.error)
      return [
        ...((fleetRes.data ?? []) as KnowledgeRow[]),
        ...((cloverRes.data ?? []) as CloverKnowledgeRow[]).map(adaptCloverKnowledge),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
    },
    refetchInterval: REFRESH_MS,
    enabled: (viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured,
  })
}
