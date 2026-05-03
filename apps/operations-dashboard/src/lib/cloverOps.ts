import type {
  Agent,
  AgentTaskPriority,
  AgentTaskRow,
  AgentTaskStatus,
  Department,
  GoalPriority,
  GoalRow,
  GoalStatus,
  KnowledgeCategory,
  KnowledgeRow,
} from './types'

export const CLOVER_OPS_ID_PREFIX = 'clover-ops:'

export function toCloverOpsId(id: string): string {
  return id.startsWith(CLOVER_OPS_ID_PREFIX) ? id : `${CLOVER_OPS_ID_PREFIX}${id}`
}

export function isCloverOpsId(id: string | null | undefined): boolean {
  return Boolean(id?.startsWith(CLOVER_OPS_ID_PREFIX))
}

export function fromCloverOpsId(id: string): string {
  return id.startsWith(CLOVER_OPS_ID_PREFIX)
    ? id.slice(CLOVER_OPS_ID_PREFIX.length)
    : id
}

export function wantsCloverOps(scope: string[] | null | undefined): boolean {
  return !scope || scope.includes('clover-digital') || scope.includes('prairie-digital')
}

export type CloverTaskRow = {
  id: string
  ticket_key: string | null
  goal_id: string | null
  parent_task_id: string | null
  title: string
  description: string | null
  acceptance_criteria: string | null
  assigned_to: Agent | null
  requested_by: string | null
  department: Department | 'unassigned' | null
  status: AgentTaskStatus
  priority: AgentTaskPriority | null
  due_date: string | null
  output: string | null
  error: string | null
  source_ref: string | null
  started_at: string | null
  completed_at: string | null
  stale_notified_at: string | null
  archived_at: string | null
  archive_reason: string | null
  created_at: string
  updated_at: string
}

export type CloverGoalRow = {
  id: string
  public_key: string | null
  title: string
  description: string | null
  department: Department | 'unassigned' | null
  owner: string | null
  status: GoalStatus
  priority: GoalPriority | null
  target_date: string | null
  success_criteria: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export type CloverKnowledgeRow = {
  id: string
  category: string
  title: string
  content: string
  source_agent: string | null
  source_channel: string | null
  visibility: string
  tags: string[] | null
  is_private: boolean | null
  confidence: number | null
  related_task_id: string | null
  related_goal_id: string | null
  superseded_by: string | null
  expires_at: string | null
  last_reinforced_at: string | null
  created_at: string
  updated_at: string | null
}

const KNOWLEDGE_CATEGORIES = new Set<KnowledgeCategory>([
  'research',
  'decision',
  'contact',
  'client',
  'task',
  'reference',
  'insight',
  'status',
])

function displayTitle(key: string | null, title: string): string {
  return key ? `${key}: ${title}` : title
}

function departmentOrNull(
  department: Department | 'unassigned' | null,
): Department | null {
  return department === 'unassigned' ? null : department
}

export function adaptCloverTask(row: CloverTaskRow): AgentTaskRow {
  return {
    id: toCloverOpsId(row.id),
    agent: row.assigned_to,
    machine: 'clover-ops',
    project: row.ticket_key ?? 'clover-ops',
    status: row.status,
    title: displayTitle(row.ticket_key, row.title),
    description: row.description,
    output: row.output,
    error: row.error,
    requested_by: row.requested_by,
    started_at: row.started_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    venture: 'clover-digital',
    department: row.department,
    parent_task_id: row.parent_task_id ? toCloverOpsId(row.parent_task_id) : null,
    assigned_to: row.assigned_to,
    due_date: row.due_date,
    priority: row.priority,
    goal_id: row.goal_id ? toCloverOpsId(row.goal_id) : null,
    plan_reviewed_by: null,
    plan_reviewed_at: null,
    code_reviewed_by: null,
    code_reviewed_at: null,
    acceptance_criteria: row.acceptance_criteria,
    source_commitment_id: row.source_ref,
    auto_routed: null,
    auto_tagged: null,
    stale_notified_at: row.stale_notified_at,
  }
}

export function adaptCloverGoal(row: CloverGoalRow): GoalRow {
  return {
    id: toCloverOpsId(row.id),
    title: displayTitle(row.public_key, row.title),
    description: row.description,
    venture: 'clover-digital',
    department: departmentOrNull(row.department),
    owner: row.owner,
    status: row.status,
    priority: row.priority,
    target_date: row.target_date,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    resolved_at: row.resolved_at,
    created_by: row.created_by,
    depends_on_goal_ids: [],
    success_criteria: row.success_criteria,
  }
}

export function adaptCloverKnowledge(row: CloverKnowledgeRow): KnowledgeRow {
  const category = KNOWLEDGE_CATEGORIES.has(row.category as KnowledgeCategory)
    ? (row.category as KnowledgeCategory)
    : 'insight'
  return {
    id: toCloverOpsId(row.id),
    project: 'clover-digital',
    category,
    title: row.title,
    content: row.content,
    source_agent: row.source_agent,
    source_machine: 'clover-ops',
    source_channel: row.source_channel,
    tags: row.tags,
    is_private: row.is_private,
    expires_at: row.expires_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    scope: row.visibility === 'private' ? 'private' : 'venture',
    confidence: row.confidence,
    last_reinforced_at: row.last_reinforced_at,
    session_id: null,
    superseded_by: row.superseded_by ? toCloverOpsId(row.superseded_by) : null,
  }
}

export function sortTasksNewestFirst(rows: AgentTaskRow[]): AgentTaskRow[] {
  return [...rows].sort((a, b) => {
    const aRef = a.completed_at ?? a.started_at ?? a.created_at
    const bRef = b.completed_at ?? b.started_at ?? b.created_at
    return new Date(bRef).getTime() - new Date(aRef).getTime()
  })
}

export function sortGoalsForDashboard(rows: GoalRow[]): GoalRow[] {
  const priorityRank: Record<string, number> = {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3,
  }
  return [...rows].sort((a, b) => {
    const priority =
      (priorityRank[a.priority ?? 'normal'] ?? 2) -
      (priorityRank[b.priority ?? 'normal'] ?? 2)
    if (priority !== 0) return priority
    const aDate = a.target_date ? new Date(a.target_date).getTime() : Number.MAX_SAFE_INTEGER
    const bDate = b.target_date ? new Date(b.target_date).getTime() : Number.MAX_SAFE_INTEGER
    if (aDate !== bDate) return aDate - bDate
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}
