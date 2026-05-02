import { Card, AgentPill, EmptyState } from '../atoms'
import { useBlockedTasks } from '../../hooks/useTasks'
import { useCommitments } from '../../hooks/useCommitments'
import {
  displayVenture,
  filterTasksByDepartment,
  relTime,
} from '../../lib/adapters'
import { useDetail } from '../Detail/DetailContext'
import { useVentureFilter } from '../../context/VentureFilterContext'

export function BlockersCard() {
  const { data: blockedTasks = [] } = useBlockedTasks()
  const { data: commitments = [] } = useCommitments()
  const { open } = useDetail()
  const { selected, selectedDepartment } = useVentureFilter()
  const filteredBlocked = filterTasksByDepartment(blockedTasks, selectedDepartment)

  const driftedCommits = commitments.filter((c) => {
    if (c.status !== 'open' && c.status !== 'in_progress') return false
    if (c.drift_days <= 0) return false
    if (selected && (c.venture ?? 'unassigned') !== selected) return false
    return true
  })

  // Department filter doesn't apply to commitments — they don't have an
  // agent-derived department signal. Selecting a department in team view
  // narrows tasks; commitments only narrow via venture chip.
  const items = [
    ...filteredBlocked.map((t) => ({
      key: `task_${t.id}`,
      kind: 'task' as const,
      target_id: t.id,
      title: t.title,
      owner: t.agent ?? '—',
      sub: `${displayVenture(t.venture)} · ${relTime(t.created_at)}`,
      severity: 'blocked' as const,
    })),
    ...driftedCommits.map((c) => ({
      key: `commit_${c.id}`,
      kind: 'commit' as const,
      target_id: c.id,
      title: c.title,
      owner: c.owner,
      sub: `${c.drift_days}d past target`,
      severity: 'drift' as const,
    })),
  ]

  return (
    <Card
      id="blockers-card"
      title="Open blockers"
      scrollBody
      className="h-full"
      action={items.length > 0 ? <a className="hover:underline">Triage →</a> : undefined}
      footer={
        <>
          <span className="whitespace-nowrap">{items.length} need attention</span>
          <span className="whitespace-nowrap">Drift &gt; 0 day</span>
        </>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon="✓"
          line="Nothing stuck."
          sub="All commits and tasks are on track."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            const target = {
              kind: (it.kind === 'task' ? 'task' : 'commitment') as 'task' | 'commitment',
              id: it.target_id,
            }
            return (
            <li
              key={it.key}
              className="flex items-start gap-3 pb-3 border-b border-cream-300/60 last:border-0 last:pb-0 cursor-pointer hover:bg-cream-100/70 -mx-2 px-2 rounded-md transition"
              title={`${it.title}\n${it.kind === 'task' ? 'Task' : 'Commitment'} · ${it.owner} · ${it.sub}`}
              role="button"
              tabIndex={0}
              onClick={() => open(target)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  open(target)
                }
              }}
            >
              <div
                className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  it.severity === 'blocked' ? 'bg-ochre-500' : 'bg-rust-500'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] text-ink-900 leading-snug">{it.title}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] text-ink-500 capitalize whitespace-nowrap">
                    {it.kind === 'task' ? 'Task' : 'Commitment'}
                  </span>
                  <span className="text-[11px] text-ink-400">·</span>
                  {it.kind === 'task' ? (
                    <AgentPill agent={it.owner} />
                  ) : (
                    <span className="text-[11px] text-ink-700 capitalize whitespace-nowrap">
                      {it.owner}
                    </span>
                  )}
                  <span className="text-[11px] text-ink-400 ml-auto whitespace-nowrap">
                    {it.sub}
                  </span>
                </div>
              </div>
            </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
