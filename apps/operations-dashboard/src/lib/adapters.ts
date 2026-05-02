/**
 * Adapter layer: real database rows → the shapes the design components expect.
 *
 * The design (Claude Design artifact) was built against an idealized schema.
 * The live DB has a slightly different shape. Rather than rewriting either,
 * we map at the boundary: queries return DB rows, adapters reshape them.
 *
 * If you find yourself reaching past adapters to access raw DB fields in a
 * component, add the field here instead.
 */

import type {
  AgentTaskRow,
  Department,
  KnowledgeRow,
  MasonCommitmentRow,
  AgentHeartbeatRow,
  CdTargetAccountRow,
  MemoryProposalRow,
} from './types'

// ----- Pipeline row (cd_target_accounts → design shape) -----
export interface PipelineRow {
  id: string
  business_name: string
  vertical: string
  city: string
  /** Normalized 1-5 from the underlying 0-100 fit_score band */
  score: number
  /** Real status straight from the DB (new | qualified | disqualified) */
  status: string
  /** Mapped from updated_at — the closest analogue to "last touch" */
  last_touch_at: string
}

/** fit_score in cd_target_accounts ranges 0..~100. Map to a friendlier 1-5. */
export function normalizeFitScore(fit: number | null): number {
  if (fit === null || fit === undefined) return 1
  if (fit >= 80) return 5
  if (fit >= 60) return 4
  if (fit >= 40) return 3
  if (fit >= 20) return 2
  return 1
}

export function adaptCdAccount(row: CdTargetAccountRow): PipelineRow {
  return {
    id: row.id,
    business_name: row.business_name,
    vertical: prettyVertical(row.vertical),
    city:
      row.location_city
        ? `${row.location_city}${row.location_state ? `, ${row.location_state}` : ''}`
        : '—',
    score: normalizeFitScore(row.fit_score),
    status: row.status ?? 'new',
    last_touch_at: row.updated_at,
  }
}

function prettyVertical(v: string | null): string {
  if (!v) return '—'
  // home_services → Home Services
  return v
    .split(/[_\s-]+/)
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : ''))
    .join(' ')
}

// ----- Commitment (mason_commitments → design shape) -----
export interface CommitmentItem {
  id: string
  title: string
  status: string
  target_date: string | null
  drift_days: number
  owner: string
  /** Pulled through so the venture filter can scope blockers + top tasks. */
  venture: string | null
}

export function adaptCommitment(
  row: MasonCommitmentRow,
  now = new Date(),
): CommitmentItem {
  const drift = row.due_date ? computeDriftDays(row.due_date, now) : 0
  const closed = row.status === 'done' || row.status === 'dropped'
  return {
    id: row.id,
    title: row.commitment,
    status: row.status,
    target_date: row.due_date,
    drift_days: closed ? 0 : Math.max(0, drift),
    owner: row.delegated_to || 'mason',
    venture: row.venture,
  }
}

export function computeDriftDays(dueIso: string, now: Date): number {
  const due = new Date(dueIso + 'T23:59:59')
  const ms = now.getTime() - due.getTime()
  return Math.floor(ms / 86_400_000)
}

// ----- Tasks: a few helpful derivations -----

/**
 * "Running" in the design = the task is actively in flight on an agent.
 * Real status enum has plenty of states; we treat anything between started
 * and not-yet-completed/cancelled/failed as running.
 */
export function isRunning(t: AgentTaskRow): boolean {
  if (t.completed_at) return false
  if (
    t.status === 'queued' ||
    t.status === 'completed' ||
    t.status === 'cancelled' ||
    t.status === 'failed' ||
    t.status === 'blocked'
  )
    return false
  return Boolean(t.started_at)
}

export function isInFlight(t: AgentTaskRow): boolean {
  // For "Active work" widget — anything not yet shipped and not abandoned.
  return (
    t.status !== 'completed' &&
    t.status !== 'cancelled' &&
    t.status !== 'failed'
  )
}

/** A clean status label for pills — collapse the wide enum down. */
export function displayTaskStatus(t: AgentTaskRow): string {
  if (t.status === 'completed') return 'completed'
  if (t.status === 'cancelled') return 'cancelled'
  if (t.status === 'failed') return 'failed'
  if (t.status === 'blocked') return 'blocked'
  if (t.status === 'queued') return 'queued'
  if (isRunning(t)) return 'running'
  return t.status
}

// ----- Heartbeats: latest per agent + stale derivation -----
export interface AgentLiveness {
  agent: string
  status: 'idle' | 'busy' | 'stale' | 'blocked'
  last_seen_at: string
  current_task: string | null
}

const STALE_THRESHOLD_MIN = 15

export function adaptHeartbeats(
  rows: AgentHeartbeatRow[],
  now = new Date(),
): AgentLiveness[] {
  // Take the most recent per agent
  const byAgent = new Map<string, AgentHeartbeatRow>()
  for (const r of rows) {
    const prev = byAgent.get(r.agent)
    if (!prev || new Date(r.created_at) > new Date(prev.created_at)) {
      byAgent.set(r.agent, r)
    }
  }
  return Array.from(byAgent.values()).map((r) => {
    const ageMin = (now.getTime() - new Date(r.created_at).getTime()) / 60_000
    let status: AgentLiveness['status']
    if (ageMin > STALE_THRESHOLD_MIN) status = 'stale'
    else if (r.status === 'working') status = 'busy'
    else if (r.status === 'blocked') status = 'blocked'
    else status = 'idle'
    return {
      agent: r.agent,
      status,
      last_seen_at: r.created_at,
      current_task: r.current_task,
    }
  })
}

// ----- Knowledge: filter and shape for the Decisions & Research card -----
export interface KnowledgeItem {
  id: string
  category: string
  project: string
  title: string
  content: string
  created_at: string
}

export function adaptKnowledge(row: KnowledgeRow): KnowledgeItem {
  return {
    id: row.id,
    category: row.category,
    project: row.project,
    title: row.title,
    content: row.content,
    created_at: row.created_at,
  }
}

// ----- Briefing rollups -----
export interface BriefingRollup {
  active_tasks: number
  shipped_this_week: number
  blocked_count: number
  drifted_commitment_count: number
  stale_agents: number
  needs_attention: NeedsAttention[]
}

export interface NeedsAttention {
  label: string
  sub: string
  tone: 'ochre' | 'rust' | 'clover'
  /**
   * DOM id of the card this item refers to. When set, the BriefingCard
   * renders the row as a clickable button that scroll-spotlights that
   * card. Mason: "click '13 blocked tasks' → see the blocked tasks".
   */
  scroll_to?: string
}

const TEAM_VENTURES = new Set(['clover-digital', 'fleet'])

const VENTURE_LABELS: Record<string, string> = {
  'clover-digital': 'Clover Digital',
  'prairie-digital': 'Clover Digital', // legacy alias — Phase C cleanup will remove
  'gate-404': 'AI Poker Stars',
  abstract: 'Abstract',
  fleet: 'Fleet',
  'yatsu-gaming': 'Yatsu Gaming',
  unassigned: 'Unassigned',
}

export function displayVenture(venture: string | null | undefined): string {
  if (!venture) return 'Unassigned'
  return VENTURE_LABELS[venture] ?? venture
}

export function computeBriefing(
  tasks: AgentTaskRow[],
  commitments: CommitmentItem[],
  liveness: AgentLiveness[],
  repliesThisWeek: number,
  now = new Date(),
): BriefingRollup {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000)

  // Caller hands us the union of useActiveWork + useRecentlyShipped +
  // useBlockedTasks. Active includes blocked-status tasks (its filter is
  // "not completed/cancelled/failed"), so a blocked task often appears in
  // BOTH lists. Dedupe by id before any counting — otherwise the
  // "13 blocked tasks" rollup over-counts vs the real DB total.
  const seen = new Set<string>()
  const dedupedAll: AgentTaskRow[] = []
  for (const t of tasks) {
    if (!seen.has(t.id)) {
      seen.add(t.id)
      dedupedAll.push(t)
    }
  }
  const teamTasks = dedupedAll.filter((t) =>
    TEAM_VENTURES.has(t.venture ?? ''),
  )
  const blocked = teamTasks.filter((t) => t.status === 'blocked')
  const active = teamTasks.filter(isInFlight)
  const shipped = teamTasks.filter(
    (t) =>
      t.status === 'completed' &&
      t.completed_at &&
      new Date(t.completed_at) >= sevenDaysAgo,
  )
  const drifted = commitments.filter(
    (c) =>
      (c.status === 'open' || c.status === 'in_progress') && c.drift_days > 0,
  )
  const staleAgents = liveness.filter((a) => a.status === 'stale')

  const needs: NeedsAttention[] = []
  if (blocked.length > 0) {
    needs.push({
      label: `${blocked.length} blocked task${blocked.length === 1 ? '' : 's'}`,
      sub: blocked[0].title,
      tone: 'ochre',
      scroll_to: 'blockers-card',
    })
  }
  if (drifted.length > 0) {
    const top = [...drifted].sort((a, b) => b.drift_days - a.drift_days)[0]
    needs.push({
      label: `${drifted.length} commitment${drifted.length === 1 ? '' : 's'} past target`,
      sub: top ? `${top.title} (+${top.drift_days}d)` : '',
      tone: 'rust',
      scroll_to: 'blockers-card',
    })
  }
  // Replies-to-review intentionally not surfaced — that's a sales/cold-email
  // future surface, not a needs-Mason-now signal. Mason: "I dont want to
  // see the replies to review since it is for sending out cold email."
  // Reference repliesThisWeek so TS doesn't complain about an unused param;
  // the value still travels via BriefingRollup if the briefing card wants it.
  void repliesThisWeek
  if (staleAgents.length > 0) {
    needs.push({
      label: `${staleAgents.length} agent${staleAgents.length === 1 ? '' : 's'} stale`,
      sub: staleAgents.map((a) => a.agent).join(', '),
      tone: 'ochre',
      scroll_to: 'heartbeats-card',
    })
  }

  return {
    active_tasks: active.length,
    shipped_this_week: shipped.length,
    blocked_count: blocked.length,
    drifted_commitment_count: drifted.length,
    stale_agents: staleAgents.length,
    needs_attention: needs,
  }
}

// ----- Tiny helpers -----
export function relTime(iso: string, now = new Date()): string {
  const t = new Date(iso).getTime()
  const diff = (now.getTime() - t) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  const d = Math.round(diff / 86400)
  if (d < 14) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ----- Command center / ADHD protocol -----
export type AttentionTone = 'clover' | 'ochre' | 'rust' | 'ink'

export interface AttentionItem {
  id: string
  label: string
  sub: string
  tone: AttentionTone
  owner?: string | null
}

export interface TrustSignal {
  label: string
  value: string | number
  tone: AttentionTone
  sub: string
}

interface ArchivistStatusSummary {
  created_at: string
  content?: string | null
}

const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}

const STATUS_RANK: Record<string, number> = {
  running: 0,
  testing: 1,
  deploying: 2,
  code_review: 3,
  plan_review: 4,
  planned: 5,
  researching: 6,
  queued: 7,
  blocked: 8,
}

function taskRank(t: AgentTaskRow): number {
  const priority = PRIORITY_RANK[t.priority ?? 'normal'] ?? 2
  const status = STATUS_RANK[t.status] ?? 9
  const age = Date.now() - new Date(t.created_at).getTime()
  return priority * 100 + status * 10 - Math.min(9, Math.floor(age / 86_400_000))
}

function priorityTone(priority: string | null | undefined): AttentionTone {
  if (priority === 'critical') return 'rust'
  if (priority === 'high') return 'ochre'
  return 'clover'
}

function isMasonOwned(t: AgentTaskRow): boolean {
  return t.assigned_to === 'mason' || t.agent === 'mason'
}

function isOpenCommitment(c: CommitmentItem): boolean {
  return c.status === 'open' || c.status === 'in_progress'
}

function commitmentRank(c: CommitmentItem): number {
  if (c.drift_days > 0) return 100 + Math.max(0, 20 - c.drift_days)
  if (!c.target_date) return 260
  const due = new Date(`${c.target_date}T23:59:59`).getTime()
  const daysUntilDue = Math.ceil((due - Date.now()) / 86_400_000)
  return 220 + Math.max(0, Math.min(30, daysUntilDue))
}

function commitmentAttention(c: CommitmentItem): AttentionItem {
  return {
    id: `commitment-${c.id}`,
    label: c.title,
    sub:
      c.drift_days > 0
        ? `${c.owner} - +${c.drift_days}d drift`
        : `${c.owner} - due ${fmtDate(c.target_date)}`,
    tone: c.drift_days > 7 ? 'rust' : c.drift_days > 0 ? 'ochre' : 'clover',
    owner: c.owner,
  }
}

export function pickMasonFocus(
  tasks: AgentTaskRow[],
  commitments: CommitmentItem[] = [],
): AttentionItem | null {
  const taskCandidates = tasks
    .filter(isInFlight)
    .filter((t) => isMasonOwned(t) || t.status === 'blocked' || t.priority === 'critical')
    .map((t) => ({
      rank: taskRank(t),
      item: {
        id: `task-${t.id}`,
        label: t.title,
        sub: `${displayVenture(t.venture ?? 'fleet')} - ${displayTaskStatus(t)} - ${t.priority ?? 'normal'}`,
        tone: t.status === 'blocked' ? 'rust' : priorityTone(t.priority),
        owner: t.assigned_to ?? t.agent,
      } satisfies AttentionItem,
    }))

  const commitmentCandidates = commitments
    .filter(isOpenCommitment)
    .filter((c) => c.owner === 'mason' || c.drift_days > 0)
    .map((c) => ({
      rank: commitmentRank(c),
      item: commitmentAttention(c),
    }))

  const top = [...taskCandidates, ...commitmentCandidates].sort(
    (a, b) => a.rank - b.rank,
  )[0]

  return top?.item ?? null
}

/**
 * Top N tasks for the briefing's "Top tasks" rail. Same ranking as
 * pickMasonFocus, but returns multiple items and dedupes by id.
 */
export function pickTopTasks(
  tasks: AgentTaskRow[],
  commitments: CommitmentItem[] = [],
  count = 5,
): AttentionItem[] {
  const taskCandidates = tasks
    .filter(isInFlight)
    .filter((t) => isMasonOwned(t) || t.status === 'blocked' || t.priority === 'critical' || t.priority === 'high')
    .map((t) => ({
      rank: taskRank(t),
      item: {
        id: `task-${t.id}`,
        label: t.title,
        sub: `${displayVenture(t.venture ?? 'fleet')} · ${displayTaskStatus(t)}`,
        tone: t.status === 'blocked' ? 'rust' : priorityTone(t.priority),
        owner: t.assigned_to ?? t.agent,
      } satisfies AttentionItem,
    }))

  const commitmentCandidates = commitments
    .filter(isOpenCommitment)
    .filter((c) => c.owner === 'mason' || c.drift_days > 0)
    .map((c) => ({
      rank: commitmentRank(c),
      item: commitmentAttention(c),
    }))

  const all = [...taskCandidates, ...commitmentCandidates].sort(
    (a, b) => a.rank - b.rank,
  )
  const seen = new Set<string>()
  const out: AttentionItem[] = []
  for (const c of all) {
    if (seen.has(c.item.id)) continue
    seen.add(c.item.id)
    out.push(c.item)
    if (out.length >= count) break
  }
  return out
}

/**
 * Venture share of activity (shipped + active) over the window.
 * Used by the briefing project bars: shows where work is actually going.
 */
export interface VentureShare {
  venture: string
  count: number
  pct: number
}

/**
 * Map an agent_tasks row to a Clover Digital department.
 *
 * v1 heuristic — agent + tag-based. Eventually this becomes a
 * `department` column on agent_tasks (Phase B of the rebrand cleanup),
 * but for now we infer.
 *
 *   tag overrides win first (so a Bighoss task tagged `marketing` lands
 *     in Marketing, not Product/Eng)
 *   then agent default
 *   then null (cross-cutting / unknown)
 */
const TAG_TO_DEPARTMENT: Record<string, Department> = {
  marketing: 'marketing',
  brand: 'marketing',
  content: 'marketing',
  seo: 'marketing',
  sales: 'sales',
  pipeline: 'sales',
  outbound: 'sales',
  ops: 'ops',
  operations: 'ops',
  onboarding: 'ops',
  delivery: 'ops',
  product: 'product-eng',
  engineering: 'product-eng',
  infra: 'product-eng',
  fleet: 'product-eng',
}

const AGENT_TO_DEPARTMENT: Record<string, Department> = {
  derek: 'sales',
  hermes: 'ops',
  bighoss: 'product-eng',
  'claude-code': 'product-eng',
  codex: 'product-eng',
  archivist: 'product-eng',
}

export function inferDepartment(
  task: Pick<AgentTaskRow, 'agent' | 'venture'> & {
    tags?: string[] | null
    department?: Department | 'unassigned' | null
  },
): Department | null {
  // Explicit column wins. 'unassigned' is a real value distinct from null.
  if (task.department && task.department !== 'unassigned') {
    return task.department
  }
  if (task.department === 'unassigned') return null
  // Tag overrides on the agent default.
  if (task.tags) {
    for (const t of task.tags) {
      const dept = TAG_TO_DEPARTMENT[t.toLowerCase()]
      if (dept) return dept
    }
  }
  if (task.agent && AGENT_TO_DEPARTMENT[task.agent]) {
    return AGENT_TO_DEPARTMENT[task.agent]
  }
  return null
}

/**
 * Drop tasks that don't match the selected department. The selected key is
 * either a Department enum or 'unassigned' (matches tasks with no inferred
 * department). Pass null/undefined to skip filtering entirely.
 */
export function filterTasksByDepartment<
  T extends Pick<AgentTaskRow, 'agent' | 'venture'> & { tags?: string[] | null },
>(tasks: T[], department: Department | 'unassigned' | null | undefined): T[] {
  if (!department) return tasks
  return tasks.filter((t) => {
    const dept = inferDepartment(t) ?? 'unassigned'
    return dept === department
  })
}

export interface DepartmentShare {
  department: string // 'product-eng' | 'marketing' | 'sales' | 'ops' | 'unassigned'
  count: number
  pct: number
}

const DEPARTMENT_ORDER = ['sales', 'marketing', 'product-eng', 'ops', 'unassigned']

export function computeDepartmentDistribution(
  tasks: AgentTaskRow[],
  windowDays = 7,
  now = new Date(),
): DepartmentShare[] {
  const since = now.getTime() - windowDays * 86_400_000
  const inWindow = tasks.filter((t) => {
    const ref = t.completed_at ?? t.started_at ?? t.created_at
    return new Date(ref).getTime() >= since
  })
  const counts = new Map<string, number>()
  for (const t of inWindow) {
    const dept = inferDepartment(t) ?? 'unassigned'
    counts.set(dept, (counts.get(dept) ?? 0) + 1)
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0)
  const rows: DepartmentShare[] = Array.from(counts.entries()).map(
    ([department, count]) => ({
      department,
      count,
      pct: total === 0 ? 0 : Math.round((count / total) * 100),
    }),
  )
  // Stable display order
  rows.sort(
    (a, b) =>
      DEPARTMENT_ORDER.indexOf(a.department) -
      DEPARTMENT_ORDER.indexOf(b.department),
  )
  return rows
}

export function computeVentureDistribution(
  tasks: AgentTaskRow[],
  windowDays = 7,
  now = new Date(),
): VentureShare[] {
  const since = now.getTime() - windowDays * 86_400_000
  const inWindow = tasks.filter((t) => {
    const ref = t.completed_at ?? t.started_at ?? t.created_at
    return new Date(ref).getTime() >= since
  })
  const counts = new Map<string, number>()
  for (const t of inWindow) {
    // Coalesce legacy prairie-digital → canonical clover-digital so the
    // bars don't show two separate buckets for the same business.
    const raw = t.venture ?? 'unassigned'
    const v = raw === 'prairie-digital' ? 'clover-digital' : raw
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0)
  const rows: VentureShare[] = Array.from(counts.entries()).map(([venture, count]) => ({
    venture,
    count,
    pct: total === 0 ? 0 : Math.round((count / total) * 100),
  }))
  rows.sort((a, b) => b.count - a.count)
  return rows
}

export function pickAgentPush(
  tasks: AgentTaskRow[],
  commitments: CommitmentItem[] = [],
): AttentionItem | null {
  const taskCandidates = tasks
    .filter(isInFlight)
    .filter((t) => !isMasonOwned(t) && t.status !== 'blocked')
    .map((t) => ({
      rank: taskRank(t),
      item: {
        id: `task-${t.id}`,
        label: t.title,
        sub: `${t.agent ?? t.assigned_to ?? 'unassigned'} - ${displayTaskStatus(t)} - ${relTime(t.created_at)}`,
        tone: priorityTone(t.priority),
        owner: t.assigned_to ?? t.agent,
      } satisfies AttentionItem,
    }))

  const delegatedCommitments = commitments
    .filter(isOpenCommitment)
    .filter((c) => c.owner !== 'mason')
    .map((c) => ({
      rank: commitmentRank(c) + 20,
      item: commitmentAttention(c),
    }))

  const top = [...taskCandidates, ...delegatedCommitments].sort(
    (a, b) => a.rank - b.rank,
  )[0]

  return top?.item ?? null
}

export function buildWaitingItems(
  blockedTasks: AgentTaskRow[],
  commitments: CommitmentItem[],
  liveness: AgentLiveness[],
  proposals: MemoryProposalRow[],
  excludeIds: string[] = [],
): AttentionItem[] {
  const drifted = commitments.filter(
    (c) => isOpenCommitment(c) && c.drift_days > 0,
  )
  const stale = liveness.filter((a) => a.status === 'stale' || a.status === 'blocked')
  const items: AttentionItem[] = []
  const excluded = new Set(excludeIds)

  for (const t of blockedTasks.slice(0, 3)) {
    items.push({
      id: `task-${t.id}`,
      label: t.title,
      sub: `${t.agent ?? t.assigned_to ?? 'unassigned'} - blocked ${relTime(t.created_at)}`,
      tone: 'rust',
      owner: t.assigned_to ?? t.agent,
    })
  }
  for (const c of drifted.slice(0, 2)) {
    items.push({
      id: `commitment-${c.id}`,
      label: c.title,
      sub: `${c.owner} - +${c.drift_days}d drift`,
      tone: 'ochre',
      owner: c.owner,
    })
  }
  for (const a of stale.slice(0, 2)) {
    items.push({
      id: `agent-${a.agent}`,
      label: `${a.agent} needs a check`,
      sub: `${a.status} - last seen ${relTime(a.last_seen_at)}`,
      tone: 'ochre',
      owner: a.agent,
    })
  }
  if (proposals.length > 0) {
    items.push({
      id: `proposal-${proposals[0].id}`,
      label: `${proposals.length} Archivist proposal${proposals.length === 1 ? '' : 's'} waiting`,
      sub: 'Review before the board changes',
      tone: 'clover',
      owner: 'archivist',
    })
  }

  return items.filter((item) => !excluded.has(item.id)).slice(0, 5)
}

export function buildTrustSignals(
  liveness: AgentLiveness[],
  proposals: MemoryProposalRow[],
  archivistStatus: ArchivistStatusSummary | null,
  dashboardUpdatedAt = new Date(),
  sourceErrors: string[] = [],
): TrustSignal[] {
  const staleAgents = liveness.filter((a) => a.status === 'stale').length
  const blockedAgents = liveness.filter((a) => a.status === 'blocked').length
  const archivistStatusCreatedAt = archivistStatus?.created_at ?? null
  const archivistFresh =
    archivistStatusCreatedAt !== null &&
    dashboardUpdatedAt.getTime() - new Date(archivistStatusCreatedAt).getTime() < 30 * 3_600_000
  const archivistPartial = archivistFresh && archivistHasSkippedSources(archivistStatus?.content)
  const archivistValue = !archivistFresh ? 'stale' : archivistPartial ? 'partial' : 'fresh'
  const autoApply = parseArchivistAutoApply(archivistStatus?.content)
  const archivistSub = archivistStatusCreatedAt
    ? archivistPartial
      ? `latest run skipped a source - ${relTime(archivistStatusCreatedAt, dashboardUpdatedAt)}`
      : autoApply
        ? `last run ${relTime(archivistStatusCreatedAt, dashboardUpdatedAt)} - ${autoApply.eligible} safe / ${autoApply.review} review`
        : `last run ${relTime(archivistStatusCreatedAt, dashboardUpdatedAt)}`
    : 'no run found'

  return [
    {
      label: 'Data',
      value: sourceErrors.length > 0 ? 'error' : 'ok',
      tone: sourceErrors.length > 0 ? 'rust' : 'clover',
      sub:
        sourceErrors.length > 0
          ? `query issue: ${sourceErrors.join(', ')}`
          : 'all command sources readable',
    },
    {
      label: 'Archivist',
      value: archivistValue,
      tone: archivistValue === 'fresh' ? 'clover' : 'ochre',
      sub: archivistSub,
    },
    {
      label: 'Proposals',
      value: proposals.length,
      tone: proposals.length > 10 ? 'ochre' : 'clover',
      sub: 'pending review',
    },
    {
      label: 'Agents',
      value: staleAgents + blockedAgents,
      tone: staleAgents + blockedAgents > 0 ? 'ochre' : 'clover',
      sub: 'stale or blocked',
    },
  ]
}

function archivistHasSkippedSources(content: string | null | undefined): boolean {
  const match = content?.match(/skipped_sources=([^.;]+)/i)
  if (!match) return false
  return !/\bnone\b/i.test(match[1])
}

function parseArchivistAutoApply(content: string | null | undefined): { eligible: number; review: number } | null {
  if (!content) return null
  const eligible = content.match(/auto_apply_eligible_count=(\d+)/i)
  const denied = content.match(/auto_apply_denied_count=(\d+)/i)
  if (!eligible && !denied) return null
  return {
    eligible: Number(eligible?.[1] ?? 0),
    review: Number(denied?.[1] ?? 0),
  }
}
