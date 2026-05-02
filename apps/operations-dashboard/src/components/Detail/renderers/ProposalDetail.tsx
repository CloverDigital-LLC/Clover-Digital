import { fmtDate, fmtTime } from '../../../lib/adapters'
import { summarizeProposal } from '../../../lib/proposals'
import type { MemoryProposalRow } from '../../../lib/types'
import { AgentPill, StatusPill } from '../../atoms'
import { CollapsibleText, Field, FieldGroup } from './shared'

const TONE_CLASS = {
  clover: 'border-clover-200 bg-clover-50 text-clover-800',
  ochre: 'border-ochre-300 bg-ochre-100/70 text-ochre-500',
  rust: 'border-rust-500/40 bg-ochre-100/70 text-rust-500',
  ink: 'border-cream-300 bg-cream-100 text-ink-600',
}

export function ProposalDetail({ row }: { row: MemoryProposalRow }) {
  const summary = summarizeProposal(row)
  const tone = TONE_CLASS[summary.applyTone]
  const rawPayload = row.payload ? JSON.stringify(row.payload, null, 2) : ''

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={row.status} />
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}
          >
            {summary.applyLabel}
          </span>
          <AgentPill agent={summary.agent} />
        </div>

        <h2 className="font-display text-[28px] leading-tight tracking-tight text-ink-900 mt-4">
          {summary.actionLabel}
        </h2>
        <div className="mt-2 text-[13px] leading-relaxed text-ink-500">
          {row.rationale ?? summary.applySub}
        </div>
      </div>

      <FieldGroup title="Signal">
        <Field label="Project" value={summary.project} />
        <Field label="Source" value={`${summary.agent} on ${summary.machine}`} />
        <Field
          label="Sessions"
          value={`${summary.sessionCount} linked / ${summary.sessionsScanned ?? '-'} scanned`}
        />
        <Field
          label="Status"
          value={`${summary.completedSignals ?? 0} complete / ${summary.blockedSignals ?? 0} blocked`}
        />
        <Field label="Created" value={`${fmtDate(row.created_at)} - ${fmtTime(row.created_at)}`} />
        <Field label="Apply path" value={summary.applySub} />
      </FieldGroup>

      {summary.evidence.length > 0 && (
        <FieldGroup title="Evidence">
          <div className="space-y-2">
            {summary.evidence.map((sample) => (
              <div
                key={sample}
                className="rounded-md border border-cream-300/80 bg-cream-100/60 px-3 py-2 text-[13px] leading-relaxed text-ink-800"
              >
                {sample}
              </div>
            ))}
          </div>
        </FieldGroup>
      )}

      <FieldGroup title="Review Metadata">
        <Field label="Proposal" value={<span className="font-mono text-[12px]">{row.id}</span>} />
        <Field label="Type" value={row.proposal_type ?? '-'} />
        <Field label="Dedupe" value={summary.dedupeKey ?? '-'} />
        <Field label="Auto-safe" value={row.auto_approvable ? 'yes' : 'no'} />
        <Field label="Reviewed" value={row.reviewed_at ? `${fmtDate(row.reviewed_at)} - ${row.reviewed_by ?? 'unknown'}` : '-'} />
      </FieldGroup>

      {rawPayload && (
        <FieldGroup title="Payload">
          <CollapsibleText text={rawPayload} variant="code" />
        </FieldGroup>
      )}
    </div>
  )
}
