import { useMemo } from 'react'
import { Card, AgentPill, StatusPill, EmptyState } from '../atoms'
import { useGoals, useGoalsProgress, type GoalProgress } from '../../hooks/useGoals'
import { displayVenture, fmtDate } from '../../lib/adapters'
import type { GoalRow } from '../../lib/types'
import { useDetail } from '../Detail/DetailContext'
import { useVentureFilter } from '../../context/VentureFilterContext'

const DEPT_LABEL: Record<string, string> = {
  'product-eng': 'Product / Eng',
  marketing: 'Marketing',
  sales: 'Sales',
  ops: 'Ops',
}

// Stable display order for the grouped Goals card. Sales first because
// money-in is the priority pillar; ops last because it's enabling work.
const DEPT_ORDER: (keyof typeof DEPT_LABEL | 'unassigned')[] = [
  'sales',
  'marketing',
  'product-eng',
  'ops',
  'unassigned',
]

export function GoalsCard() {
  const { data: goals = [], isLoading } = useGoals()
  const goalIds = useMemo(() => goals.map((g) => g.id), [goals])
  const { data: progress = {} } = useGoalsProgress(goalIds)
  const { open } = useDetail()
  const { selectedDepartment, clearDepartment } = useVentureFilter()

  const driftDays = (g: GoalRow): number | null => {
    if (!g.target_date) return null
    const due = new Date(g.target_date + 'T23:59:59').getTime()
    const days = Math.floor((Date.now() - due) / 86_400_000)
    return days
  }

  // When the briefing department bar is clicked, narrow the goals view to
  // that department only — same scoping pattern as Active Work / Blockers /
  // Recently Shipped. Click "Show all" in the briefing to clear.
  const filteredGoals = useMemo(() => {
    if (!selectedDepartment) return goals
    return goals.filter((g) => (g.department ?? 'unassigned') === selectedDepartment)
  }, [goals, selectedDepartment])

  // Group goals by department so the card reads as a department roll-up
  // rather than a flat priority queue. Within a group, keep the existing
  // priority/target ordering from the hook.
  const goalsByDept = useMemo(() => {
    const m = new Map<string, GoalRow[]>()
    for (const g of filteredGoals) {
      const key = g.department ?? 'unassigned'
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(g)
    }
    return m
  }, [filteredGoals])

  // Open-goal lookup so we can flag "blocked by N upstream" on goals that
  // depend on something not yet done.
  const openIds = useMemo(
    () =>
      new Set(
        goals.filter((g) => g.status !== 'done' && g.status !== 'dropped').map((g) => g.id),
      ),
    [goals],
  )

  return (
    <Card
      title="Goals"
      action={
        selectedDepartment ? (
          <button
            onClick={clearDepartment}
            className="text-[10px] uppercase tracking-[0.1em] text-ochre-500 hover:text-ochre-700 transition"
            title={`Currently scoped to ${selectedDepartment} — click to show all`}
          >
            ✓ {selectedDepartment} · Show all
          </button>
        ) : (
          <span className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
            Epics
          </span>
        )
      }
      footer={
        <>
          <span>
            {filteredGoals.length} active
            {selectedDepartment ? ` in ${selectedDepartment}` : ''}
          </span>
          <span>{isLoading ? 'Loading…' : 'Live'}</span>
        </>
      }
    >
      {filteredGoals.length === 0 && !isLoading ? (
        <EmptyState
          icon="·"
          line={
            selectedDepartment
              ? `No goals in ${selectedDepartment} yet.`
              : 'No goals yet.'
          }
          sub={
            selectedDepartment
              ? 'Click Show all in the briefing to see other departments.'
              : "Create one via the fleet MCP and it'll show up here."
          }
        />
      ) : (
        <div className="space-y-6">
          {DEPT_ORDER.filter((d) => goalsByDept.has(d)).map((dept) => {
            const list = goalsByDept.get(dept) ?? []
            return (
              <div key={dept}>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-ochre-500 font-medium">
                    {DEPT_LABEL[dept as keyof typeof DEPT_LABEL] ?? 'Unassigned'}
                  </div>
                  <div className="text-[11px] text-ink-400 tabular-nums">
                    {list.length} {list.length === 1 ? 'goal' : 'goals'}
                  </div>
                </div>
                <ul className="space-y-3">
                  {list.map((g) => {
                    const p = progress[g.id]
                    const drift = driftDays(g)
                    const blockingDeps = (g.depends_on_goal_ids ?? []).filter(
                      (depId) => openIds.has(depId),
                    ).length
                    return (
                      <li key={g.id}>
                        <button
                          type="button"
                          onClick={() => open({ kind: 'goal', id: g.id })}
                          className="w-full text-left rounded-lg border border-cream-300/70 bg-cream-100/40 hover:bg-cream-200/40 transition px-3.5 py-3 cursor-pointer"
                        >
                          {/* Header row */}
                          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="font-display text-[15px] text-ink-900 leading-snug">
                                {g.title}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {g.venture && (
                                  <span className="text-[10px] text-ink-400">
                                    {displayVenture(g.venture)}
                                  </span>
                                )}
                                {blockingDeps > 0 && (
                                  <span
                                    className="text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-ochre-100 text-ochre-500 font-medium"
                                    title="Upstream goal(s) not done"
                                  >
                                    blocked by {blockingDeps}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusPill status={g.status} />
                              {g.owner && <AgentPill agent={g.owner} />}
                            </div>
                          </div>

                          <ProgressRow progress={p} />

                          <div className="flex items-center justify-between mt-1.5 text-[11px]">
                            <span className="text-ink-400 tabular-nums">
                              {p ? sumProgress(p).done : 0}/{p ? sumProgress(p).total : 0} steps done
                            </span>
                            {g.target_date && (
                              <span
                                className={`tabular-nums whitespace-nowrap ${
                                  drift !== null && drift > 0
                                    ? 'text-rust-500 font-medium'
                                    : drift !== null && drift > -14
                                      ? 'text-ochre-500'
                                      : 'text-ink-400'
                                }`}
                              >
                                {drift !== null && drift > 0
                                  ? `+${drift}d past ${fmtDate(g.target_date)}`
                                  : drift !== null
                                    ? `${Math.abs(drift)}d to ${fmtDate(g.target_date)}`
                                    : fmtDate(g.target_date)}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function sumProgress(p: GoalProgress) {
  const done = p.done_tasks + p.done_commitments
  const open = p.open_tasks + p.open_commitments
  return { done, open, total: done + open }
}

function ProgressRow({ progress }: { progress: GoalProgress | undefined }) {
  if (!progress) {
    return <div className="h-1.5 rounded-full bg-cream-300/70 mt-2" />
  }
  const { done, total } = sumProgress(progress)
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="mt-2 h-1.5 rounded-full bg-cream-300/70 overflow-hidden">
      <div
        className="h-full bg-clover-700 rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
