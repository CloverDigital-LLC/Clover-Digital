/**
 * Sort comparators + option lists for the dashboard's list-style cards.
 *
 * Kept here so the four task cards (Active work, Recently shipped,
 * Cross-venture, Blockers) share one ramp of sort keys, and so other
 * lists (knowledge, commitments, heartbeats) read consistently.
 */
import type { AgentTaskRow } from './types'
import type { CommitmentItem, KnowledgeItem, AgentLiveness } from './adapters'
import type { SortOption } from '../components/atoms/SortMenu'

// ----- Tasks -----
export type TaskSortKey =
  | 'priority'
  | 'newest'
  | 'oldest'
  | 'agent'
  | 'venture'

export const TASK_SORT_OPTIONS: SortOption<TaskSortKey>[] = [
  { value: 'priority', label: 'Priority' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'agent', label: 'Agent' },
  { value: 'venture', label: 'Venture' },
]

const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}

export function sortTasks(rows: AgentTaskRow[], key: TaskSortKey): AgentTaskRow[] {
  const out = [...rows]
  switch (key) {
    case 'priority':
      out.sort((a, b) => {
        const ra = PRIORITY_RANK[a.priority ?? 'normal'] ?? 2
        const rb = PRIORITY_RANK[b.priority ?? 'normal'] ?? 2
        if (ra !== rb) return ra - rb
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      break
    case 'newest':
      out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      break
    case 'oldest':
      out.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      break
    case 'agent':
      out.sort((a, b) => (a.agent ?? 'zzz').localeCompare(b.agent ?? 'zzz'))
      break
    case 'venture':
      out.sort((a, b) => (a.venture ?? 'zzz').localeCompare(b.venture ?? 'zzz'))
      break
  }
  return out
}

// ----- Tasks ordered by completion (Recently Shipped) -----
export type ShippedSortKey = 'newest' | 'oldest' | 'agent' | 'venture'

export const SHIPPED_SORT_OPTIONS: SortOption<ShippedSortKey>[] = [
  { value: 'newest', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'agent', label: 'Agent' },
  { value: 'venture', label: 'Venture' },
]

export function sortShipped(rows: AgentTaskRow[], key: ShippedSortKey): AgentTaskRow[] {
  const out = [...rows]
  switch (key) {
    case 'newest':
      out.sort((a, b) => {
        const ta = a.completed_at ? new Date(a.completed_at).getTime() : 0
        const tb = b.completed_at ? new Date(b.completed_at).getTime() : 0
        return tb - ta
      })
      break
    case 'oldest':
      out.sort((a, b) => {
        const ta = a.completed_at ? new Date(a.completed_at).getTime() : 0
        const tb = b.completed_at ? new Date(b.completed_at).getTime() : 0
        return ta - tb
      })
      break
    case 'agent':
      out.sort((a, b) => (a.agent ?? 'zzz').localeCompare(b.agent ?? 'zzz'))
      break
    case 'venture':
      out.sort((a, b) => (a.venture ?? 'zzz').localeCompare(b.venture ?? 'zzz'))
      break
  }
  return out
}

// ----- Knowledge -----
export type KnowledgeSortKey = 'newest' | 'oldest' | 'category' | 'project'

export const KNOWLEDGE_SORT_OPTIONS: SortOption<KnowledgeSortKey>[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'category', label: 'Category' },
  { value: 'project', label: 'Project' },
]

export function sortKnowledge(rows: KnowledgeItem[], key: KnowledgeSortKey): KnowledgeItem[] {
  const out = [...rows]
  switch (key) {
    case 'newest':
      out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      break
    case 'oldest':
      out.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      break
    case 'category':
      out.sort((a, b) => a.category.localeCompare(b.category))
      break
    case 'project':
      out.sort((a, b) => a.project.localeCompare(b.project))
      break
  }
  return out
}

// ----- Commitments -----
export type CommitmentSortKey =
  | 'drift'
  | 'due'
  | 'newest'
  | 'status'
  | 'owner'

export const COMMITMENT_SORT_OPTIONS: SortOption<CommitmentSortKey>[] = [
  { value: 'drift', label: 'Drift' },
  { value: 'due', label: 'Due date' },
  { value: 'newest', label: 'Newest logged' },
  { value: 'status', label: 'Status' },
  { value: 'owner', label: 'Owner' },
]

export function sortCommitments(
  rows: CommitmentItem[],
  key: CommitmentSortKey,
): CommitmentItem[] {
  const out = [...rows]
  switch (key) {
    case 'drift':
      out.sort((a, b) => b.drift_days - a.drift_days)
      break
    case 'due':
      out.sort((a, b) => {
        if (!a.target_date) return 1
        if (!b.target_date) return -1
        return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
      })
      break
    case 'newest':
      // CommitmentItem doesn't carry created_at, fall back to id (uuid lexically isn't time-stable)
      out.sort((a, b) => b.id.localeCompare(a.id))
      break
    case 'status':
      out.sort((a, b) => a.status.localeCompare(b.status))
      break
    case 'owner':
      out.sort((a, b) => a.owner.localeCompare(b.owner))
      break
  }
  return out
}

// ----- Heartbeats -----
export type HeartbeatSortKey = 'last_seen' | 'agent' | 'status'

export const HEARTBEAT_SORT_OPTIONS: SortOption<HeartbeatSortKey>[] = [
  { value: 'last_seen', label: 'Most recent' },
  { value: 'agent', label: 'Agent' },
  { value: 'status', label: 'Status' },
]

export function sortHeartbeats(
  rows: AgentLiveness[],
  key: HeartbeatSortKey,
): AgentLiveness[] {
  const out = [...rows]
  switch (key) {
    case 'last_seen':
      out.sort(
        (a, b) =>
          new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime(),
      )
      break
    case 'agent':
      out.sort((a, b) => a.agent.localeCompare(b.agent))
      break
    case 'status':
      out.sort((a, b) => a.status.localeCompare(b.status))
      break
  }
  return out
}
