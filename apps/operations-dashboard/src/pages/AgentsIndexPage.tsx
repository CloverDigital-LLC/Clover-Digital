/**
 * Agent index — grid of fleet agent cards. Each card links to the
 * full profile page at /agents/<id>. Shows quick liveness + current
 * work-load so Mason can scan the fleet at a glance.
 */
import { Link } from 'wouter'
import { Card } from '../components/atoms'
import { listFleetAgents, type FleetAgent } from '../lib/fleet-roster'
import { useAgentTasks, useAgentLatestHeartbeat } from '../hooks/useAgent'
import { relTime } from '../lib/adapters'

export function AgentsIndexPage() {
  const agents = listFleetAgents({ includeMason: false })
  return (
    <main className="max-w-[1240px] mx-auto px-6 pt-8 pb-16">
      <nav className="text-[12px] text-ink-400 mb-3 flex items-center gap-1.5">
        <Link href="/" className="hover:text-clover-700 transition">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">Agents</span>
      </nav>
      <h1 className="font-display text-[34px] tracking-tight text-ink-900 leading-tight">
        Fleet agents
      </h1>
      <p className="text-[13.5px] text-ink-500 mt-1 mb-8">
        Each agent is a runtime with a role, a machine, and a queue.
        Click any to see what they're doing right now.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((a) => (
          <AgentTile key={a.id} agent={a} />
        ))}
      </div>
    </main>
  )
}

function AgentTile({ agent }: { agent: FleetAgent }) {
  const tasks = useAgentTasks(agent.id)
  const heartbeat = useAgentLatestHeartbeat(agent.id)
  const buckets = tasks.data ?? {
    running: [],
    queued: [],
    blocked: [],
    recently_completed: [],
  }
  const liveness = livenessFor(heartbeat.data?.created_at ?? null, heartbeat.data?.status ?? null, agent.runtime_mode)
  return (
    <Link href={`/agents/${agent.id}`}>
      <a className="block">
        <Card className="hover:border-clover-300 transition cursor-pointer">
          <div className={`h-1 ${agent.accent} -mx-5 -mt-4 mb-3`} />
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-[20px] text-ink-900 leading-none">
              {agent.name}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-full ${liveness.bg} ${liveness.fg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${liveness.dot}`} />
              {liveness.label}
            </span>
          </div>
          <div className="text-[12.5px] text-ink-700 mt-1">{agent.role}</div>
          <div className="text-[11.5px] text-ink-500 mt-0.5 line-clamp-2">{agent.tagline}</div>

          <div className="mt-3 flex items-baseline gap-3 text-[12px] tabular-nums">
            <span>
              <span className="font-medium text-ink-900">{buckets.running.length}</span>
              <span className="text-ink-400"> running</span>
            </span>
            <span>
              <span className="font-medium text-ink-900">{buckets.queued.length}</span>
              <span className="text-ink-400"> queued</span>
            </span>
            <span>
              <span
                className={`font-medium ${
                  buckets.blocked.length > 0 ? 'text-ochre-500' : 'text-ink-900'
                }`}
              >
                {buckets.blocked.length}
              </span>
              <span className="text-ink-400"> blocked</span>
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between text-[11px] text-ink-400">
            <span className="font-mono">{agent.user}@{agent.machine}</span>
            <span>
              {heartbeat.data ? `seen ${relTime(heartbeat.data.created_at)}` : '—'}
            </span>
          </div>
        </Card>
      </a>
    </Link>
  )
}

function livenessFor(latestAt: string | null, status: string | null, mode: FleetAgent['runtime_mode']) {
  if (!latestAt && mode === 'cron')
    return { label: 'cron', bg: 'bg-cream-200', fg: 'text-ink-700', dot: 'bg-clover-500' }
  if (!latestAt) return { label: 'never seen', bg: 'bg-cream-200', fg: 'text-ink-500', dot: 'bg-ink-400' }
  const ageH = (Date.now() - new Date(latestAt).getTime()) / 3_600_000
  if (ageH > 24) return { label: 'stale', bg: 'bg-ochre-100', fg: 'text-ochre-500', dot: 'bg-ochre-500' }
  if (ageH > 1) return { label: 'idle', bg: 'bg-cream-200', fg: 'text-ink-700', dot: 'bg-ink-400' }
  if (status === 'working')
    return { label: 'working', bg: 'bg-clover-50', fg: 'text-clover-800', dot: 'bg-clover-700 pulse-dot' }
  return { label: status ?? 'idle', bg: 'bg-clover-50', fg: 'text-clover-800', dot: 'bg-clover-500' }
}
