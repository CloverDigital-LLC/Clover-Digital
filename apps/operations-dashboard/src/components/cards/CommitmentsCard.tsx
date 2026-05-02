import { useMemo, useState } from 'react'
import { Card, StatusPill, EmptyState } from '../atoms'
import { SortMenu } from '../atoms/SortMenu'
import { useCommitments } from '../../hooks/useCommitments'
import { fmtDate } from '../../lib/adapters'
import { useDetail } from '../Detail/DetailContext'
import {
  sortCommitments,
  type CommitmentSortKey,
  COMMITMENT_SORT_OPTIONS,
} from '../../lib/sorting'

export function CommitmentsCard() {
  const { data = [], isLoading } = useCommitments()
  const { open } = useDetail()

  // Always pull active items first, then apply user sort
  const [sortKey, setSortKey] = useState<CommitmentSortKey>('drift')
  const sorted = useMemo(() => {
    // active items first (open / in_progress), then closed
    const activeRank = (s: string) =>
      s === 'open' || s === 'in_progress' ? 0 : 1
    const grouped = [...data].sort(
      (a, b) => activeRank(a.status) - activeRank(b.status),
    )
    return sortCommitments(grouped, sortKey)
  }, [data, sortKey])

  return (
    <Card
      title="Personal commitments"
      action={
        <SortMenu value={sortKey} options={COMMITMENT_SORT_OPTIONS} onChange={setSortKey} />
      }
      footer={
        <>
          <span>{sorted.filter((c) => c.drift_days > 0).length} drifting</span>
          <span>{sorted.length} total</span>
        </>
      }
    >
      {sorted.length === 0 && !isLoading ? (
        <EmptyState icon="·" line="No commitments logged." />
      ) : (
        <ul className="divide-y divide-cream-300/70 -my-2">
          {sorted.map((c) => (
            <li
              key={c.id}
              className="py-2.5 flex items-center gap-3 cursor-pointer hover:bg-cream-100/70 -mx-2 px-2 rounded-md transition"
              title={`${c.title}\nOwner: ${c.owner} · Status: ${c.status}${c.target_date ? ` · Target: ${c.target_date}` : ''}${c.drift_days > 0 ? ` · +${c.drift_days}d drift` : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => open({ kind: 'commitment', id: c.id })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  open({ kind: 'commitment', id: c.id })
                }
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] text-ink-900 leading-snug">{c.title}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-ink-400 whitespace-nowrap">
                    Target {fmtDate(c.target_date)}
                  </span>
                  {c.drift_days > 0 && (
                    <span className="text-[11px] text-ochre-500 font-medium whitespace-nowrap">
                      · +{c.drift_days}d drift
                    </span>
                  )}
                  {c.owner !== 'mason' && (
                    <span className="text-[11px] text-ink-400 whitespace-nowrap">
                      · {c.owner}
                    </span>
                  )}
                </div>
              </div>
              <StatusPill status={c.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
