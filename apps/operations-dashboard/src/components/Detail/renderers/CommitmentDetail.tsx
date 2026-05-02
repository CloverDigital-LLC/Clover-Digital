import type { MasonCommitmentRow } from '../../../lib/types'
import { computeDriftDays, displayVenture, fmtDate, fmtTime, relTime } from '../../../lib/adapters'
import { StatusPill } from '../../atoms'
import { CollapsibleText, Field, FieldGroup, Timeline, type TimelineEvent } from './shared'
import { ArtifactGallery } from './ArtifactGallery'

export function CommitmentDetail({ row }: { row: MasonCommitmentRow }) {
  const drift = row.due_date ? Math.max(0, computeDriftDays(row.due_date, new Date())) : 0
  const closed = row.status === 'done' || row.status === 'dropped'

  const events: TimelineEvent[] = []
  events.push({ at: row.created_at, label: 'Logged', tone: 'ink' })
  if (row.last_surfaced_at)
    events.push({
      at: row.last_surfaced_at,
      label: `Last surfaced (×${row.surfaced_count ?? 1})`,
      tone: 'ink',
    })
  if (row.resolved_at)
    events.push({
      at: row.resolved_at,
      label: row.status === 'done' ? 'Done' : `Closed (${row.status})`,
      tone: row.status === 'done' ? 'clover' : 'ochre',
    })

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400 mb-1">
          Commitment
        </div>
        <h2 className="font-display text-[22px] leading-snug text-ink-900">{row.commitment}</h2>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <StatusPill status={row.status} />
          {row.venture && (
            <span className="text-[11px] text-ink-400">· {displayVenture(row.venture)}</span>
          )}
          {!closed && drift > 0 && (
            <span className="text-[11px] text-ochre-500 font-medium">
              +{drift}d drift
            </span>
          )}
        </div>
      </div>

      {row.context && (
        <FieldGroup title="Context">
          <CollapsibleText text={row.context} />
        </FieldGroup>
      )}

      <FieldGroup title="Timeline">
        <Timeline events={events} />
      </FieldGroup>

      <FieldGroup title="Metadata">
        <Field label="Owner" value={row.delegated_to || 'mason'} />
        <Field label="Due date" value={fmtDate(row.due_date)} />
        <Field label="Surfaced" value={`${row.surfaced_count ?? 0}× total`} />
        <Field label="Source agent" value={row.source_agent ?? '—'} />
        <Field
          label="Logged"
          value={`${fmtDate(row.created_at)} · ${fmtTime(row.created_at)} · ${relTime(row.created_at)}`}
        />
        <Field label="ID" value={<code className="text-[11px]">{row.id}</code>} />
      </FieldGroup>

      <ArtifactGallery parentKind="commitment" parentId={row.id} />
    </div>
  )
}
