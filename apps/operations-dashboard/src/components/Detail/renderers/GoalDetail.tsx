import type { GoalDetail as GoalDetailData } from '../../../hooks/useGoals'
import { AgentPill, StatusPill } from '../../atoms'
import { displayTaskStatus, displayVenture, fmtDate, fmtTime, relTime } from '../../../lib/adapters'
import { ChecklistText, CollapsibleText, Field, FieldGroup } from './shared'
import { useDetail } from '../DetailContext'
import { ArtifactGallery } from './ArtifactGallery'

const DEPT_LABEL: Record<string, string> = {
  'product-eng': 'Product / Eng',
  marketing: 'Marketing',
  sales: 'Sales',
  ops: 'Ops',
}

export function GoalDetail({ row }: { row: GoalDetailData }) {
  // Default empty array — useItemDetail vs useGoalDetail are two paths and
  // we don't want a missing field to white-screen the drawer.
  const { goal, tasks, commitments, dependsOn = [] } = row
  const { open } = useDetail()

  const drift = goal.target_date
    ? Math.floor(
        (Date.now() - new Date(goal.target_date + 'T23:59:59').getTime()) /
          86_400_000,
      )
    : null

  const doneTasks = tasks.filter((t) => t.status === 'completed').length
  const openTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'failed',
  ).length
  const doneCommits = commitments.filter((c) => c.status === 'done').length
  const openCommits = commitments.filter(
    (c) => c.status !== 'done' && c.status !== 'dropped',
  ).length
  const totalDone = doneTasks + doneCommits
  const totalOpen = openTasks + openCommits
  const total = totalDone + totalOpen
  const pct = total === 0 ? 0 : Math.round((totalDone / total) * 100)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <div className="text-[11px] uppercase tracking-[0.12em] text-ochre-500 font-medium">
            Goal
          </div>
          {goal.department && (
            <span className="text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded bg-ochre-100 text-ochre-500 font-medium">
              {DEPT_LABEL[goal.department] ?? goal.department}
            </span>
          )}
        </div>
        <h2 className="font-display text-[22px] leading-snug text-ink-900">
          {goal.title}
        </h2>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <StatusPill status={goal.status} />
          {goal.priority && (
            <span className="text-[11px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded border border-cream-300 text-ink-500">
              {goal.priority}
            </span>
          )}
          {goal.venture && (
            <span className="text-[11px] text-ink-400">· {displayVenture(goal.venture)}</span>
          )}
          {goal.owner && <AgentPill agent={goal.owner} />}
        </div>
      </div>

      {/* Progress overview */}
      <FieldGroup title="Progress">
        <div className="flex items-baseline justify-between mb-2">
          <div className="font-display text-[24px] leading-none text-ink-900 tabular-nums">
            {totalDone}
            <span className="text-ink-400"> / {total}</span>
            <span className="text-[14px] text-ink-500 ml-2">steps done</span>
          </div>
          <div className="text-[18px] font-display tabular-nums text-clover-700">
            {pct}%
          </div>
        </div>
        <div className="h-2 rounded-full bg-cream-300/70 overflow-hidden">
          <div
            className="h-full bg-clover-700 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {goal.target_date && (
          <div className="mt-2 text-[12px] text-ink-500">
            Target: {fmtDate(goal.target_date)}
            {drift !== null && drift > 0 && (
              <span className="text-rust-500 font-medium ml-2">+{drift}d past</span>
            )}
            {drift !== null && drift <= 0 && (
              <span className="text-ink-400 ml-2">in {Math.abs(drift)}d</span>
            )}
          </div>
        )}
      </FieldGroup>

      {goal.description && (
        <FieldGroup title="Description">
          <CollapsibleText text={goal.description} />
        </FieldGroup>
      )}

      {goal.success_criteria && (
        <FieldGroup title="Definition of done">
          <ChecklistText text={goal.success_criteria} />
        </FieldGroup>
      )}

      {dependsOn.length > 0 && (
        <FieldGroup title={`Depends on (${dependsOn.length})`}>
          <ul className="space-y-2">
            {dependsOn.map((dep) => {
              const blocking =
                dep.status !== 'done' && dep.status !== 'dropped'
              return (
                <li
                  key={dep.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => open({ kind: 'goal', id: dep.id })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      open({ kind: 'goal', id: dep.id })
                    }
                  }}
                  className="cursor-pointer rounded-md hover:bg-cream-100/60 -mx-2 px-2 py-1.5 transition flex items-start gap-2.5"
                  title={
                    blocking
                      ? `Upstream goal not done — this one is blocked until it lands`
                      : `Upstream goal cleared`
                  }
                >
                  <span
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                      blocking ? 'bg-ochre-500' : 'bg-clover-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-ink-900 leading-snug truncate">
                      {dep.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StatusPill status={dep.status} />
                      {dep.department && (
                        <span className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
                          {DEPT_LABEL[dep.department] ?? dep.department}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </FieldGroup>
      )}

      {goal.notes && (
        <FieldGroup title="Notes">
          <CollapsibleText text={goal.notes} />
        </FieldGroup>
      )}

      <FieldGroup title={`Linked tasks (${tasks.length})`}>
        {tasks.length === 0 ? (
          <div className="text-[12px] text-ink-400 italic">
            No tasks linked yet. Set <code className="text-[11px]">goal_id</code> on an
            agent_tasks row to link it.
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => open({ kind: 'task', id: t.id })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    open({ kind: 'task', id: t.id })
                  }
                }}
                className="cursor-pointer rounded-md hover:bg-cream-100/60 -mx-2 px-2 py-1.5 transition flex items-start gap-2.5"
              >
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                    t.status === 'completed'
                      ? 'bg-clover-500'
                      : t.status === 'blocked'
                        ? 'bg-ochre-500'
                        : 'bg-clover-700'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-ink-900 leading-snug truncate">
                    {t.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <AgentPill agent={t.agent} />
                    <StatusPill status={displayTaskStatus(t)} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FieldGroup>

      {commitments.length > 0 && (
        <FieldGroup title={`Linked commitments (${commitments.length})`}>
          <ul className="space-y-2">
            {commitments.map((c) => (
              <li
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => open({ kind: 'commitment', id: c.id })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    open({ kind: 'commitment', id: c.id })
                  }
                }}
                className="cursor-pointer rounded-md hover:bg-cream-100/60 -mx-2 px-2 py-1.5 transition flex items-start gap-2.5"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-clover-500" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-ink-900 leading-snug truncate">
                    {c.commitment}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StatusPill status={c.status} />
                    {c.delegated_to && <AgentPill agent={c.delegated_to} />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </FieldGroup>
      )}

      <FieldGroup title="Metadata">
        <Field label="Owner" value={goal.owner ?? '—'} />
        <Field label="Created by" value={goal.created_by ?? '—'} />
        <Field
          label="Created"
          value={`${fmtDate(goal.created_at)} · ${fmtTime(goal.created_at)} · ${relTime(goal.created_at)}`}
        />
        {goal.resolved_at && (
          <Field
            label="Resolved"
            value={`${fmtDate(goal.resolved_at)} · ${relTime(goal.resolved_at)}`}
          />
        )}
        <Field label="ID" value={<code className="text-[11px]">{goal.id}</code>} />
      </FieldGroup>

      <ArtifactGallery parentKind="goal" parentId={goal.id} />
    </div>
  )
}
