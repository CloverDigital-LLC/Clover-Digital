import type { AgentTaskRow } from '../../../lib/types'
import { AgentPill, StatusPill } from '../../atoms'
import { displayTaskStatus, displayVenture, fmtDate, fmtTime, relTime } from '../../../lib/adapters'
import { CollapsibleText, Field, FieldGroup, Timeline, type TimelineEvent } from './shared'
import { ArtifactGallery } from './ArtifactGallery'
import { DepartmentPicker } from '../DepartmentPicker'
import { useVentureFilter } from '../../../context/VentureFilterContext'

export function TaskDetail({ row }: { row: AgentTaskRow }) {
  const { viewRole } = useVentureFilter()
  const publicTaskId = row.project?.startsWith('CD-T-') ? row.project : row.id
  const events: TimelineEvent[] = []
  events.push({ at: row.created_at, label: 'Created', tone: 'ink' })
  if (row.started_at)
    events.push({ at: row.started_at, label: 'Started', tone: 'clover' })
  if (row.plan_reviewed_at)
    events.push({
      at: row.plan_reviewed_at,
      label: `Plan reviewed${row.plan_reviewed_by ? ` by ${row.plan_reviewed_by}` : ''}`,
      tone: 'ink',
    })
  if (row.code_reviewed_at)
    events.push({
      at: row.code_reviewed_at,
      label: `Code reviewed${row.code_reviewed_by ? ` by ${row.code_reviewed_by}` : ''}`,
      tone: 'ink',
    })
  if (row.completed_at)
    events.push({
      at: row.completed_at,
      label: row.status === 'completed' ? 'Completed' : `Closed (${row.status})`,
      tone: row.status === 'completed' ? 'clover' : 'ochre',
    })

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400 mb-1">
          Task
        </div>
        <h2 className="font-display text-[22px] leading-snug text-ink-900">{row.title}</h2>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <AgentPill agent={row.agent} />
          <StatusPill status={displayTaskStatus(row)} />
          {row.priority && (
            <span className="text-[11px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded border border-cream-300 text-ink-500">
              {row.priority}
            </span>
          )}
          {row.venture && (
            <span className="text-[11px] text-ink-400">· {displayVenture(row.venture)}</span>
          )}
        </div>
      </div>

      {row.description && (
        <FieldGroup title="Description">
          <CollapsibleText text={row.description} />
        </FieldGroup>
      )}

      {row.acceptance_criteria && (
        <FieldGroup title="Acceptance criteria">
          <CollapsibleText text={row.acceptance_criteria} />
        </FieldGroup>
      )}

      <FieldGroup title="Timeline">
        <Timeline events={events} />
      </FieldGroup>

      <FieldGroup title="Metadata">
        <Field label="Assigned to" value={row.assigned_to ?? row.agent ?? '—'} />
        <Field
          label="Department"
          value={
            viewRole === 'admin' ? (
              <DepartmentPicker taskId={row.id} current={row.department} />
            ) : (
              row.department ?? <span className="text-ink-400">— inferred —</span>
            )
          }
        />
        <Field label="Requested by" value={row.requested_by ?? '—'} />
        <Field label="Machine" value={row.machine ?? '—'} />
        <Field label="Project" value={row.project ?? '—'} />
        <Field label="Due date" value={fmtDate(row.due_date)} />
        <Field
          label="Created"
          value={`${fmtDate(row.created_at)} · ${fmtTime(row.created_at)} · ${relTime(row.created_at)}`}
        />
        {row.parent_task_id && (
          <Field label="Parent task" value={<code className="text-[11px]">{row.parent_task_id}</code>} />
        )}
        {row.source_commitment_id && (
          <Field
            label="Source commitment"
            value={<code className="text-[11px]">{row.source_commitment_id}</code>}
          />
        )}
        <Field label="ID" value={<code className="text-[11px]">{publicTaskId}</code>} />
      </FieldGroup>

      {row.error && (
        <FieldGroup title="Error">
          <CollapsibleText text={row.error} variant="error" />
        </FieldGroup>
      )}

      {row.output && (
        <FieldGroup title="Output">
          <CollapsibleText text={row.output} />
        </FieldGroup>
      )}

      <ArtifactGallery parentKind="task" parentId={row.id} />
    </div>
  )
}
