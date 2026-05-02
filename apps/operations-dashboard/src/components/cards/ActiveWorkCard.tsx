import { useMemo, useState } from 'react'
import { Card, AgentPill, StatusPill, EmptyState } from '../atoms'
import { SortMenu } from '../atoms/SortMenu'
import { useActiveWork } from '../../hooks/useTasks'
import {
  displayTaskStatus,
  filterTasksByDepartment,
  relTime,
} from '../../lib/adapters'
import { useDetail } from '../Detail/DetailContext'
import { sortTasks, type TaskSortKey, TASK_SORT_OPTIONS } from '../../lib/sorting'
import { useVentureFilter } from '../../context/VentureFilterContext'

export function ActiveWorkCard() {
  const { data = [], isLoading } = useActiveWork()
  const { open } = useDetail()
  const { selectedDepartment } = useVentureFilter()
  const [sortKey, setSortKey] = useState<TaskSortKey>('priority')
  const filtered = useMemo(
    () => filterTasksByDepartment(data, selectedDepartment),
    [data, selectedDepartment],
  )
  const sorted = useMemo(() => sortTasks(filtered, sortKey), [filtered, sortKey])
  return (
    <Card
      title="Active work"
      scrollBody
      className="h-full"
      action={
        <SortMenu
          value={sortKey}
          options={TASK_SORT_OPTIONS}
          onChange={setSortKey}
        />
      }
      footer={
        <>
          <span>{filtered.length} in flight</span>
          <span>{isLoading ? 'Loading…' : 'Live'}</span>
        </>
      }
    >
      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon="○" line="Quiet on the wires." sub="No active work right now." />
      ) : (
        <ul className="space-y-3">
          {sorted.map((t) => (
            <li
              key={t.id}
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
              className="cursor-pointer hover:bg-cream-100/70 -mx-2 px-2 py-1 rounded-md transition"
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-1 w-1 h-10 rounded-full"
                  style={{
                    background:
                      t.priority === 'critical'
                        ? '#a85a3a'
                        : t.priority === 'high'
                          ? '#1f4d35'
                          : '#dfe9df',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-ink-900 leading-snug">
                    {t.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <AgentPill agent={t.agent} />
                    <StatusPill status={displayTaskStatus(t)} />
                    <span className="text-[11px] text-ink-400 ml-auto whitespace-nowrap">
                      {relTime(t.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
