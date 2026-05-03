import { Link, useRoute } from 'wouter'
import { AgentPill, Card, EmptyState, StatusPill } from '../components/atoms'
import { DepartmentNav } from '../components/DepartmentNav'
import { useDetail } from '../components/Detail/DetailContext'
import { displayTaskStatus, filterTasksByDepartment, fmtDate, relTime } from '../lib/adapters'
import { agentsForDepartment, tasksForCloverAgent } from '../lib/cloverAgents'
import { getDepartment } from '../lib/departments'
import { useProjectGoals, useProjectTasks, type ProjectTaskBuckets } from '../hooks/useProject'
import type { AgentTaskRow, Department, GoalRow } from '../lib/types'

export function DepartmentDetailPage() {
  const [, params] = useRoute('/departments/:department')
  const definition = getDepartment(params?.department)

  if (!definition) {
    return (
      <main className="max-w-[1240px] mx-auto px-6 pt-12">
        <div className="text-[13px] text-ink-500">
          Unknown department.{' '}
          <Link href="/departments" className="text-clover-700 hover:underline">
            Back to departments
          </Link>
        </div>
      </main>
    )
  }

  return <DepartmentDetail department={definition.id} />
}

function DepartmentDetail({ department }: { department: Department }) {
  const definition = getDepartment(department)!
  const tasks = useProjectTasks('clover-digital')
  const goals = useProjectGoals('clover-digital')
  const scopedBuckets = filterBuckets(tasks.data, department)
  const openGoals = (goals.data ?? []).filter(
    (goal) => goal.department === department && goal.status !== 'done' && goal.status !== 'dropped',
  )
  const closedGoals = (goals.data ?? []).filter(
    (goal) => goal.department === department && (goal.status === 'done' || goal.status === 'dropped'),
  )
  const totalWork =
    scopedBuckets.running.length +
    scopedBuckets.queued.length +
    scopedBuckets.blocked.length +
    scopedBuckets.recently_completed.length

  return (
    <main className="max-w-[1240px] mx-auto px-6 pt-8 pb-16">
      <nav className="text-[12px] text-ink-400 mb-3 flex items-center gap-1.5">
        <Link href="/" className="hover:text-clover-700 transition">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/departments" className="hover:text-clover-700 transition">
          Departments
        </Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">{definition.label}</span>
      </nav>

      <div className="rounded-xl bg-cream-50 border border-cream-300/80 shadow-card overflow-hidden">
        <div className={`h-1.5 ${definition.accent}`} />
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              <h1 className="font-display text-[34px] tracking-tight text-ink-900 leading-none">
                {definition.label}
              </h1>
              <div className="text-[14px] text-ink-700 mt-2 max-w-2xl">{definition.remit}</div>
            </div>
            <div className="flex items-baseline gap-5 flex-wrap">
              <Stat label="Goals" value={openGoals.length} />
              <Stat label="Running" value={scopedBuckets.running.length} />
              <Stat label="Queued" value={scopedBuckets.queued.length} />
              <Stat label="Blocked" value={scopedBuckets.blocked.length} tone={scopedBuckets.blocked.length > 0 ? 'ochre' : 'ink'} />
            </div>
          </div>
          <div className="mt-5">
            <DepartmentNav active={department} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 mt-6">
        <div className="col-span-12 lg:col-span-8 space-y-5">
          <DepartmentGoals goals={openGoals} closedCount={closedGoals.length} />
          <DepartmentWork buckets={scopedBuckets} loading={tasks.isLoading} total={totalWork} />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <DepartmentAgents department={department} tasks={flattenBuckets(tasks.data)} />
          <Card title="Lane owner">
            <div className="text-[13px] text-ink-700">{definition.owner}</div>
            <p className="text-[12px] text-ink-500 mt-2 leading-relaxed">
              Use this page as the single department view for Clover Digital work.
            </p>
          </Card>
        </div>
      </div>
    </main>
  )
}

function DepartmentGoals({ goals, closedCount }: { goals: GoalRow[]; closedCount: number }) {
  const { open } = useDetail()
  return (
    <Card
      title="Goals"
      action={
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
          {goals.length} open · {closedCount} closed
        </span>
      }
    >
      {goals.length === 0 ? (
        <EmptyState icon="·" line="No open goals in this lane." />
      ) : (
        <ul className="space-y-2">
          {goals.map((goal) => (
            <li
              key={goal.id}
              role="button"
              tabIndex={0}
              onClick={() => open({ kind: 'goal', id: goal.id })}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  open({ kind: 'goal', id: goal.id })
                }
              }}
              className="rounded-md border border-cream-300/70 bg-cream-100/40 px-3 py-2.5 cursor-pointer hover:border-clover-200 transition"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <span className="font-display text-[15px] text-ink-900 leading-snug min-w-0 flex-1">
                  {goal.title}
                </span>
                <StatusPill status={goal.status} />
              </div>
              {goal.target_date && (
                <div className="text-[11px] text-ink-400 mt-1 tabular-nums">
                  target {fmtDate(goal.target_date)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function DepartmentWork({
  buckets,
  loading,
  total,
}: {
  buckets: ProjectTaskBuckets
  loading: boolean
  total: number
}) {
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
          <span>{loading ? 'Loading...' : 'Live'}</span>
        </>
      }
    >
      {total === 0 && !loading ? (
        <EmptyState icon="○" line="No work in this lane yet." />
      ) : (
        <div className="space-y-4">
          {sections.map((section) =>
            section.list.length === 0 ? null : (
              <div key={section.key}>
                <div className="text-[11px] uppercase tracking-[0.1em] text-ink-400 mb-1.5 flex items-baseline gap-2">
                  <span>{section.title}</span>
                  <span className="text-ink-700 tabular-nums">{section.list.length}</span>
                </div>
                <ul className="space-y-1.5">
                  {section.list.slice(0, 10).map((task) => (
                    <DepartmentTaskRow key={task.id} task={task} />
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      )}
    </Card>
  )
}

function DepartmentTaskRow({ task }: { task: AgentTaskRow }) {
  const { open } = useDetail()
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => open({ kind: 'task', id: task.id })}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          open({ kind: 'task', id: task.id })
        }
      }}
      className="flex items-start gap-2.5 -mx-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-cream-100/70 transition"
    >
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clover-700" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-ink-900 leading-snug truncate">{task.title}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <AgentPill agent={task.agent ?? task.assigned_to ?? null} />
          <StatusPill status={displayTaskStatus(task)} />
          <span className="text-[11px] text-ink-400 ml-auto whitespace-nowrap">
            {relTime(task.created_at)}
          </span>
        </div>
      </div>
    </li>
  )
}

function DepartmentAgents({
  department,
  tasks,
}: {
  department: Department
  tasks: AgentTaskRow[]
}) {
  const agents = agentsForDepartment(department)
  return (
    <Card title="Agents">
      <ul className="space-y-2">
        {agents.map((agent) => {
          const agentTasks = tasksForCloverAgent(tasks, agent)
          const openTasks = agentTasks.filter((task) => task.status !== 'completed')
          return (
            <li key={agent.id} className="rounded-md border border-cream-300/70 bg-cream-100/40 px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="font-display text-[15px] text-ink-900 leading-none">{agent.name}</div>
                  <div className="text-[11.5px] text-ink-500 mt-1">{agent.role}</div>
                </div>
                <StatusPill status={agent.status === 'active' ? 'idle' : agent.status === 'building' ? 'planned' : 'queued'} />
              </div>
              <div className="text-[11px] text-ink-400 mt-2 tabular-nums">
                {openTasks.length} open · {agent.skills.slice(0, 2).join(', ')}
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function Stat({
  label,
  value,
  tone = 'ink',
}: {
  label: string
  value: number
  tone?: 'ink' | 'ochre'
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">{label}</div>
      <div className={`font-display text-[22px] leading-none mt-1 tabular-nums ${tone === 'ochre' ? 'text-ochre-500' : 'text-ink-900'}`}>
        {value}
      </div>
    </div>
  )
}

function filterBuckets(buckets: ProjectTaskBuckets | undefined, department: Department): ProjectTaskBuckets {
  const fallback = { running: [], queued: [], blocked: [], recently_completed: [] }
  const source = buckets ?? fallback
  return {
    running: filterTasksByDepartment(source.running, department),
    queued: filterTasksByDepartment(source.queued, department),
    blocked: filterTasksByDepartment(source.blocked, department),
    recently_completed: filterTasksByDepartment(source.recently_completed, department),
  }
}

function flattenBuckets(buckets?: ProjectTaskBuckets): AgentTaskRow[] {
  if (!buckets) return []
  return [
    ...buckets.running,
    ...buckets.queued,
    ...buckets.blocked,
    ...buckets.recently_completed,
  ]
}
