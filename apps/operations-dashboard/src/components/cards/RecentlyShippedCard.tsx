import { useMemo, useState } from 'react'
import { Card, AgentPill, EmptyState } from '../atoms'
import { SortMenu } from '../atoms/SortMenu'
import { useRecentlyShipped } from '../../hooks/useTasks'
import { filterTasksByDepartment, fmtDate, fmtTime } from '../../lib/adapters'
import { useDetail } from '../Detail/DetailContext'
import { sortShipped, type ShippedSortKey, SHIPPED_SORT_OPTIONS } from '../../lib/sorting'
import { useVentureFilter } from '../../context/VentureFilterContext'

export function RecentlyShippedCard() {
  const { data = [], isLoading } = useRecentlyShipped(7)
  const { open } = useDetail()
  const { selectedDepartment } = useVentureFilter()
  const [sortKey, setSortKey] = useState<ShippedSortKey>('newest')
  const filtered = useMemo(
    () => filterTasksByDepartment(data, selectedDepartment),
    [data, selectedDepartment],
  )
  const sorted = useMemo(() => sortShipped(filtered, sortKey), [filtered, sortKey])
  return (
    <Card
      title="Recently shipped"
      scrollBody
      className="h-full"
      action={
        <SortMenu value={sortKey} options={SHIPPED_SORT_OPTIONS} onChange={setSortKey} />
      }
      footer={
        <>
          <span>{filtered.length} in last 7 days</span>
          <span>{isLoading ? 'Loading…' : 'Auto-rolls weekly'}</span>
        </>
      }
    >
      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon="—" line="Nothing shipped yet this week." sub="Make some tasks happen." />
      ) : (
        <ul className="space-y-3.5 relative">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-cream-300" />
          {sorted.map((t) => (
            <li
              key={t.id}
              className="relative pl-5 cursor-pointer rounded-md transition hover:bg-cream-100/70"
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
              <span className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-clover-500 ring-2 ring-cream-50" />
              <div className="text-[13.5px] text-ink-900 leading-snug">{t.title}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <AgentPill agent={t.agent} />
                {t.completed_at && (
                  <span className="text-[11px] text-ink-400 whitespace-nowrap">
                    {fmtDate(t.completed_at)} · {fmtTime(t.completed_at)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
