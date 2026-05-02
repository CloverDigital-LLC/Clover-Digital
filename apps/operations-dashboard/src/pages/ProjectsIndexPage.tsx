/**
 * /projects — index of all ventures with quick health/work counts.
 * Click any tile to drill into the per-project page.
 */
import { Link } from 'wouter'
import { Card } from '../components/atoms'
import { PROJECT_ROSTER, type Project } from '../lib/project-roster'
import { useProjectTasks, useProjectGoals } from '../hooks/useProject'

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

export function ProjectsIndexPage() {
  return (
    <main className="max-w-[1240px] mx-auto px-6 pt-8 pb-16">
      <nav className="text-[12px] text-ink-400 mb-3 flex items-center gap-1.5">
        <Link href="/" className="hover:text-clover-700 transition">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">Projects</span>
      </nav>
      <h1 className="font-display text-[34px] tracking-tight text-ink-900 leading-tight">
        Projects
      </h1>
      <p className="text-[13.5px] text-ink-500 mt-1 mb-8">
        Each venture lives here. Click any to see goals, work, knowledge, and team scoped to it.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PROJECT_ROSTER.map((p) => (
          <ProjectTile key={p.id} project={p} />
        ))}
      </div>
    </main>
  )
}

function ProjectTile({ project }: { project: Project }) {
  const tasks = useProjectTasks(project.id)
  const goals = useProjectGoals(project.id)
  const status = STATUS_TONE[project.status]

  const buckets = tasks.data ?? {
    running: [],
    queued: [],
    blocked: [],
    recently_completed: [],
  }
  const openGoals = (goals.data ?? []).filter((g) => g.status !== 'done' && g.status !== 'dropped')

  return (
    <Link href={`/projects/${project.id}`}>
      <a className="block">
        <Card className="hover:border-clover-300 transition cursor-pointer">
          <div className={`h-1 ${project.accent} -mx-5 -mt-4 mb-3`} />
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 className="font-display text-[20px] text-ink-900 leading-none">
              {project.name}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-full ${status.bg} ${status.fg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <div className="text-[12.5px] text-ink-700 mt-1 line-clamp-2">
            {project.tagline}
          </div>

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
            <span className="text-ink-500">{TYPE_LABEL[project.type]}</span>
            <span>
              <span className="text-ink-700 font-medium">{openGoals.length}</span> open{' '}
              {openGoals.length === 1 ? 'goal' : 'goals'}
            </span>
          </div>
        </Card>
      </a>
    </Link>
  )
}
