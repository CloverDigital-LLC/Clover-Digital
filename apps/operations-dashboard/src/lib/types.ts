/**
 * Live database row types — match the actual prairie-fleet Postgres schema.
 *
 * Source of truth: schema audit run 2026-04-27. See SCHEMA_MAPPING.md for
 * the design-shape ↔ DB-row reconciliation.
 *
 * IMPORTANT: don't add fields here that don't exist in the DB. If the
 * dashboard needs a derived value (drift_days, normalized 1-5 score,
 * "running" status), put it in the adapter layer (lib/adapters.ts), not here.
 */

// ----- agent_tasks -----
export type AgentTaskStatus =
  | 'queued'
  | 'researching'
  | 'planned'
  | 'plan_review'
  | 'running'
  | 'code_review'
  | 'testing'
  | 'deploying'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled'

export type AgentTaskPriority = 'critical' | 'high' | 'normal' | 'low'

/**
 * Canonical venture key is `clover-digital` (post-rebrand 2026-04-29).
 * `prairie-digital` is still accepted by the DB CHECK constraint until
 * Phase C cleanup but no rows write to it anymore.
 */
export type Venture =
  | 'clover-digital'
  | 'prairie-digital' // legacy
  | 'gate-404'
  | 'abstract'
  | 'fleet'
  | 'yatsu-gaming'

export type Agent =
  | 'bighoss'
  | 'hermes'
  | 'derek'
  | 'claude-code'
  | 'codex'
  | 'archivist'
  | 'mason'

export interface AgentTaskRow {
  id: string
  agent: Agent | null
  machine: string | null
  project: string | null
  status: AgentTaskStatus
  title: string
  description: string | null
  output: string | null
  error: string | null
  requested_by: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  venture: Venture | null
  /** First-class department classification. Wins over agent-based inference. */
  department: Department | 'unassigned' | null
  goal_id: string | null
  parent_task_id: string | null
  assigned_to: Agent | null
  due_date: string | null
  priority: AgentTaskPriority | null
  plan_reviewed_by: string | null
  plan_reviewed_at: string | null
  code_reviewed_by: string | null
  code_reviewed_at: string | null
  acceptance_criteria: string | null
  source_commitment_id: string | null
  auto_routed: boolean | null
  auto_tagged: boolean | null
  stale_notified_at: string | null
}

// ----- knowledge -----
export type KnowledgeCategory =
  | 'research'
  | 'decision'
  | 'contact'
  | 'client'
  | 'task'
  | 'reference'
  | 'insight'
  | 'status'

export type KnowledgeProject =
  | 'clover-digital'
  | 'prairie-digital' // legacy
  | 'gate-404'
  | 'abstract'
  | 'fleet'
  | 'personal'
  | 'yatsu-gaming'

export interface KnowledgeRow {
  id: string
  project: KnowledgeProject
  category: KnowledgeCategory
  title: string
  content: string
  source_agent: string | null
  source_machine: string | null
  source_channel: string | null
  tags: string[] | null
  is_private: boolean | null
  expires_at: string | null
  created_at: string
  updated_at: string | null
  scope: string | null
  confidence: number | null
  last_reinforced_at: string | null
  session_id: string | null
  superseded_by: string | null
}

// ----- mason_commitments -----
export type CommitmentStatus =
  | 'open'
  | 'in_progress'
  | 'done'
  | 'dropped'
  | 'delegated'

export interface MasonCommitmentRow {
  id: string
  commitment: string
  context: string | null
  venture: Venture | null
  status: CommitmentStatus
  delegated_to: string | null
  source_agent: string | null
  due_date: string | null
  surfaced_count: number | null
  last_surfaced_at: string | null
  created_at: string
  resolved_at: string | null
}

// ----- agent_heartbeats -----
export type HeartbeatStatus = 'idle' | 'working' | 'blocked' | 'offline'

export interface AgentHeartbeatRow {
  id: string
  agent: Agent
  machine: string | null
  status: HeartbeatStatus
  current_task: string | null
  uptime_hours: number | null
  memory_usage_mb: number | null
  created_at: string
}

// ----- cd_target_accounts (rich pipeline) -----
export type CdAccountStatus = 'new' | 'qualified' | 'disqualified' | string

export interface CdTargetAccountRow {
  id: string
  business_name: string
  vertical: string | null
  sub_vertical: string | null
  location_city: string | null
  location_state: string | null
  location_country: string | null
  fit_score: number | null
  demand_signal_score: number | null
  pain_signal_score: number | null
  money_signal_score: number | null
  contactability_score: number | null
  priority: 'high' | 'normal' | 'low' | string | null
  status: CdAccountStatus
  qualification_summary: string | null
  why_this_lead: string | null
  offer_angle: string | null
  monthly_value_hypothesis_cents: number | null
  assigned_agent: string | null
  owner_team: string | null
  researched_by_agent: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

// ----- goals -----
export type GoalStatus =
  | 'planned'
  | 'in_progress'
  | 'blocked'
  | 'done'
  | 'dropped'

export type GoalPriority = 'critical' | 'high' | 'normal' | 'low'

export type Department = 'product-eng' | 'marketing' | 'sales' | 'ops'

export interface GoalRow {
  id: string
  title: string
  description: string | null
  venture: Venture | null
  department: Department | null
  owner: string | null
  status: GoalStatus
  priority: GoalPriority | null
  target_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  created_by: string | null
  /** Other goals that must be done before this one. Surfaced in GoalDetail. */
  depends_on_goal_ids: string[]
  /** Plain-language definition of "done" — the evidence we need. */
  success_criteria: string | null
}

// ----- artifacts (files attached to any dashboard record, many-to-many) -----
export type ArtifactParentKind =
  | 'knowledge'
  | 'task'
  | 'goal'
  | 'commitment'
  | 'account'

/** A file in Storage. Independent of which records reference it. */
export interface ArtifactRow {
  id: string
  bucket: string
  storage_path: string
  name: string | null
  description: string | null
  mime_type: string | null
  size_bytes: number | null
  tags: string[] | null
  uploaded_by: string | null
  created_at: string
}

/** Join row: one artifact ↔ one record. Many of these per artifact. */
export interface ArtifactLinkRow {
  artifact_id: string
  parent_kind: ArtifactParentKind
  parent_id: string
  role: string | null
  linked_by: string | null
  created_at: string
}

// ----- daily_briefs -----
export interface DailyBriefRow {
  id: string
  brief_date: string
  telegram_summary: string | null
  imessage_summary: string | null
  github_summary: string | null
  notion_summary: string | null
  discord_summary: string | null
  fleet_status: string | null
  full_brief: string | null
  action_items: string[] | null
  created_at: string
}

// ----- memory_proposals -----
export type MemoryProposalStatus = 'pending' | 'approved' | 'rejected' | string

export interface MemoryProposalRow {
  id: string
  proposed_by: string | null
  proposal_type: string | null
  target_knowledge_id: string | null
  related_knowledge_ids: string[] | null
  payload: Record<string, unknown> | null
  rationale: string | null
  status: MemoryProposalStatus
  reviewed_at: string | null
  reviewed_by: string | null
  auto_approvable: boolean | null
  created_at: string
}
