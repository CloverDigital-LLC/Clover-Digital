/**
 * Per-venture specialty panels rendered between the ProjectHeader and
 * the generic operational columns. Each venture gets a tailored module
 * that reflects its actual shape:
 *
 *  - Clover Digital → ClientPipeline + BrandPulse pointers (full
 *    cards live on /, this is a focused recap)
 *  - Gate-404 → Contracts + on-chain resources surfaced from
 *    project_registry
 *  - Fleet → Agent health rollup + link to /agents
 *  - Yatsu Gaming → Welcome + quick-action checklist (pre-launch)
 *  - Abstract → Knowledge-only retrospective (paused)
 */
import { Link } from 'wouter'
import { Card, EmptyState } from '../components/atoms'
import { listFleetAgents } from '../lib/fleet-roster'
import { useProjectResources, type ProjectResource } from '../hooks/useProject'
import { usePipelineKpis } from '../hooks/usePipeline'
import { useGithubOrgPulse } from '../hooks/useBrandTraction'
import { useAgentLatestHeartbeat } from '../hooks/useAgent'
import { fmtDate, relTime } from '../lib/adapters'

export function ProjectSpecialty({ slug }: { slug: string }) {
  if (slug === 'clover-digital') return <CloverSpecialty />
  if (slug === 'gate-404') return <GateSpecialty />
  if (slug === 'fleet') return <FleetSpecialty />
  if (slug === 'yatsu-gaming') return <YatsuWelcome />
  if (slug === 'abstract') return <AbstractRetro />
  return null
}

// ─── Clover Digital ──────────────────────────────────────────────────

function CloverSpecialty() {
  const { data: kpis } = usePipelineKpis()
  const { data: gh } = useGithubOrgPulse()
  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card title="Pipeline pulse" action={<a href="/" className="text-[11px] text-clover-700 hover:underline">full pipeline ↗</a>}>
        <div className="grid grid-cols-2 gap-3">
          <Kpi label="Active prospects" value={kpis?.active_prospects ?? '—'} />
          <Kpi label="Qualified" value={kpis?.meetings_booked ?? '—'} tone="clover" />
          <Kpi label="Touched 7d" value={kpis?.replies_this_week ?? '—'} />
          <Kpi label="Avg score" value={kpis?.avg_score ?? '—'} />
        </div>
      </Card>

      <Card title="Brand pulse" action={<a href="/" className="text-[11px] text-clover-700 hover:underline">brand card ↗</a>}>
        {gh ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Kpi label="GH repos" value={gh.repo_count} />
              <Kpi label="Stars" value={`★ ${gh.total_stars}`} />
            </div>
            {gh.latest_commit && (
              <>
                <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400 mb-1">Latest commit</div>
                <div className="font-mono text-[11.5px] text-ink-700 leading-snug line-clamp-1">
                  {gh.latest_commit.message}
                </div>
                <div className="text-[11px] text-ink-400 mt-0.5">
                  {gh.latest_commit.repo} · {relTime(gh.latest_commit.date)}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-[12px] text-ink-400 italic">Loading…</div>
        )}
      </Card>

      <CofounderRoster />
    </div>
  )
}

function CofounderRoster() {
  const cofounders = [
    { name: 'Mason', title: 'CEO', email: 'mason@cloverdigital.com' },
    { name: 'Jasper', title: 'CTO', email: 'jasper@cloverdigital.com' },
    { name: 'Shannon', title: 'COO', email: 'shannon@cloverdigital.com' },
    { name: 'Dan', title: 'CMO', email: 'dan@cloverdigital.com' },
  ]
  return (
    <Card title="Cofounders">
      <ul className="space-y-2">
        {cofounders.map((c) => (
          <li key={c.email} className="flex items-baseline justify-between gap-2 text-[13px]">
            <span className="text-ink-900 font-medium">{c.name}</span>
            <span className="text-[11px] uppercase tracking-[0.08em] text-ochre-500 font-medium">
              {c.title}
            </span>
          </li>
        ))}
      </ul>
      <div className="text-[11px] text-ink-400 mt-3">All on the dashboard_users allowlist.</div>
    </Card>
  )
}

// ─── Gate-404 / AI Poker Stars ───────────────────────────────────────

function GateSpecialty() {
  const { data: resources = [], isLoading } = useProjectResources('gate-404')
  const contracts = resources.filter((r) => r.resource_type === 'contract')
  const domains = resources.filter((r) => r.resource_type === 'domain')
  const deployments = resources.filter((r) => r.resource_type === 'deployment')
  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card
        title="Smart contracts"
        action={
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
            Abstract mainnet
          </span>
        }
      >
        {isLoading ? (
          <div className="text-[12px] text-ink-400 italic">Loading…</div>
        ) : contracts.length === 0 ? (
          <EmptyState icon="·" line="No contracts registered." sub="" />
        ) : (
          <ul className="space-y-2">
            {contracts.map((c) => (
              <ResourceRow key={c.id} r={c} mono />
            ))}
          </ul>
        )}
      </Card>

      <Card title="Domains & deployments">
        {isLoading ? (
          <div className="text-[12px] text-ink-400 italic">Loading…</div>
        ) : domains.length + deployments.length === 0 ? (
          <EmptyState icon="·" line="No domains or deployments registered." sub="" />
        ) : (
          <ul className="space-y-2">
            {domains.map((r) => (
              <ResourceRow key={r.id} r={r} />
            ))}
            {deployments.map((r) => (
              <ResourceRow key={r.id} r={r} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

// ─── Fleet ───────────────────────────────────────────────────────────

function FleetSpecialty() {
  const agents = listFleetAgents({ includeMason: false })
  return (
    <div className="mt-6">
      <Card
        title="Agent health"
        action={
          <Link href="/agents">
            <a className="text-[11px] text-clover-700 hover:underline">all agents ↗</a>
          </Link>
        }
      >
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((a) => (
            <FleetAgentChip key={a.id} agentId={a.id} name={a.name} role={a.role} accent={a.accent} runtimeMode={a.runtime_mode} />
          ))}
        </ul>
      </Card>
    </div>
  )
}

function FleetAgentChip({
  agentId,
  name,
  role,
  accent,
  runtimeMode,
}: {
  agentId: string
  name: string
  role: string
  accent: string
  runtimeMode: 'remote-ssh' | 'local' | 'cron'
}) {
  const hb = useAgentLatestHeartbeat(agentId)
  const ageH = hb.data ? (Date.now() - new Date(hb.data.created_at).getTime()) / 3_600_000 : null
  const liveness =
    !hb.data && runtimeMode === 'cron'
      ? { label: 'cron', dot: 'bg-clover-500', text: 'text-ink-700' }
      : !hb.data
        ? { label: 'never', dot: 'bg-ink-400', text: 'text-ink-500' }
        : ageH! > 24
          ? { label: 'stale', dot: 'bg-ochre-500', text: 'text-ochre-500' }
          : ageH! > 1
            ? { label: 'idle', dot: 'bg-ink-400', text: 'text-ink-700' }
            : hb.data.status === 'working'
              ? { label: 'working', dot: 'bg-clover-700 pulse-dot', text: 'text-clover-800' }
              : { label: hb.data.status, dot: 'bg-clover-500', text: 'text-clover-800' }
  return (
    <li>
      <Link href={`/agents/${agentId}`}>
        <a className="block rounded-md border border-cream-300/70 bg-cream-100/40 px-3 py-2.5 hover:border-clover-200 transition cursor-pointer">
          <div className={`h-0.5 ${accent} -mx-3 -mt-2.5 mb-2`} />
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium text-ink-900 text-[13px]">{name}</span>
            <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] ${liveness.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${liveness.dot}`} />
              {liveness.label}
            </span>
          </div>
          <div className="text-[11.5px] text-ink-500 mt-0.5 truncate">{role}</div>
          {hb.data && (
            <div className="text-[11px] text-ink-400 mt-1 tabular-nums">
              seen {relTime(hb.data.created_at)}
            </div>
          )}
        </a>
      </Link>
    </li>
  )
}

// ─── Yatsu Gaming (pre-launch) ───────────────────────────────────────

function YatsuWelcome() {
  return (
    <div className="mt-6">
      <Card
        title="Welcome to Yatsu Gaming"
        action={
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">pre-launch</span>
        }
      >
        <p className="text-[13px] text-ink-700 leading-relaxed">
          The schema accepts <code className="text-[11px]">venture='yatsu-gaming'</code> on every
          fleet table. No goals, tasks, or knowledge yet — that's the next move.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Step
            n={1}
            title="File the first goal"
            sub="What does Yatsu need to ship in the next 30 days? Use the goals table."
          />
          <Step
            n={2}
            title="Register key resources"
            sub="Domain, repo, contracts (if onchain) — log in project_registry with venture='yatsu-gaming'."
          />
          <Step
            n={3}
            title="Decide owning agent"
            sub="Will Bighoss build it, or does this need a new fleet agent?"
          />
          <Step
            n={4}
            title="Add to clover-supabase-sop"
            sub="Once department signals form, document them so cofounder agents can classify Yatsu work correctly."
          />
        </div>
      </Card>
    </div>
  )
}

function Step({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="rounded-md border border-cream-300/70 bg-cream-100/40 px-3 py-2.5">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[20px] tabular-nums text-clover-700 leading-none">
          {n}
        </span>
        <span className="text-[13px] text-ink-900 font-medium">{title}</span>
      </div>
      <div className="text-[11.5px] text-ink-500 mt-1">{sub}</div>
    </div>
  )
}

// ─── Abstract (paused) ───────────────────────────────────────────────

function AbstractRetro() {
  return (
    <div className="mt-6">
      <Card
        title="Status: paused"
        action={
          <span className="text-[11px] uppercase tracking-[0.12em] text-ochre-500">retrospective</span>
        }
      >
        <p className="text-[13px] text-ink-700 leading-relaxed">
          Visa Labs / x402 pitch work paused 2026-04-30. Knowledge entries kept warm; no
          active execution. Pick this venture back up by un-cancelling its goal and
          assigning fresh work.
        </p>
        <div className="text-[11px] text-ink-400 mt-3">
          Last knowledge entry, latest task, and the dropped goal are surfaced in the
          panels below.
        </div>
      </Card>
    </div>
  )
}

// ─── Resource row + KPI helper ───────────────────────────────────────

function ResourceRow({ r, mono }: { r: ProjectResource; mono?: boolean }) {
  const display = r.value ?? r.url ?? r.name ?? ''
  return (
    <li className="text-[13px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.08em] text-ink-400 font-medium">
          {r.resource_type}
        </span>
        {r.verified_at ? (
          <span className="text-[10px] text-clover-700">✓ verified</span>
        ) : (
          <span className="text-[10px] text-ink-400">unverified</span>
        )}
      </div>
      {r.name && <div className="text-ink-900 font-medium leading-snug">{r.name}</div>}
      {display && (
        <div className={`${mono ? 'font-mono text-[11.5px]' : 'text-[12px]'} text-ink-700 break-all leading-snug mt-0.5`}>
          {r.url ? (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-clover-700 hover:underline">
              {display} ↗
            </a>
          ) : (
            display
          )}
        </div>
      )}
      {r.notes && <div className="text-[11px] text-ink-400 mt-0.5 line-clamp-2">{r.notes}</div>}
      {r.verified_at && (
        <div className="text-[10px] text-ink-400 mt-0.5">verified {fmtDate(r.verified_at)}</div>
      )}
    </li>
  )
}

function Kpi({
  label,
  value,
  tone = 'ink',
}: {
  label: string
  value: number | string
  tone?: 'ink' | 'clover'
}) {
  const color = tone === 'clover' ? 'text-clover-700' : 'text-ink-900'
  return (
    <div className="rounded-md border border-cream-300/70 bg-cream-100/40 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">{label}</div>
      <div className={`font-display text-[22px] leading-none mt-1 tabular-nums ${color}`}>
        {value}
      </div>
    </div>
  )
}
