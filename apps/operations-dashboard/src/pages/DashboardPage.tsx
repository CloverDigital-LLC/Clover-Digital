/**
 * Main dashboard page — true overview surface.
 *
 * Cards that have their own home on /projects/<slug> or /agents/<id>
 * are NOT duplicated here. Dashboard answers "what needs me right now"
 * and "did anything move recently" — full deep-dive lives elsewhere.
 *
 * Pass 2 of the ADHD layout work: aggressive slim now that project +
 * agent pages exist.
 */
import { Link } from 'wouter'
import { useVentureFilter } from '../context/VentureFilterContext'
import { useAuth } from '../auth/AuthProvider'
import { Card } from '../components/atoms'
import { CommandCenterCard } from '../components/cards/CommandCenterCard'
import { BriefingCard } from '../components/cards/BriefingCard'
import { BlockersCard } from '../components/cards/BlockersCard'
import { ActiveWorkCard } from '../components/cards/ActiveWorkCard'
import { RecentlyShippedCard } from '../components/cards/RecentlyShippedCard'
import { KnowledgeCard } from '../components/cards/KnowledgeCard'
import { CommitmentsCard } from '../components/cards/CommitmentsCard'
import { GoalsCard } from '../components/cards/GoalsCard'
import { TodayStripe } from '../components/TodayStripe'
import { WinsStripe } from '../components/WinsStripe'
import { MoneyMeter } from '../components/MoneyMeter'
import { useProjectGoals, useProjectTasks } from '../hooks/useProject'
import { usePipelineKpis } from '../hooks/usePipeline'
import { listFleetAgents } from '../lib/fleet-roster'
import { useHeartbeats } from '../hooks/useHeartbeats'
import { PROJECT_ROSTER } from '../lib/project-roster'
import { useFocusMode } from '../hooks/useFocusMode'
import { dashboardSurface } from '../lib/surface'
import { CLOVER_AGENT_REGISTRY } from '../lib/cloverAgents'
import { DEPARTMENTS } from '../lib/departments'

export function DashboardPage() {
  const { role } = useAuth()
  const { viewRole } = useVentureFilter()
  const canViewAdmin = role === 'admin'
  const showAdmin = canViewAdmin && viewRole === 'admin'
  // Mason-only flourishes: money meter, ship streak, attention pills, and
  // the focus-mode toggle. Cofounders see a clean greeting → CommandCenter
  // → Briefing → Goals → Work flow without the dopamine surfaces.
  const isAdminView = viewRole === 'admin'
  const [focusMode, setFocusMode] = useFocusMode()
  // focusMode persists in localStorage; gate it on admin view so a stale
  // value can't hide cofounder-facing surfaces.
  const effectiveFocus = isAdminView && focusMode
  const today = new Date()
  const greetingHour = today.getHours()
  const greeting =
    greetingHour < 12
      ? 'Good morning'
      : greetingHour < 17
        ? 'Good afternoon'
        : 'Good evening'

  return (
    <main className="max-w-[1240px] mx-auto px-6 pt-8">
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-400 mb-1.5">
              {today.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <h1 className="font-display text-[34px] tracking-tight text-ink-900 leading-[1.15] pb-1">
              {greeting}.{' '}
              <span className="italic text-clover-800">
                {isAdminView && focusMode
                  ? "Just the urgent stuff."
                  : "Here's the field today."}
              </span>
            </h1>
          </div>
          {isAdminView && (
            <FocusToggle focusMode={focusMode} setFocusMode={setFocusMode} />
          )}
        </div>
        {/* Top dopamine block — admin only. Money thermometer, then a single
            wrapping pill row mixing momentum (WinsStripe) with attention
            (TodayStripe). Cofounders skip this entirely. */}
        {isAdminView && (
          <div className="mt-4 space-y-3">
            <MoneyMeter />
            <div className="flex items-center gap-2 flex-wrap">
              <WinsStripe />
              <TodayStripe />
            </div>
          </div>
        )}
      </div>

      <div className="mb-5">
        <CommandCenterCard />
      </div>

      {!effectiveFocus && (
        <div className="mb-10">
          <BriefingCard />
        </div>
      )}

      {!effectiveFocus && (
        <>
          <SectionHeader
            title="Goals"
            sub="Click any goal to see linked tasks and commitments."
          />
          <div className="grid grid-cols-12 gap-5 mb-12">
            <div className="col-span-12">
              <GoalsCard />
            </div>
          </div>
        </>
      )}

      {effectiveFocus ? (
        // Focus mode: only the one card that screams "you" — full-width,
        // no section header. Everything else has a project/agent home.
        <div className="grid grid-cols-12 gap-5 auto-rows-[420px]">
          <div className="col-span-12">
            <BlockersCard />
          </div>
        </div>
      ) : (
        <>
          <SectionHeader
            title="Work"
            sub="Inspect, unblock, ship."
          />
          <div className="grid grid-cols-12 gap-5 auto-rows-[420px]">
            <div className="col-span-12 lg:col-span-7">
              <BlockersCard />
            </div>
            <div className="col-span-12 lg:col-span-5">
              <ActiveWorkCard />
            </div>
            <div className="col-span-12 lg:col-span-7">
              <RecentlyShippedCard />
            </div>
            <div className="col-span-12 lg:col-span-5">
              <KnowledgeCard />
            </div>
          </div>
        </>
      )}

      {/* Deep-dive pointers — admin-only. Cofounders can't navigate to
          /projects or /agents, so these tiles would be dead ends. Also
          hidden in focus mode (the goal is "less to look at"). */}
      {isAdminView && !effectiveFocus && (
        <div className="mt-12">
          <SectionHeader title="Go deeper" sub="Project pages and agent profiles, with live counts." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CloverDeepLink />
            <ProjectsDeepLink />
            <AgentsDeepLink />
          </div>
        </div>
      )}

      {!isAdminView && !effectiveFocus && (
        <div className="mt-12">
          <SectionHeader title="Team areas" sub="Department lanes and Clover agents." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <TeamDepartmentsDeepLink />
            <TeamAgentsDeepLink />
          </div>
        </div>
      )}

      {!effectiveFocus && showAdmin && (
        <div className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-ochre-500 font-medium mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ochre-500" />
                Admin only
              </div>
              <h2 className="font-display text-[26px] tracking-tight text-ink-900 leading-tight italic">
                Behind the curtain.
              </h2>
              <div className="text-[13px] text-ink-500 mt-1">
                Mason follow-ups. The full Archivist + cross-venture surfaces moved
                to <Link href="/agents/archivist"><a className="text-clover-700 hover:underline">/agents/archivist</a></Link> and{' '}
                <Link href="/projects"><a className="text-clover-700 hover:underline">/projects</a></Link>.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12">
              <CommitmentsCard />
            </div>
          </div>
        </div>
      )}

      <footer className="mt-20 pt-6 border-t border-cream-300/70 flex items-center justify-between text-[11px] text-ink-400">
        <div>
          {dashboardSurface === 'admin'
            ? 'Mason Admin · prairie-fleet blackboard · v0.9'
            : 'Clover Digital · Clover Ops · v0.9'}
        </div>
        <div>Springfield, IL</div>
      </footer>
    </main>
  )
}

/**
 * Focus-mode toggle pill. Calm clover styling when off, ochre when on
 * (because focus mode IS the alert state — "I'm trying to concentrate").
 * `f` keyboard shortcut handled in the hook; the title attr surfaces it.
 */
function FocusToggle({
  focusMode,
  setFocusMode,
}: {
  focusMode: boolean
  setFocusMode: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => setFocusMode(!focusMode)}
      className={
        focusMode
          ? 'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ochre-100 ring-1 ring-ochre-300/60 text-[12px] text-ochre-500 font-medium hover:brightness-95 transition'
          : 'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-50 dark:bg-night-800 ring-1 ring-cream-300 text-[12px] text-ink-500 hover:bg-cream-100 hover:text-ink-700 transition'
      }
      title="Focus mode — hide low-urgency cards. Press f."
    >
      <span
        className={
          focusMode
            ? 'w-1.5 h-1.5 rounded-full bg-ochre-500'
            : 'w-1.5 h-1.5 rounded-full bg-ink-300'
        }
      />
      {focusMode ? 'Focus on' : 'Focus'}
      <span className="text-[10px] text-ink-400 font-mono ml-0.5">f</span>
    </button>
  )
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-[26px] tracking-tight text-ink-900 leading-tight">
          {title}
        </h2>
        {sub && <div className="text-[13px] text-ink-500 mt-1">{sub}</div>}
      </div>
    </div>
  )
}

/**
 * Live-count deep-link tile. Reuses real hooks so the dashboard never
 * shows stale "click here →" copy; if the project has 9 open goals,
 * the tile says 9 open goals.
 */
function DeepLinkTile({
  href,
  title,
  stats,
}: {
  href: string
  title: string
  stats: Array<{ value: number | string; label: string; tone?: 'ink' | 'clover' | 'ochre' }>
}) {
  return (
    <Link href={href}>
      <a className="block">
        <Card className="hover:border-clover-300 transition cursor-pointer">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-[18px] text-ink-900 leading-tight">
              {title}
            </h3>
            <span className="text-clover-700 text-[14px]">→</span>
          </div>
          <div className="mt-3 flex items-baseline gap-3 flex-wrap">
            {stats.map((s, i) => {
              const color =
                s.tone === 'clover'
                  ? 'text-clover-700'
                  : s.tone === 'ochre'
                    ? 'text-ochre-500'
                    : 'text-ink-900'
              return (
                <span key={i} className="text-[12.5px] tabular-nums">
                  <span className={`font-display text-[18px] leading-none mr-1 ${color}`}>
                    {s.value}
                  </span>
                  <span className="text-ink-400">{s.label}</span>
                </span>
              )
            })}
          </div>
        </Card>
      </a>
    </Link>
  )
}

function CloverDeepLink() {
  const goals = useProjectGoals('clover-digital')
  const tasks = useProjectTasks('clover-digital')
  const kpis = usePipelineKpis()
  const openGoals = (goals.data ?? []).filter(
    (g) => g.status !== 'done' && g.status !== 'dropped',
  ).length
  const blocked = tasks.data?.blocked.length ?? 0
  const prospects = kpis.data?.active_prospects ?? 0
  return (
    <DeepLinkTile
      href="/projects/clover-digital"
      title="Clover Digital"
      stats={[
        { value: openGoals, label: `open goal${openGoals === 1 ? '' : 's'}` },
        { value: prospects, label: 'prospects' },
        {
          value: blocked,
          label: `blocked`,
          tone: blocked > 0 ? 'ochre' : 'ink',
        },
      ]}
    />
  )
}

function ProjectsDeepLink() {
  const counts = PROJECT_ROSTER.reduce(
    (acc, p) => {
      acc.total += 1
      if (p.status === 'active') acc.active += 1
      if (p.status === 'paused') acc.paused += 1
      if (p.status === 'pre-launch') acc.preLaunch += 1
      return acc
    },
    { total: 0, active: 0, paused: 0, preLaunch: 0 },
  )
  return (
    <DeepLinkTile
      href="/projects"
      title="All projects"
      stats={[
        { value: counts.total, label: 'ventures' },
        { value: counts.active, label: 'active', tone: 'clover' },
        { value: counts.preLaunch, label: 'pre-launch' },
      ]}
    />
  )
}

function AgentsDeepLink() {
  const total = listFleetAgents({ includeMason: false }).length
  const heartbeats = useHeartbeats()
  // Latest-per-agent already aggregated by adaptHeartbeats; single query
  // shared with the existing HeartbeatsCard cache.
  const beats = heartbeats.data ?? []
  const working = beats.filter((b) => b.status === 'busy').length
  const stale = beats.filter((b) => b.status === 'stale').length
  return (
    <DeepLinkTile
      href="/agents"
      title="Fleet agents"
      stats={[
        { value: total, label: 'agents' },
        { value: working, label: 'working', tone: 'clover' },
        { value: stale, label: 'stale', tone: stale > 0 ? 'ochre' : 'ink' },
      ]}
    />
  )
}

function TeamDepartmentsDeepLink() {
  const goals = useProjectGoals('clover-digital')
  const openGoals = (goals.data ?? []).filter(
    (g) => g.status !== 'done' && g.status !== 'dropped',
  ).length
  return (
    <DeepLinkTile
      href="/departments"
      title="Departments"
      stats={[
        { value: DEPARTMENTS.length, label: 'lanes' },
        { value: openGoals, label: 'open goals', tone: 'clover' },
      ]}
    />
  )
}

function TeamAgentsDeepLink() {
  const tasks = useProjectTasks('clover-digital')
  const buckets = tasks.data ?? {
    running: [],
    queued: [],
    blocked: [],
    recently_completed: [],
  }
  const open =
    buckets.running.length +
    buckets.queued.length +
    buckets.blocked.length
  return (
    <DeepLinkTile
      href="/agents"
      title="Clover agents"
      stats={[
        { value: CLOVER_AGENT_REGISTRY.length, label: 'registered' },
        { value: open, label: 'open work', tone: 'clover' },
        {
          value: buckets.blocked.length,
          label: 'blocked',
          tone: buckets.blocked.length > 0 ? 'ochre' : 'ink',
        },
      ]}
    />
  )
}
