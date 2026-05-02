import type { KnowledgeRow } from '../../../lib/types'
import { fmtDate, fmtTime, relTime } from '../../../lib/adapters'
import { CollapsibleText, Field, FieldGroup } from './shared'
import { ArtifactGallery } from './ArtifactGallery'

const CAT_LABEL: Record<string, string> = {
  decision: 'Decision',
  research: 'Research',
  insight: 'Insight',
  reference: 'Reference',
  status: 'Status',
  task: 'Task',
  client: 'Client',
  contact: 'Contact',
}

export function KnowledgeDetail({ row }: { row: KnowledgeRow }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-[0.1em] font-medium px-1.5 py-0.5 rounded border border-clover-300 text-clover-800">
            {CAT_LABEL[row.category] ?? row.category}
          </span>
          <span className="text-[11px] text-ink-400">· {row.project}</span>
          {row.is_private && (
            <span className="text-[10px] uppercase tracking-[0.1em] font-medium px-1.5 py-0.5 rounded bg-ochre-100 text-ochre-500">
              private
            </span>
          )}
        </div>
        <h2 className="font-display text-[22px] leading-snug text-ink-900">{row.title}</h2>
      </div>

      <FieldGroup title="Content">
        <CollapsibleText text={row.content} />
      </FieldGroup>

      <ArtifactGallery parentKind="knowledge" parentId={row.id} />

      <FieldGroup title="Metadata">
        <Field label="Source agent" value={row.source_agent ?? '—'} />
        <Field label="Source machine" value={row.source_machine ?? '—'} />
        <Field label="Source channel" value={row.source_channel ?? '—'} />
        <Field label="Scope" value={row.scope ?? '—'} />
        <Field
          label="Confidence"
          value={row.confidence !== null ? `${(row.confidence * 100).toFixed(0)}%` : '—'}
        />
        {row.tags && row.tags.length > 0 && (
          <Field
            label="Tags"
            value={
              <span className="flex flex-wrap gap-1">
                {row.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] px-1.5 py-0.5 rounded bg-cream-200 text-ink-700"
                  >
                    {t}
                  </span>
                ))}
              </span>
            }
          />
        )}
        <Field
          label="Created"
          value={`${fmtDate(row.created_at)} · ${fmtTime(row.created_at)} · ${relTime(row.created_at)}`}
        />
        {row.updated_at && row.updated_at !== row.created_at && (
          <Field
            label="Updated"
            value={`${fmtDate(row.updated_at)} · ${relTime(row.updated_at)}`}
          />
        )}
        {row.last_reinforced_at && (
          <Field
            label="Reinforced"
            value={`${fmtDate(row.last_reinforced_at)} · ${relTime(row.last_reinforced_at)}`}
          />
        )}
        <Field label="ID" value={<code className="text-[11px]">{row.id}</code>} />
      </FieldGroup>
    </div>
  )
}
