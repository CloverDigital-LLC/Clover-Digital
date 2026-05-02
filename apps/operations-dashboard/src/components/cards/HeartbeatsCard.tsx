import { useMemo, useState } from 'react'
import { Card, AgentPill, StatusPill, EmptyState } from '../atoms'
import { SortMenu } from '../atoms/SortMenu'
import { useHeartbeats } from '../../hooks/useHeartbeats'
import { relTime, fmtTime } from '../../lib/adapters'
import { useDetail } from '../Detail/DetailContext'
import {
  sortHeartbeats,
  type HeartbeatSortKey,
  HEARTBEAT_SORT_OPTIONS,
} from '../../lib/sorting'

export function HeartbeatsCard() {
  const { data = [], isLoading } = useHeartbeats()
  const { open } = useDetail()
  const [sortKey, setSortKey] = useState<HeartbeatSortKey>('last_seen')
  const sorted = useMemo(() => sortHeartbeats(data, sortKey), [data, sortKey])

  return (
    <Card
      id="heartbeats-card"
      title="Agent heartbeats"
      action={
        <SortMenu value={sortKey} options={HEARTBEAT_SORT_OPTIONS} onChange={setSortKey} />
      }
      footer={
        <>
          <span>{data.length} agents</span>
          <span>Polling 30s</span>
        </>
      }
    >
      {data.length === 0 && !isLoading ? (
        <EmptyState icon="·" line="No heartbeats in last 24h." sub="Agents may be offline." />
      ) : (
        <ul className="divide-y divide-cream-300/70 -my-2">
          {sorted.map((h) => (
            <li
              key={h.agent}
              className="py-3 flex items-center gap-3 cursor-pointer hover:bg-cream-100/70 -mx-2 px-2 rounded-md transition"
              role="button"
              tabIndex={0}
              onClick={() => open({ kind: 'agent', id: h.agent })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  open({ kind: 'agent', id: h.agent })
                }
              }}
              title={`${h.agent} · ${h.status} · last seen ${relTime(h.last_seen_at)}`}
            >
              <AgentPill agent={h.agent} />
              <div className="flex-1 text-[12px] text-ink-500 tabular-nums">
                Last seen {relTime(h.last_seen_at)}{' '}
                <span className="text-ink-400">· {fmtTime(h.last_seen_at)}</span>
              </div>
              <StatusPill status={h.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
