import { relTime, type AttentionTone } from './adapters'
import type { MemoryProposalRow } from './types'

type Payload = Record<string, unknown>

export interface ProposalSummary {
  action: string
  actionLabel: string
  project: string
  agent: string
  machine: string
  sessionCount: number
  sessionsScanned: number | null
  completedSignals: number | null
  blockedSignals: number | null
  evidence: string[]
  dedupeKey: string | null
  applyLabel: string
  applyTone: AttentionTone
  applySub: string
}

export function summarizeProposal(row: MemoryProposalRow): ProposalSummary {
  const payload = row.payload ?? {}
  const action = stringField(payload, 'action') ?? row.proposal_type ?? 'proposal'
  const project = stringField(payload, 'project') ?? 'fleet'
  const agent = stringField(payload, 'agent') ?? row.proposed_by ?? 'archivist'
  const machine = stringField(payload, 'machine') ?? 'unknown'
  const sessionIds = arrayField(payload, 'session_ids')
  const evidence = arrayField(payload, 'evidence_samples')
  const sessionsScanned = numberField(payload, 'sessions_scanned')
  const completedSignals = numberField(payload, 'completed_signal_count')
  const blockedSignals = numberField(payload, 'blocked_signal_count')

  return {
    action,
    actionLabel: humanizeAction(action),
    project,
    agent,
    machine,
    sessionCount: sessionIds.length,
    sessionsScanned,
    completedSignals,
    blockedSignals,
    evidence,
    dedupeKey: stringField(payload, 'dedupe_key'),
    ...proposalApplyStatus(row, action),
  }
}

export function proposalAge(row: MemoryProposalRow): string {
  return relTime(row.created_at)
}

export function humanizeAction(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function proposalApplyStatus(
  row: MemoryProposalRow,
  action: string,
): Pick<ProposalSummary, 'applyLabel' | 'applyTone' | 'applySub'> {
  if (row.auto_approvable) {
    return {
      applyLabel: 'Auto-safe',
      applyTone: 'clover',
      applySub: 'eligible once the MCP allowlist accepts this action',
    }
  }

  if (action === 'promote_project_status') {
    return {
      applyLabel: 'Review',
      applyTone: 'ochre',
      applySub: 'project status promotion needs an explicit approval path',
    }
  }

  return {
    applyLabel: 'Manual',
    applyTone: 'ink',
    applySub: 'not eligible for automatic application',
  }
}

function stringField(payload: Payload, key: string): string | null {
  const value = payload[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function numberField(payload: Payload, key: string): number | null {
  const value = payload[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function arrayField(payload: Payload, key: string): string[] {
  const value = payload[key]
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .filter(Boolean)
}
