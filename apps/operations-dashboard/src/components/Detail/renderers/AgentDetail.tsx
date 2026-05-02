import type { AgentHeartbeatRow } from '../../../lib/types'
import { fmtDate, fmtTime, relTime } from '../../../lib/adapters'
import { AgentPill, StatusPill } from '../../atoms'
import { Field, FieldGroup } from './shared'

interface AgentBundle {
  agent: string
  beats: AgentHeartbeatRow[]
}

const STALE_THRESHOLD_MIN = 15

export function AgentDetail({ row }: { row: AgentBundle }) {
  const latest = row.beats[0]
  const ageMin = latest
    ? (Date.now() - new Date(latest.created_at).getTime()) / 60_000
    : null

  let liveness: 'busy' | 'idle' | 'stale' | 'blocked' = 'stale'
  if (latest && ageMin !== null && ageMin <= STALE_THRESHOLD_MIN) {
    if (latest.status === 'working') liveness = 'busy'
    else if (latest.status === 'blocked') liveness = 'blocked'
    else liveness = 'idle'
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400 mb-2">
          Agent
        </div>
        <div className="flex items-center gap-3">
          <AgentPill agent={row.agent} />
          <StatusPill status={liveness} />
        </div>
      </div>

      {latest ? (
        <FieldGroup title="Current state">
          <Field label="Machine" value={latest.machine ?? '—'} />
          <Field label="Current task" value={latest.current_task ?? '—'} />
          <Field
            label="Uptime"
            value={
              latest.uptime_hours !== null
                ? `${latest.uptime_hours.toFixed(1)} h`
                : '—'
            }
          />
          <Field
            label="Memory"
            value={
              latest.memory_usage_mb !== null
                ? `${latest.memory_usage_mb.toFixed(0)} MB`
                : '—'
            }
          />
          <Field
            label="Last heartbeat"
            value={`${fmtDate(latest.created_at)} · ${fmtTime(latest.created_at)} · ${relTime(latest.created_at)}`}
          />
        </FieldGroup>
      ) : (
        <div className="rounded-md border border-ochre-300 bg-ochre-100/60 px-3 py-2.5 text-[12.5px] text-ochre-500">
          No heartbeats in the last 24 hours. Agent may be offline or
          misconfigured.
        </div>
      )}

      <FieldGroup title={`Recent heartbeats (${row.beats.length})`}>
        {row.beats.length === 0 ? (
          <div className="text-[12px] text-ink-400 italic">No data.</div>
        ) : (
          <ul className="divide-y divide-cream-300/70">
            {row.beats.map((b) => (
              <li key={b.id} className="py-2 flex items-start gap-3">
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                    b.status === 'working'
                      ? 'bg-clover-700'
                      : b.status === 'blocked'
                        ? 'bg-ochre-500'
                        : 'bg-ink-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-ink-900 leading-snug">
                    {b.current_task ?? <span className="text-ink-400 italic">idle</span>}
                  </div>
                  <div className="text-[11px] text-ink-400 tabular-nums">
                    {b.status} · {fmtDate(b.created_at)} · {fmtTime(b.created_at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FieldGroup>
    </div>
  )
}
