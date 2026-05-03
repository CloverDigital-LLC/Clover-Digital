/**
 * /projects/:slug — per-venture deep dive.
 *
 * Foundation modules (every project):
 *   - ProjectHeader (name, type, status, accent stripe, work + goal counts)
 *   - GoalsPanel    — goals scoped to venture, grouped by department
 *   - WorkPanel     — running/blocked/queued/recently-completed
 *   - KnowledgePanel — recent knowledge entries
 *   - AgentsPanel   — who's touched this venture in 30d
 *
 * Per-venture specialty panels added in Pass B (Clover gets pipeline+brand,
 * Fleet gets agent rollup, etc.).
 */
import { Link, useRoute } from 'wouter'
import { DepartmentNav } from '../components/DepartmentNav'
import { Card, AgentPill, EmptyState, StatusPill } from '../components/atoms'
import { useDetail } from '../components/Detail/DetailContext'
import { displayTaskStatus, filterTasksByDepartment, fmtDate, relTime } from '../lib/adapters'
import { DEPARTMENTS } from '../lib/departments'
import { getProject, type Project } from '../lib/project-roster'
import {
  useProjectTasks,
  useProjectGoals,
  useProjectKnowledge,
  useProjectAgents,
  type ProjectTaskBuckets,
} from '../hooks/useProject'
import { ProjectSpecialty } from './projectSpecialty'
import type { AgentTaskRow, GoalRow, KnowledgeRow } from '../lib/types'

const STATUS_TONE: Record<Project['status'], { label: string; bg: string; fg: string; dot: string }> = {
  active: { label: 'Active', bg: 'bg-clover-50', fg: 'text-clover-800', dot: 'bg-clover-500 pulse-dot' },
  'pre-launch': { label: 'Pre-launch', bg: 'bg-cream-200', fg: 'text-ink-700', dot: 'bg-clover-300' },
  paused: { label: 'Paused', bg: 'bg-ochre-100', fg: 'text-ochre-500', dot: 'bg-ochre-500' },
  archived: { label: 'Archived', bg: 'bg-cream-100', fg: 'text-ink-400', dot: 'bg-ink-400' },
}

const TYPE_LABEL: Record<Project['type'], string> = {
  company: 'Company',
  internal: 'Internal',
  exploratory: 'Exploratory',
}

export function ProjectDetailPage() {
  const [, params] = useRoute('/projects/:slug')
  const slug = params?.slug ?? ''
  const project = getProject(slug)

  if (!project) {
    return (
      <main className="max-w-[1240px] mx-auto px-6 pt-12">
        <div className="text-[13px] text-ink-500">
          Unknown project: <code>{slug}</code>.{' '}
          <Link href="/projects" className="text-clover-700 hover:underline">
            ← back to projects
          </Link>
        </div>
      </main>
    )
  }

  return <ProjectDetail project={project} />
}

function ProjectDetail({ project }: { project: Project }) {
  const tasks = useProjectTasks(project.id)
  const goals = useProjectGoals(project.id)
  const knowledge = useProjectKnowledge(project.id, 12)
  const agentTouches = useProjectAgents(project.id)

  const buckets = tasks.data ?? {
    running: [],
    queued: [],
    blocked: [],
    recently_completed: [],
  }
  const openGoals = (goals.data ?? []).filter((g) => g.status !== 'done' && g.status !== 'dropped')
  const closedGoals = (goals.data ?? []).filter((g) => g.status === 'done' || g.status === 'dropped')

  return (
    <main className="max-w-[1240px] mx-auto px-6 pt-8 pb-16">
      <Breadcrumbs name={project.name} />
      <ProjectHeader project={project} buckets={buckets} openGoals={openGoals.length} />

      {/* Per-venture specialty panel between header and operational columns */}
      <ProjectSpecialty slug={project.id} />

      {project.id === 'clover-digital' && (
        <div className="mt-5 rounded-xl border border-cream-300/80 bg-cream-50 px-5 py-4 shadow-card">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
                Clover lanes
              </div>
              <div className="text-[13px] text-ink-600 mt-1">
                Jump into department-scoped goals and work.
              </div>
            </div>
            <DepartmentNav />
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-5 mt-6">
        {/* Left column — operational */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          <GoalsPanel project={project} open={openGoals} closed={closedGoals} />
          <WorkPanel buckets={buckets} loading={tasks.isLoading} />
          <KnowledgePanel project={project} entries={knowledge.data ?? []} />
        </div>

        {/* Right column — context */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {project.id === 'clover-digital' && (
            <CloverDepartmentPanel goals={openGoals} buckets={buckets} />
          )}
          <AboutCard project={project} />
          <AgentsPanel touches={agentTouches.data ?? []} />
        </div>
      </div>
    </main>
  )
}

function CloverDepartmentPanel({
  goals,
  buckets,
}: {
  goals: GoalRow[]
  buckets: ProjectTaskBuckets
}) {
  const allTasks = [
    ...buckets.running,
    ...buckets.queued,
    ...buckets.blocked,
    ...buckets.recently_completed,
  ]
  return (
    <Card title="Departments">
      <ul className="space-y-1.5">
        {DEPARTMENTS.map((department) => {
          const taskCount = filterTasksByDepartment(allTasks, department.id).length
          const goalCount = goals.filter((goal) => goal.department === department.id).length
          return (
            <li key={department.id}>
              <Link href={`/departments/${department.slug}`}>
                <a className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-md hover:bg-cream-100/70 transition">
                  <span className={`h-2 w-2 rounded-full ${department.accent}`} />
                  <span className="text-[13px] text-ink-900">{department.label}</span>
                  <span className="ml-auto text-[11px] text-ink-400 tabular-nums">
                    {goalCount} goals · {taskCount} work
                  </span>
                </a>
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
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
      <Link href="/projects" className="hover:text-clover-700 transition">
        Projects
      </Link>
      <span>/</span>
      <span className="text-ink-700 font-medium">{name}</span>
    </nav>
  )
}

// ─── Header ──────────────────────────────────────────────────────────

function ProjectHeader({
  project,
  buckets,
  openGoals,
}: {
  project: Project
  buckets: ProjectTaskBuckets
  openGoals: number
}) {
  const status = STATUS_TONE[project.status]
  return (
    <div className="rounded-xl bg-cream-50 border border-cream-300/80 shadow-card overflow-hidden">
      <div className={`h-1.5 ${project.accent}`} />
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-[32px] tracking-tight text-ink-900 leading-none">
                {project.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-full ${status.bg} ${status.fg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className="text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-cream-200 text-ink-700">
                {TYPE_LABEL[project.type]}
              </span>
            </div>
            <div className="text-[14px] text-ink-700 mt-1">{project.tagline}</div>
            {project.website && (
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] text-clover-700 hover:underline mt-1.5 font-mono"
              >
                {project.website.replace(/^https?:\/\//, '')} ↗
              </a>
            )}
          </div>
          <div className="flex items-baseline gap-5 flex-wrap">
            <Stat label="Goals" value={openGoals} />
            <Stat label="Running" value={buckets.running.length} />
            <Stat
              label="Blocked"
              value={buckets.blocked.length}
              tone={buckets.blocked.length > 0 ? 'ochre' : 'ink'}
            />
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

// ─── Goals ───────────────────────────────────────────────────────────

function GoalsPanel({
  project,
  open,
  closed,
}: {
  project: Project
  open: GoalRow[]
  closed: GoalRow[]
}) {
  const { open: openDrawer } = useDetail()
  return (
    <Card
      title="Goals"
      action={
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
          {open.length} open · {closed.length} closed
        </span>
      }
    >
      {open.length === 0 ? (
        <EmptyState
          icon="·"
          line={
            project.status === 'pre-launch'
              ? 'No goals yet — file the first one when you have a target.'
              : 'No open goals.'
          }
          sub={
            project.status === 'pre-launch'
              ? 'Use the goals table on prairie-fleet to add them.'
              : ''
          }
        />
      ) : (
        <ul className="space-y-2">
          {open.map((g) => (
            <li
              key={g.id}
              role="button"
              tabIndex={0}
              onClick={() => openDrawer({ kind: 'goal', id: g.id })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDrawer({ kind: 'goal', id: g.id })
                }
              }}
              className="rounded-md border border-cream-300/70 bg-cream-100/40 px-3 py-2.5 cursor-pointer hover:border-clover-200 transition"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <span className="font-display text-[15px] text-ink-900 leading-snug min-w-0 flex-1">
                  {g.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill status={g.status} />
                  {g.priority && (
                    <span className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
                      {g.priority}
                    </span>
                  )}
                </div>
              </div>
              {g.target_date && (
                <div className="text-[11px] text-ink-400 mt-1 tabular-nums">
                  target {fmtDate(g.target_date)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// ─── Work ────────────────────────────────────────────────────────────

function WorkPanel({
  buckets,
  loading,
}: {
  buckets: ProjectTaskBuckets
  loading: boolean
}) {
  const total =
    buckets.running.length +
    buckets.queued.length +
    buckets.blocked.length +
    buckets.recently_completed.length
  const sections: Array<{ key: keyof ProjectTaskBuckets; title: string; list: AgentTaskRow[] }> = [
    { key: 'running', title: 'Running', list: buckets.running },
    { key: 'blocked', title: 'Blocked', list: buckets.blocked },
    { key: 'queued', title: 'Queued', list: buckets.queued },
    { key: 'recently_completed', title: 'Completed (7d)', list: buckets.recently_completed },
  ]
  return (
    <Card
      title="Work"
      footer={
        <>
          <span>{total} items</span>
          <span>{loading ? 'Loading…' : 'Live'}</span>
        </>
      }
    >
      {total === 0 && !loading ? (
        <EmptyState icon="○" line="No work in scope yet." sub="" />
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
          <AgentPill agent={t.agent ?? t.assigned_to ?? null} />
          <StatusPill status={displayTaskStatus(t)} />
          <span className="text-[11px] text-ink-400 ml-auto whitespace-nowrap">
            {relTime(t.created_at)}
          </span>
        </div>
      </div>
    </li>
  )
}

// ─── Knowledge ───────────────────────────────────────────────────────

function KnowledgePanel({
  project,
  entries,
}: {
  project: Project
  entries: KnowledgeRow[]
}) {
  const { open } = useDetail()
  return (
    <Card
      title="Recent knowledge"
      action={
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
          project={project.id}
        </span>
      }
    >
      {entries.length === 0 ? (
        <EmptyState icon="·" line="No knowledge entries yet." sub="" />
      ) : (
        <ul className="space-y-1.5">
          {entries.map((k) => (
            <li
              key={k.id}
              role="button"
              tabIndex={0}
              onClick={() => open({ kind: 'knowledge', id: k.id })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  open({ kind: 'knowledge', id: k.id })
                }
              }}
              className="flex items-start gap-2.5 -mx-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-cream-100/70 transition"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-clover-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-ink-900 leading-snug truncate">{k.title}</div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-ink-400">
                  <span className="uppercase tracking-[0.08em]">{k.category}</span>
                  {k.source_agent && <AgentPill agent={k.source_agent} />}
                  <span className="ml-auto tabular-nums">{relTime(k.created_at)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// ─── About ───────────────────────────────────────────────────────────

function AboutCard({ project }: { project: Project }) {
  return (
    <Card title="About">
      <p className="text-[13px] text-ink-700 leading-relaxed">{project.description}</p>
      <dl className="mt-3 space-y-1.5 text-[12.5px]">
        <div className="flex items-baseline gap-2">
          <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-400 w-16 shrink-0">Type</dt>
          <dd className="text-ink-900">{TYPE_LABEL[project.type]}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-400 w-16 shrink-0">Slug</dt>
          <dd className="font-mono text-[12px] text-ink-700">{project.id}</dd>
        </div>
        {project.website && (
          <div className="flex items-baseline gap-2">
            <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-400 w-16 shrink-0">Site</dt>
            <dd>
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[12px] text-clover-700 hover:underline"
              >
                {project.website.replace(/^https?:\/\//, '')} ↗
              </a>
            </dd>
          </div>
        )}
      </dl>
    </Card>
  )
}

// ─── Agents ──────────────────────────────────────────────────────────

function AgentsPanel({
  touches,
}: {
  touches: Array<{ agent: string; touch_count: number }>
}) {
  return (
    <Card
      title="Agents involved"
      action={
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">last 30d</span>
      }
    >
      {touches.length === 0 ? (
        <div className="text-[12px] text-ink-400 italic">No agent activity yet.</div>
      ) : (
        <ul className="space-y-1.5">
          {touches.map((t) => (
            <li key={t.agent}>
              <Link href={`/agents/${t.agent}`}>
                <a className="flex items-center gap-2 -mx-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-cream-100/70 transition">
                  <AgentPill agent={t.agent} />
                  <span className="text-[11px] text-ink-400 ml-auto tabular-nums">
                    {t.touch_count} touches
                  </span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
