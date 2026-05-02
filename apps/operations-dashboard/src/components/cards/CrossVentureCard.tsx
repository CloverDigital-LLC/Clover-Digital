import { useMemo, useState } from 'react'
import { Card, AgentPill, StatusPill, EmptyState } from '../atoms'
import { SortMenu } from '../atoms/SortMenu'
import { useCrossVentureWork } from '../../hooks/useTasks'
import { displayTaskStatus, displayVenture, relTime } from '../../lib/adapters'
import { useDetail } from '../Detail/DetailContext'
import { sortTasks, type TaskSortKey, TASK_SORT_OPTIONS } from '../../lib/sorting'

export function CrossVentureCard() {
  const { data = [], isLoading } = useCrossVentureWork()
  const { open } = useDetail()
  const [sortKey, setSortKey] = useState<TaskSortKey>('venture')
  const sorted = useMemo(() => sortTasks(data, sortKey), [data, sortKey])

  return (
    <Card
      title="Cross-venture"
      action={
        <SortMenu value={sortKey} options={TASK_SORT_OPTIONS} onChange={setSortKey} />
      }
      footer={
        <>
          <span>{data.length} active across Abstract + AI Poker Stars</span>
          <span>{isLoading ? 'Loading…' : 'Live'}</span>
        </>
      }
    >
      {data.length === 0 && !isLoading ? (
        <EmptyState icon="·" line="No cross-venture work in flight." />
      ) : (
        <div className="overflow-x-auto scroll-soft -mx-1">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-ink-400 border-b border-cream-300">
                <th className="py-2 px-1 font-medium">Task</th>
                <th className="py-2 px-1 font-medium">Venture</th>
                <th className="py-2 px-1 font-medium">Agent</th>
                <th className="py-2 px-1 font-medium">Status</th>
                <th className="py-2 px-1 font-medium text-right">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300/70">
              {sorted.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-cream-100/60 transition cursor-pointer"
                  title={`${t.title}${t.description ? `\n\n${t.description}` : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => open({ kind: 'task', id: t.id })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      open({ kind: 'task', id: t.id })
                    }
                  }}
                >
                  <td className="py-2.5 px-1 text-ink-900">{t.title}</td>
                  <td className="py-2.5 px-1 text-ink-500 text-[12px]">
                    {displayVenture(t.venture)}
                  </td>
                  <td className="py-2.5 px-1">
                    <AgentPill agent={t.agent} />
                  </td>
                  <td className="py-2.5 px-1">
                    <StatusPill status={displayTaskStatus(t)} />
                  </td>
                  <td className="py-2.5 px-1 text-right text-ink-500 tabular-nums">
                    {relTime(t.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
