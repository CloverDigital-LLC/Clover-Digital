/**
 * Per-agent profile page. Composes:
 *   - AgentHeader     (name, role, machine, runtime, liveness)
 *   - RuntimeCard     (host/user/runtime/MCP-CLI hint)
 *   - SkillsMatrix    (specialties + out-of-scope)
 *   - WorkQueue       (running / queued / blocked / recently-completed)
 *   - ActivityFeed    (sessions + knowledge + messages, interleaved)
 *   - TrustPanel      (last heartbeat / last task move / freshness)
 *   - MasonLane       (items needing Mason action)
 *   - HandoffPanel    (recent inter-agent messages)
 *
 * Read-only. Apply / status flips still go through fleet MCP.
 */
import { useMemo } from 'react'
import { Link, useRoute } from 'wouter'
import { Card, AgentPill, StatusPill, EmptyState } from '../components/atoms'
import { useDetail } from '../components/Detail/DetailContext'
import { fmtDate, fmtTime, relTime, displayTaskStatus } from '../lib/adapters'
import { getAgent, type FleetAgent } from '../lib/fleet-roster'
import {
  useAgentTasks,
  useAgentMessages,
  useAgentSessions,
  useAgentLatestHeartbeat,
  useAgentKnowledge,
  useDerekPipelineStats,
  useHermesCommsStats,
  useBigHossBuildStats,
  type AgentMessageRow,
  type AgentSessionRow,
  type AgentWorkBuckets,
} from '../hooks/useAgent'
import { ArchivistOverview } from '../components/cards/ArchivistOverview'
import type { AgentTaskRow, KnowledgeRow, AgentHeartbeatRow } from '../lib/types'

export function AgentProfilePage() {
  const [, params] = useRoute('/agents/:name')
  const agentId = params?.name ?? ''
  const agent = getAgent(agentId)

  if (!agent) {
    return (
      <main className="max-w-[1240px] mx-auto px-6 pt-12">
        <div className="text-[13px] text-ink-500">
          Unknown agent: <code>{agentId}</code>.{' '}
          <Link href="/agents" className="text-clover-700 hover:underline">
            ← back to agents
          </Link>
        </div>
      </main>
    )
  }

  return <AgentProfile agent={agent} />
}

function AgentProfile({ agent }: { agent: FleetAgent }) {
  const tasks = useAgentTasks(agent.id)
  const messages = useAgentMessages(agent.id, 15)
  const sessions = useAgentSessions(agent.id, 10)
  const heartbeat = useAgentLatestHeartbeat(agent.id)
  const knowledge = useAgentKnowledge(agent.id, 10)

  const buckets = tasks.data ?? {
    running: [],
    queued: [],
    blocked: [],
    recently_completed: [],
  }

  const masonLaneItems = useMemo(
    () => buildMasonLane(buckets, messages.data ?? []),
    [buckets, messages.data],
  )

  return (
    <main className="max-w-[1240px] mx-auto px-6 pt-8 pb-16">
      <Breadcrumbs name={agent.name} />
      <AgentHeader agent={agent} heartbeat={heartbeat.data ?? null} buckets={buckets} />

      {/* Per-agent specialty panel sits between the header and the
          generic operational columns — the "this is what makes this
          agent different" surface. */}
      <AgentSpecialty agentId={agent.id} />

      <div className="grid grid-cols-12 gap-5 mt-6">
        {/* Left column — operational */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          <WorkQueue buckets={buckets} loading={tasks.isLoading} />
          <ActivityFeed
            sessions={sessions.data ?? []}
            knowledge={knowledge.data ?? []}
            messages={messages.data ?? []}
          />
        </div>

        {/* Right column — context */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <TrustPanel agent={agent} heartbeat={heartbeat.data ?? null} buckets={buckets} />
          <RuntimeCard agent={agent} />
          <SkillsMatrix agent={agent} />
          <MasonLane items={masonLaneItems} />
          <HandoffPanel agentId={agent.id} messages={messages.data ?? []} />
        </div>
      </div>
    </main>
  )
}

/**
 * Per-agent specialty panel. Each agent gets a tailored module that
 * reflects their actual job. Generic agents render nothing here.
 */
function AgentSpecialty({ agentId }: { agentId: string }) {
  if (agentId === 'archivist') {
    return (
      <div className="mt-6">
        <ArchivistOverview />
      </div>
    )
  }
  if (agentId === 'derek') {
    return (
      <div className="mt-6">
        <DerekPipelinePanel />
      </div>
    )
  }
  if (agentId === 'hermes') {
    return (
      <div className="mt-6">
        <HermesCommsPanel />
      </div>
    )
  }
  if (agentId === 'bighoss') {
    return (
      <div className="mt-6">
        <BigHossBuildsPanel />
      </div>
    )
  }
  return null
}

// ─── Derek pipeline ──────────────────────────────────────────────────

function DerekPipelinePanel() {
  const { data, isLoading } = useDerekPipelineStats()
  const { open } = useDetail()
  return (
    <Card
      title="Pipeline pulse"
      action={
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
          cd_target_accounts
        </span>
      }
      footer={
        <>
          <span>
            {data?.qualified_total ?? '—'} qualified · {data?.touched_7d ?? '—'} touched in 7d
          </span>
          <span>{isLoading ? 'Loading…' : 'Live'}</span>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Kpi label="Active prospects" value={data?.active_prospects ?? '—'} />
        <Kpi label="Qualified" value={data?.qualified_total ?? '—'} tone="clover" />
        <Kpi label="Touched 7d" value={data?.touched_7d ?? '—'} />
      </div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400 mb-1.5">
        Most recent touches
      </div>
      {(!data || data.top_recent.length === 0) && !isLoading ? (
        <div className="text-[12px] text-ink-400 italic">No recent touches.</div>
      ) : (
        <ul className="space-y-1.5">
          {data?.top_recent.map((r) => (
            <li
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => open({ kind: 'account', id: r.id })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  open({ kind: 'account', id: r.id })
                }
              }}
              className="flex items-center gap-3 -mx-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-cream-100/70 transition"
            >
              <span className="font-medium text-ink-900 text-[13px] truncate flex-1">
                {r.business_name}
              </span>
              <span className="text-[11px] text-ink-500 hidden sm:inline">
                {r.vertical ?? '—'}
              </span>
              <StatusPill status={r.status} />
              <span className="text-[11px] text-ink-400 tabular-nums whitespace-nowrap">
                {relTime(r.updated_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// ─── Hermes comms ────────────────────────────────────────────────────

function HermesCommsPanel() {
  const { data, isLoading } = useHermesCommsStats()
  const ackRate =
    data && data.routed_24h > 0
      ? Math.round((data.acked / data.routed_24h) * 100)
      : null
  return (
    <Card
      title="Comms triage"
      action={
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
          last 24h
        </span>
      }
      footer={
        <>
          <span>
            {data?.acked ?? '—'} acked · {data?.unacked ?? '—'} unacked
          </span>
          <span>{isLoading ? 'Loading…' : 'Live'}</span>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Kpi label="Routed 24h" value={data?.routed_24h ?? '—'} />
        <Kpi label="Ack rate" value={ackRate !== null ? `${ackRate}%` : '—'} tone="clover" />
        <Kpi
          label="Unacked"
          value={data?.unacked ?? '—'}
          tone={data?.unacked && data.unacked > 0 ? 'ochre' : 'ink'}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400 mb-1.5">
            By type
          </div>
          {!data || data.by_type.length === 0 ? (
            <div className="text-[12px] text-ink-400 italic">—</div>
          ) : (
            <ul className="space-y-1 text-[12.5px]">
              {data.by_type.map((t) => (
                <li key={t.type} className="flex items-baseline justify-between">
                  <span className="text-ink-700">{t.type}</span>
                  <span className="font-mono tabular-nums text-ink-900">{t.n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400 mb-1.5">
            Top partners
          </div>
          {!data || data.top_partners.length === 0 ? (
            <div className="text-[12px] text-ink-400 italic">—</div>
          ) : (
            <ul className="space-y-1 text-[12.5px]">
              {data.top_partners.map((p) => (
                <li key={p.agent} className="flex items-baseline justify-between gap-2">
                  <AgentPill agent={p.agent} />
                  <span className="font-mono tabular-nums text-ink-900">{p.n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── BigHoss builds/deploys ──────────────────────────────────────────

function BigHossBuildsPanel() {
  const { data, isLoading } = useBigHossBuildStats()
  return (
    <Card
      title="Builds & deploys"
      action={
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
          change_log
        </span>
      }
      footer={
        <>
          <span>{data?.deploys_7d ?? '—'} deploys in 7d</span>
          <span>{isLoading ? 'Loading…' : 'Live'}</span>
        </>
      }
    >
      {(!data || data.recent_changes.length === 0) && !isLoading ? (
        <EmptyState
          icon="·"
          line="No recent change-log entries."
          sub="Bighoss writes to change_log when he ships."
        />
      ) : (
        <ul className="space-y-2.5">
          {data?.recent_changes.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-cream-300/70 bg-cream-100/40 px-3 py-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[10px] uppercase tracking-[0.1em] text-ochre-500 font-medium">
                  {c.change_type}
                </span>
                <span className="text-[10px] text-ink-400 tabular-nums">
                  {relTime(c.created_at)}
                </span>
              </div>
              <div className="text-[13px] text-ink-900 leading-snug mt-1 line-clamp-2">
                {c.description ?? '(no description)'}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-ink-400">
                <span>{c.venture ?? 'fleet'}</span>
                {c.verified === false && (
                  <span className="text-ochre-500">unverified</span>
                )}
                {c.verified === true && (
                  <span className="text-clover-700">✓ verified</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Kpi({
  label,
  value,
  tone = 'ink',
}: {
  label: string
  value: number | string
  tone?: 'ink' | 'clover' | 'ochre'
}) {
  const color =
    tone === 'clover' ? 'text-clover-700' : tone === 'ochre' ? 'text-ochre-500' : 'text-ink-900'
  return (
    <div className="rounded-md border border-cream-300/70 bg-cream-100/40 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">{label}</div>
      <div className={`font-display text-[22px] leading-none mt-1 tabular-nums ${color}`}>
        {value}
      </div>
    </div>
  )
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────

function Breadcrumbs({ name }: { name: string }) {
  return (
    <nav className="text-[12px] text-ink-400 mb-3 flex items-center gap-1.5">
      <Link href="/" className="hover:text-clover-700 transition">
        Dashboard
      </Link>
      <span>/</span>
      <Link href="/agents" className="hover:text-clover-700 transition">
        Agents
      </Link>
      <span>/</span>
      <span className="text-ink-700 font-medium">{name}</span>
    </nav>
  )
}

// ─── Header ──────────────────────────────────────────────────────────

function AgentHeader({
  agent,
  heartbeat,
  buckets,
}: {
  agent: FleetAgent
  heartbeat: AgentHeartbeatRow | null
  buckets: AgentWorkBuckets
}) {
  const liveness = deriveLiveness(heartbeat)
  return (
    <div className="rounded-xl bg-cream-50 border border-cream-300/80 shadow-card overflow-hidden">
      <div className={`h-1.5 ${agent.accent}`} />
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-[32px] tracking-tight text-ink-900 leading-none">
                {agent.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-full ${liveness.bg} ${liveness.fg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${liveness.dot}`} />
                {liveness.label}
              </span>
            </div>
            <div className="text-[14px] text-ink-700 mt-1">{agent.role}</div>
            <div className="text-[12.5px] text-ink-500 mt-0.5">{agent.tagline}</div>
          </div>
          <div className="flex items-baseline gap-5 flex-wrap">
            <Stat label="Running" value={buckets.running.length} />
            <Stat label="Queued" value={buckets.queued.length} />
            <Stat label="Blocked" value={buckets.blocked.length} tone={buckets.blocked.length > 0 ? 'ochre' : 'ink'} />
            <Stat label="Done 7d" value={buckets.recently_completed.length} tone="clover" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone = 'ink',
}: {
  label: string
  value: number | string
  tone?: 'ink' | 'clover' | 'ochre'
}) {
  const color =
    tone === 'clover' ? 'text-clover-700' : tone === 'ochre' ? 'text-ochre-500' : 'text-ink-900'
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">{label}</div>
      <div className={`font-display text-[22px] leading-none mt-1 tabular-nums ${color}`}>{value}</div>
    </div>
  )
}

function deriveLiveness(hb: AgentHeartbeatRow | null) {
  if (!hb) return { label: 'never seen', bg: 'bg-cream-200', fg: 'text-ink-500', dot: 'bg-ink-400' }
  const ageMin = (Date.now() - new Date(hb.created_at).getTime()) / 60_000
  if (ageMin > 24 * 60)
    return { label: 'stale', bg: 'bg-ochre-100', fg: 'text-ochre-500', dot: 'bg-ochre-500' }
  if (ageMin > 60)
    return { label: 'idle', bg: 'bg-cream-200', fg: 'text-ink-700', dot: 'bg-ink-400' }
  if (hb.status === 'working')
    return { label: 'working', bg: 'bg-clover-50', fg: 'text-clover-800', dot: 'bg-clover-700 pulse-dot' }
  if (hb.status === 'blocked')
    return { label: 'blocked', bg: 'bg-ochre-100', fg: 'text-ochre-500', dot: 'bg-ochre-500' }
  return { label: hb.status, bg: 'bg-clover-50', fg: 'text-clover-800', dot: 'bg-clover-500' }
}

// ─── Runtime ─────────────────────────────────────────────────────────

function RuntimeCard({ agent }: { agent: FleetAgent }) {
  return (
    <Card title="Runtime">
      <dl className="space-y-2 text-[13px]">
        <Row label="Host" value={`${agent.user}@${agent.machine}`} mono />
        <Row label="Runtime" value={agent.runtime} mono />
        <Row
          label="Mode"
          value={
            agent.runtime_mode === 'remote-ssh'
              ? 'Remote SSH dispatch'
              : agent.runtime_mode === 'cron'
                ? 'Scheduled cron'
                : 'Local interactive'
          }
        />
        <Row label="Agent ID" value={agent.id} mono />
      </dl>
    </Card>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-400 font-medium w-20 shrink-0">
        {label}
      </dt>
      <dd className={`text-ink-900 ${mono ? 'font-mono text-[12px]' : ''} break-all`}>{value}</dd>
    </div>
  )
}

// ─── Skills ──────────────────────────────────────────────────────────

function SkillsMatrix({ agent }: { agent: FleetAgent }) {
  return (
    <Card title="Skills & scope">
      <div>
        <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400 mb-1.5">Owns</div>
        <ul className="space-y-1 text-[13px] text-ink-900">
          {agent.specialties.map((s) => (
            <li key={s} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-clover-500 shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
      {agent.out_of_scope.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400 mb-1.5">
            Not theirs
          </div>
          <ul className="space-y-1 text-[12.5px] text-ink-500">
            {agent.out_of_scope.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cream-300 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {agent.skills.map((s) => (
          <span
            key={s}
            className="text-[10px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-cream-200 text-ink-700"
          >
            {s}
          </span>
        ))}
      </div>
    </Card>
  )
}

// ─── Work queue ──────────────────────────────────────────────────────

function WorkQueue({
  buckets,
  loading,
}: {
  buckets: AgentWorkBuckets
  loading: boolean
}) {
  const sections: Array<{
    key: keyof AgentWorkBuckets
    title: string
    list: AgentTaskRow[]
    tone: 'clover' | 'ochre' | 'ink'
  }> = [
    { key: 'running', title: 'Running', list: buckets.running, tone: 'clover' },
    { key: 'blocked', title: 'Blocked', list: buckets.blocked, tone: 'ochre' },
    { key: 'queued', title: 'Queued', list: buckets.queued, tone: 'ink' },
    {
      key: 'recently_completed',
      title: 'Completed (7d)',
      list: buckets.recently_completed,
      tone: 'clover',
    },
  ]
  const total =
    buckets.running.length +
    buckets.queued.length +
    buckets.blocked.length +
    buckets.recently_completed.length
  return (
    <Card
      title="Work queue"
      footer={
        <>
          <span>{total} items in scope</span>
          <span>{loading ? 'Loading…' : 'Live'}</span>
        </>
      }
    >
      {total === 0 && !loading ? (
        <EmptyState icon="○" line="No work in queue." sub="Quiet on this agent right now." />
      ) : (
        <div className="space-y-4">
          {sections.map((s) =>
            s.list.length === 0 ? null : (
              <div key={s.key}>
                <div className="text-[11px] uppercase tracking-[0.1em] text-ink-400 mb-1.5 flex items-baseline gap-2">
                  <span>{s.title}</span>
                  <span className="text-ink-700 tabular-nums">{s.list.length}</span>
                </div>
                <ul className="space-y-1.5">
                  {s.list.slice(0, 6).map((t) => (
                    <TaskRow key={t.id} t={t} />
                  ))}
                  {s.list.length > 6 && (
                    <li className="text-[11px] text-ink-400 italic pl-2">
                      +{s.list.length - 6} more
                    </li>
                  )}
                </ul>
              </div>
            ),
          )}
        </div>
      )}
    </Card>
  )
}

function TaskRow({ t }: { t: AgentTaskRow }) {
  const { open } = useDetail()
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => open({ kind: 'task', id: t.id })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open({ kind: 'task', id: t.id })
        }
      }}
      className="flex items-start gap-2.5 -mx-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-cream-100/70 transition"
      title={t.description ?? t.title}
    >
      <span
        className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
          t.status === 'completed'
            ? 'bg-clover-500'
            : t.status === 'blocked'
              ? 'bg-ochre-500'
              : t.status === 'queued'
                ? 'bg-ink-400'
                : 'bg-clover-700'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-ink-900 leading-snug truncate">{t.title}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <StatusPill status={displayTaskStatus(t)} />
          {t.priority && (
            <span className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
              {t.priority}
            </span>
          )}
          <span className="text-[11px] text-ink-400 ml-auto whitespace-nowrap">
            {relTime(t.created_at)}
          </span>
        </div>
      </div>
    </li>
  )
}

// ─── Activity feed ───────────────────────────────────────────────────

interface FeedEntry {
  id: string
  kind: 'session' | 'knowledge' | 'message'
  title: string
  sub: string
  at: string
  onOpen?: () => void
  tone: 'clover' | 'ochre' | 'ink'
}

function ActivityFeed({
  sessions,
  knowledge,
  messages,
}: {
  sessions: AgentSessionRow[]
  knowledge: KnowledgeRow[]
  messages: AgentMessageRow[]
}) {
  const { open } = useDetail()
  const entries: FeedEntry[] = useMemo(() => {
    const out: FeedEntry[] = []
    for (const s of sessions) {
      out.push({
        id: `session-${s.id}`,
        kind: 'session',
        title: s.summary
          ? s.summary.slice(0, 100)
          : `Session · ${s.outcome ?? 'unknown'}`,
        sub: `session · ${s.outcome ?? 'unknown'} · ${s.venture ?? 'fleet'}`,
        at: s.created_at,
        tone: 'ink',
      })
    }
    for (const k of knowledge) {
      out.push({
        id: `k-${k.id}`,
        kind: 'knowledge',
        title: k.title,
        sub: `knowledge · ${k.category} · ${k.project}`,
        at: k.created_at,
        onOpen: () => open({ kind: 'knowledge', id: k.id }),
        tone: 'clover',
      })
    }
    for (const m of messages) {
      out.push({
        id: `m-${m.id}`,
        kind: 'message',
        title: m.subject ?? `${m.message_type} → ${m.to_agent}`,
        sub: `message · ${m.from_agent} → ${m.to_agent} · ${m.message_type}`,
        at: m.created_at,
        tone: m.acknowledged ? 'ink' : 'ochre',
      })
    }
    out.sort((a, b) => +new Date(b.at) - +new Date(a.at))
    return out.slice(0, 30)
  }, [sessions, knowledge, messages, open])

  return (
    <Card title="Recent activity" scrollBody className="max-h-[460px]">
      {entries.length === 0 ? (
        <EmptyState icon="·" line="No recent activity." sub="Sessions, knowledge, messages will land here." />
      ) : (
        <ul className="space-y-2.5 relative">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-cream-300" />
          {entries.map((e) => (
            <li
              key={e.id}
              className={`relative pl-5 ${e.onOpen ? 'cursor-pointer rounded-md hover:bg-cream-100/70 -ml-2 pl-7 py-1.5' : ''}`}
              role={e.onOpen ? 'button' : undefined}
              tabIndex={e.onOpen ? 0 : undefined}
              onClick={e.onOpen}
              onKeyDown={(ev) => {
                if (e.onOpen && (ev.key === 'Enter' || ev.key === ' ')) {
                  ev.preventDefault()
                  e.onOpen()
                }
              }}
            >
              <span
                className={`absolute ${e.onOpen ? 'left-2' : 'left-0'} top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-cream-50 ${
                  e.tone === 'clover'
                    ? 'bg-clover-500'
                    : e.tone === 'ochre'
                      ? 'bg-ochre-500'
                      : 'bg-ink-400'
                }`}
              />
              <div className="text-[13px] text-ink-900 leading-snug truncate">{e.title}</div>
              <div className="text-[11px] text-ink-400 mt-0.5">{e.sub} · {relTime(e.at)}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// ─── Trust ───────────────────────────────────────────────────────────

function TrustPanel({
  agent,
  heartbeat,
  buckets,
}: {
  agent: FleetAgent
  heartbeat: AgentHeartbeatRow | null
  buckets: AgentWorkBuckets
}) {
  const lines: Array<{ label: string; value: string; tone?: 'clover' | 'ochre' | 'ink' }> = []
  if (heartbeat) {
    lines.push({
      label: 'Last heartbeat',
      value: `${fmtDate(heartbeat.created_at)} · ${fmtTime(heartbeat.created_at)} · ${relTime(heartbeat.created_at)}`,
      tone: hoursAgo(heartbeat.created_at) > 24 ? 'ochre' : 'clover',
    })
  } else if (agent.runtime_mode === 'cron') {
    lines.push({
      label: 'Heartbeats',
      value: 'cron agent — see sessions',
      tone: 'ink',
    })
  } else {
    lines.push({
      label: 'Heartbeats',
      value: 'never seen',
      tone: 'ochre',
    })
  }
  const lastTaskMove = [...buckets.running, ...buckets.recently_completed]
    .map((t) => t.completed_at ?? t.started_at ?? t.created_at)
    .sort()
    .reverse()[0]
  if (lastTaskMove) {
    lines.push({
      label: 'Last task move',
      value: relTime(lastTaskMove),
      tone: hoursAgo(lastTaskMove) > 48 ? 'ochre' : 'clover',
    })
  }
  return (
    <Card title="Trust & freshness">
      <ul className="space-y-2 text-[13px]">
        {lines.map((l, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] uppercase tracking-[0.08em] text-ink-400">
              {l.label}
            </span>
            <span
              className={`tabular-nums text-right ${
                l.tone === 'clover'
                  ? 'text-clover-700'
                  : l.tone === 'ochre'
                    ? 'text-ochre-500'
                    : 'text-ink-700'
              }`}
            >
              {l.value}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000
}

// ─── Mason lane ──────────────────────────────────────────────────────

interface MasonLaneItem {
  id: string
  title: string
  why: string
  task_id?: string
}

function buildMasonLane(
  buckets: AgentWorkBuckets,
  messages: AgentMessageRow[],
): MasonLaneItem[] {
  const items: MasonLaneItem[] = []
  for (const t of buckets.blocked) {
    items.push({
      id: `blocked-${t.id}`,
      title: t.title,
      why: t.error ? `blocked: ${t.error.slice(0, 100)}` : 'blocked — no error set',
      task_id: t.id,
    })
  }
  for (const m of messages.filter((m) => !m.acknowledged && m.message_type === 'escalation')) {
    items.push({
      id: `esc-${m.id}`,
      title: m.subject ?? 'Escalation',
      why: `unacked escalation from ${m.from_agent}`,
    })
  }
  return items.slice(0, 8)
}

function MasonLane({ items }: { items: MasonLaneItem[] }) {
  const { open } = useDetail()
  return (
    <Card title="Needs Mason">
      {items.length === 0 ? (
        <div className="text-[12px] text-ink-400 italic">All clear.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              role={it.task_id ? 'button' : undefined}
              tabIndex={it.task_id ? 0 : undefined}
              onClick={
                it.task_id ? () => open({ kind: 'task', id: it.task_id! }) : undefined
              }
              className={`text-[13px] leading-snug px-2 py-1.5 -mx-2 rounded-md ${
                it.task_id ? 'cursor-pointer hover:bg-cream-100/70 transition' : ''
              }`}
            >
              <div className="text-ink-900">{it.title}</div>
              <div className="text-[11px] text-ochre-500 mt-0.5">{it.why}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// ─── Handoff panel ───────────────────────────────────────────────────

function HandoffPanel({
  agentId,
  messages,
}: {
  agentId: string
  messages: AgentMessageRow[]
}) {
  const recent = messages.slice(0, 6)
  return (
    <Card title="Handoffs">
      {recent.length === 0 ? (
        <div className="text-[12px] text-ink-400 italic">
          No recent inter-agent messages.
        </div>
      ) : (
        <ul className="space-y-2">
          {recent.map((m) => {
            const incoming = m.to_agent === agentId
            const counterpart = incoming ? m.from_agent : m.to_agent
            return (
              <li key={m.id} className="text-[13px] leading-snug">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-ink-400 font-mono">
                    {incoming ? '←' : '→'}
                  </span>
                  <AgentPill agent={counterpart} />
                  <span className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
                    {m.message_type}
                  </span>
                  {!m.acknowledged && (
                    <span className="text-[10px] text-ochre-500">unacked</span>
                  )}
                </div>
                <div className="text-ink-900 mt-0.5 truncate">
                  {m.subject ?? m.body?.slice(0, 80) ?? '—'}
                </div>
                <div className="text-[11px] text-ink-400 mt-0.5">
                  {relTime(m.created_at)}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
