import type { CdTargetAccountRow } from '../../../lib/types'
import { fmtDate, fmtTime, relTime } from '../../../lib/adapters'
import { StatusPill } from '../../atoms'
import { CollapsibleText, Field, FieldGroup } from './shared'
import { ArtifactGallery } from './ArtifactGallery'

export function AccountDetail({ row }: { row: CdTargetAccountRow }) {
  const components: Array<{ label: string; value: number | null }> = [
    { label: 'Fit', value: row.fit_score },
    { label: 'Demand', value: row.demand_signal_score },
    { label: 'Pain', value: row.pain_signal_score },
    { label: 'Money', value: row.money_signal_score },
    { label: 'Contactability', value: row.contactability_score },
  ]

  const monthlyDollars =
    row.monthly_value_hypothesis_cents !== null
      ? `$${(row.monthly_value_hypothesis_cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo`
      : '—'

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400 mb-1">
          Account
        </div>
        <h2 className="font-display text-[22px] leading-snug text-ink-900">
          {row.business_name}
        </h2>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <StatusPill status={row.status} />
          {row.priority && (
            <span className="text-[11px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded border border-cream-300 text-ink-500">
              {row.priority}
            </span>
          )}
          {row.vertical && (
            <span className="text-[11px] text-ink-500">· {row.vertical}</span>
          )}
          {row.location_city && (
            <span className="text-[11px] text-ink-500">
              · {row.location_city}
              {row.location_state ? `, ${row.location_state}` : ''}
            </span>
          )}
        </div>
      </div>

      <FieldGroup title="Signal scores">
        <div className="grid grid-cols-2 gap-3">
          {components.map((c) => (
            <div
              key={c.label}
              className="rounded-lg border border-cream-300/70 bg-cream-100/40 px-3 py-2.5"
            >
              <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
                {c.label}
              </div>
              <div className="font-display text-[20px] leading-none mt-1 tabular-nums text-ink-900">
                {c.value ?? '—'}
              </div>
              {c.value !== null && (
                <div className="mt-1.5 h-1 rounded-full bg-cream-300/70 overflow-hidden">
                  <div
                    className="h-full bg-clover-700"
                    style={{ width: `${Math.max(0, Math.min(100, c.value))}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </FieldGroup>

      {row.why_this_lead && (
        <FieldGroup title="Why this lead">
          <CollapsibleText text={row.why_this_lead} />
        </FieldGroup>
      )}

      {row.qualification_summary && (
        <FieldGroup title="Qualification summary">
          <CollapsibleText text={row.qualification_summary} />
        </FieldGroup>
      )}

      {row.offer_angle && (
        <FieldGroup title="Offer angle">
          <CollapsibleText text={row.offer_angle} />
        </FieldGroup>
      )}

      <FieldGroup title="Metadata">
        <Field label="Monthly value (hypothesis)" value={monthlyDollars} />
        <Field label="Sub-vertical" value={row.sub_vertical ?? '—'} />
        <Field label="Owner team" value={row.owner_team ?? '—'} />
        <Field label="Assigned agent" value={row.assigned_agent ?? '—'} />
        <Field label="Researched by" value={row.researched_by_agent ?? '—'} />
        <Field
          label="Created"
          value={`${fmtDate(row.created_at)} · ${fmtTime(row.created_at)}`}
        />
        <Field
          label="Updated"
          value={`${fmtDate(row.updated_at)} · ${relTime(row.updated_at)}`}
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
        <Field label="ID" value={<code className="text-[11px]">{row.id}</code>} />
      </FieldGroup>

      <ArtifactGallery parentKind="account" parentId={row.id} />
    </div>
  )
}
