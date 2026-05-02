import { useMemo } from 'react'
import {
  useArchivistCadence,
  usePendingProposals,
} from '../../hooks/useMemoryProposals'
import { proposalAge, summarizeProposal } from '../../lib/proposals'
import { relTime } from '../../lib/adapters'
import type { MemoryProposalRow } from '../../lib/types'
import { AgentPill, Card, EmptyState, StatusPill } from '../atoms'
import { useDetail } from '../Detail/DetailContext'

const DOT_CLASS = {
  clover: 'bg-clover-700',
  ochre: 'bg-ochre-500',
  rust: 'bg-rust-500',
  ink: 'bg-ink-500',
}

const EMPTY_PROPOSALS: MemoryProposalRow[] = []

export function ArchivistReviewCard() {
  const proposals = usePendingProposals(20)
  const cadence = useArchivistCadence()
  const rows = proposals.data ?? EMPTY_PROPOSALS
  const stats = useMemo(() => summarizeQueue(rows), [rows])

  const cadenceLabel = formatCadence(cadence.data)

  return (
    <Card
      title="Archivist review"
      action={
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
          {cadenceLabel ?? 'Proposal lane'}
        </span>
      }
      footer={
        <>
          <span>
            {stats.pending} pending · {stats.blockedSignals} blocker signals
          </span>
          <span>
            {cadence.data?.runs_7d != null
              ? `${cadence.data.runs_7d} runs / 7d`
              : '—'}
          </span>
        </>
      }
      scrollBody
    >
      {proposals.isLoading ? (
        <Skeleton />
      ) : proposals.isError ? (
        <div className="rounded-md border border-rust-500/40 bg-ochre-100/60 px-3 py-2.5 text-[13px] text-rust-500">
          Failed to load proposals: {(proposals.error as Error)?.message ?? 'unknown'}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="OK"
          line="No pending proposals."
          sub="Archivist has nothing waiting for review."
        />
      ) : (
        <div className="space-y-4">
          <QueueSummary stats={stats} />
          <ul className="space-y-3">
            {rows.map((row) => (
              <ProposalItem key={row.id} row={row} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function QueueSummary({ stats }: { stats: QueueStats }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <Metric label="Pending" value={stats.pending} />
      <Metric label="Auto-safe" value={stats.autoSafe} />
      <Metric label="Projects" value={stats.projects} />
      <Metric label="Sessions" value={stats.sessions} />
    </div>
  )
}

function ProposalItem({ row }: { row: MemoryProposalRow }) {
  const { open } = useDetail()
  const summary = summarizeProposal(row)
  const dot = DOT_CLASS[summary.applyTone]
  const signalText = [
    `${summary.completedSignals ?? 0} complete`,
    `${summary.blockedSignals ?? 0} blocked`,
    `${summary.sessionCount} sessions`,
  ].join(' / ')

  return (
    <li
      className="group rounded-lg border border-cream-300/80 bg-cream-100/50 px-3.5 py-3 cursor-pointer hover:border-clover-200 hover:bg-clover-50/50 transition"
      role="button"
      tabIndex={0}
      onClick={() => open({ kind: 'proposal', id: row.id })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open({ kind: 'proposal', id: row.id })
        }
      }}
      title={row.rationale ?? summary.actionLabel}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            <span className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
              {summary.project}
            </span>
            <StatusPill status={row.status} />
          </div>
          <div className="mt-2 line-clamp-2 font-display text-[19px] leading-tight text-ink-900">
            {summary.actionLabel}
          </div>
          <div className="mt-1.5 line-clamp-2 text-[12.5px] leading-snug text-ink-500">
            {row.rationale ?? summary.applySub}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <AgentPill agent={summary.agent} />
          <div className="mt-2 text-[11px] text-ink-400 tabular-nums">
            {proposalAge(row)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-500">
        <span>{signalText}</span>
        <span className="text-clover-700 group-hover:text-clover-900">
          {summary.applyLabel}
        </span>
      </div>
    </li>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-cream-300/70 bg-cream-50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
        {label}
      </div>
      <div className="mt-1 font-display text-[22px] leading-none text-ink-900 tabular-nums">
        {value}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-cream-300/80 bg-cream-100/50 px-3.5 py-3"
        >
          <div className="h-3 w-1/4 rounded bg-cream-300/70" />
          <div className="mt-3 h-5 w-3/4 rounded bg-cream-300/60" />
          <div className="mt-2 h-3 w-full rounded bg-cream-300/50" />
        </div>
      ))}
    </div>
  )
}

/**
 * Compose the action-line label: "ran 4h ago · ~24h cadence" so Mason
 * can see at a glance how often Archivist runs without opening the
 * heartbeats card.
 */
function formatCadence(c: { last_run_at: string | null; median_gap_hours: number | null } | undefined): string | null {
  if (!c || !c.last_run_at) return null
  const last = `ran ${relTime(c.last_run_at)}`
  if (c.median_gap_hours == null) return last
  const gap = c.median_gap_hours
  const cadence =
    gap < 1.5
      ? `~${Math.round(gap * 60)}m cadence`
      : gap < 36
        ? `~${gap.toFixed(0)}h cadence`
        : `~${(gap / 24).toFixed(1)}d cadence`
  return `${last} · ${cadence}`
}

interface QueueStats {
  pending: number
  autoSafe: number
  projects: number
  sessions: number
  blockedSignals: number
}

function summarizeQueue(rows: MemoryProposalRow[]): QueueStats {
  const projects = new Set<string>()
  let sessions = 0
  let blockedSignals = 0
  let autoSafe = 0

  for (const row of rows) {
    const summary = summarizeProposal(row)
    projects.add(summary.project)
    sessions += summary.sessionCount
    blockedSignals += summary.blockedSignals ?? 0
    if (row.auto_approvable) autoSafe += 1
  }

  return {
    pending: rows.length,
    autoSafe,
    projects: projects.size,
    sessions,
    blockedSignals,
  }
}
