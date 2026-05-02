import { useMemo, useState } from 'react'
import { Card, Kpi, Score, StatusPill } from '../atoms'
import { usePipeline, usePipelineKpis } from '../../hooks/usePipeline'
import { relTime } from '../../lib/adapters'
import { useDetail } from '../Detail/DetailContext'

type SortKey = 'business_name' | 'vertical' | 'city' | 'score' | 'status' | 'last_touch_at'

export function PipelineCard() {
  const [showAll, setShowAll] = useState(false)
  const { data: kpis } = usePipelineKpis()
  const total = kpis?.active_prospects ?? 0
  // When expanded, fetch up to whatever the active count is (capped at 500
  // for sanity; the dashboard isn't a CRM browser).
  const limit = showAll ? Math.min(total || 500, 500) : 10
  const { data: rows = [], isLoading } = usePipeline(limit)
  const { open } = useDetail()
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    const out = [...rows]
    out.sort((a, b) => {
      let av: number | string = a[sortKey] as number | string
      let bv: number | string = b[sortKey] as number | string
      if (sortKey === 'last_touch_at') {
        av = new Date(av as string).getTime()
        bv = new Date(bv as string).getTime()
      }
      if (typeof av === 'string') {
        av = av.toLowerCase()
        bv = (bv as string).toLowerCase()
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return out
  }, [rows, sortKey, sortDir])

  function setSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'score' || k === 'last_touch_at' ? 'desc' : 'asc')
    }
  }

  const cols: { k: SortKey; label: string; align?: 'right' }[] = [
    { k: 'business_name', label: 'Business' },
    { k: 'vertical', label: 'Vertical' },
    { k: 'city', label: 'City' },
    { k: 'score', label: 'Score' },
    { k: 'status', label: 'Status' },
    { k: 'last_touch_at', label: 'Last touch', align: 'right' },
  ]

  return (
    <Card
      id="pipeline-card"
      title="Pipeline"
      action={
        total > 10 ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="hover:underline cursor-pointer"
          >
            {showAll ? `Show top 10 ↑` : `See all ${total} →`}
          </button>
        ) : undefined
      }
      footer={
        <>
          <span>
            {showAll
              ? `All ${rows.length} of ${total} active prospects`
              : `Top ${Math.min(10, total)} of ${total} active prospects`}
          </span>
          <span>{isLoading ? 'Loading…' : 'Live'}</span>
        </>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Kpi
          label="Active prospects"
          value={kpis?.active_prospects ?? '—'}
          delta="from cd_target_accounts"
        />
        <Kpi label="Avg score" value={kpis?.avg_score ?? '—'} delta="of fit_score" />
        <Kpi
          label="Touched this wk"
          value={kpis?.replies_this_week ?? '—'}
          delta="updated last 7d"
        />
        <Kpi
          label="Qualified"
          value={kpis?.meetings_booked ?? '—'}
          delta="this week"
          highlight
        />
      </div>

      <div className="overflow-x-auto scroll-soft -mx-1">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-ink-400 border-b border-cream-300">
              {cols.map((c) => (
                <th
                  key={c.k}
                  className={`py-2 px-1 font-medium ${
                    c.align === 'right' ? 'text-right' : ''
                  } cursor-pointer hover:text-ink-700 select-none`}
                  onClick={() => setSort(c.k)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {sortKey === c.k && (
                      <span className="text-clover-700">
                        {sortDir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-300/70">
            {sorted.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={cols.length}
                  className="py-8 text-center text-[13px] text-ink-400 italic"
                >
                  No active prospects yet.
                </td>
              </tr>
            )}
            {sorted.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-cream-100/60 transition cursor-pointer"
                title={`${r.business_name} · ${r.vertical} · ${r.city}\nScore ${r.score}/5 · Status ${r.status}`}
                role="button"
                tabIndex={0}
                onClick={() => open({ kind: 'account', id: r.id })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    open({ kind: 'account', id: r.id })
                  }
                }}
              >
                <td className="py-2.5 px-1 font-medium text-ink-900">
                  {r.business_name}
                </td>
                <td className="py-2.5 px-1 text-ink-700">{r.vertical}</td>
                <td className="py-2.5 px-1 text-ink-500">{r.city}</td>
                <td className="py-2.5 px-1">
                  <Score value={r.score} />
                </td>
                <td className="py-2.5 px-1">
                  <StatusPill status={r.status} />
                </td>
                <td className="py-2.5 px-1 text-right text-ink-500 tabular-nums">
                  {relTime(r.last_touch_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
