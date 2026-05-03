import { Link } from 'wouter'
import { Card } from '../components/atoms'
import { DEPARTMENTS } from '../lib/departments'
import { agentsForDepartment, countDepartmentTasks } from '../lib/cloverAgents'
import { filterTasksByDepartment } from '../lib/adapters'
import { useProjectGoals, useProjectTasks, type ProjectTaskBuckets } from '../hooks/useProject'
import type { AgentTaskRow, Department, GoalRow } from '../lib/types'

export function DepartmentsIndexPage() {
  const tasks = useProjectTasks('clover-digital')
  const goals = useProjectGoals('clover-digital')
  const allTasks = flattenBuckets(tasks.data)
  const allGoals = goals.data ?? []

  return (
    <main className="max-w-[1240px] mx-auto px-6 pt-8 pb-16">
      <nav className="text-[12px] text-ink-400 mb-3 flex items-center gap-1.5">
        <Link href="/" className="hover:text-clover-700 transition">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">Departments</span>
      </nav>
      <h1 className="font-display text-[34px] tracking-tight text-ink-900 leading-tight">
        Departments
      </h1>
      <p className="text-[13.5px] text-ink-500 mt-1 mb-8">
        Clover Digital work split by lane: goals, open work, blocked items, and the agents helping each team.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DEPARTMENTS.map((department) => (
          <DepartmentTile
            key={department.id}
            department={department.id}
            tasks={allTasks}
            goals={allGoals}
          />
        ))}
      </div>
    </main>
  )
}

function DepartmentTile({
  department,
  tasks,
  goals,
}: {
  department: Department
  tasks: AgentTaskRow[]
  goals: GoalRow[]
}) {
  const definition = DEPARTMENTS.find((d) => d.id === department)!
  const departmentTasks = filterTasksByDepartment(tasks, department)
  const openGoals = goals.filter(
    (goal) => goal.department === department && goal.status !== 'done' && goal.status !== 'dropped',
  )
  const blocked = departmentTasks.filter((task) => task.status === 'blocked')
  const running = departmentTasks.filter((task) =>
    ['running', 'researching', 'planned', 'plan_review', 'code_review', 'testing', 'deploying'].includes(task.status),
  )
  const agents = agentsForDepartment(department)

  return (
    <Link href={`/departments/${department}`}>
      <a className="block">
        <Card className="hover:border-clover-300 transition cursor-pointer">
          <div className={`h-1 ${definition.accent} -mx-5 -mt-4 mb-3`} />
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="font-display text-[22px] text-ink-900 leading-none">
              {definition.label}
            </h2>
            <span className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
              {definition.owner}
            </span>
          </div>
          <p className="text-[12.5px] text-ink-600 mt-2 leading-relaxed">
            {definition.remit}
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2 text-[12px] tabular-nums">
            <Metric label="Goals" value={openGoals.length} />
            <Metric label="Open" value={countDepartmentTasks(tasks.filter((task) => task.status !== 'completed'), department)} />
            <Metric label="Running" value={running.length} />
            <Metric label="Blocked" value={blocked.length} warn={blocked.length > 0} />
          </div>
          <div className="mt-4 flex items-center gap-1.5 flex-wrap">
            {agents.slice(0, 4).map((agent) => (
              <span
                key={agent.id}
                className="inline-flex items-center rounded-full bg-cream-200 px-2 py-0.5 text-[11px] text-ink-700"
              >
                {agent.name}
              </span>
            ))}
          </div>
        </Card>
      </a>
    </Link>
  )
}

function Metric({
  label,
  value,
  warn = false,
}: {
  label: string
  value: number
  warn?: boolean
}) {
  return (
    <div className="rounded-lg border border-cream-300/70 bg-cream-100/40 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-[0.08em] text-ink-400">{label}</div>
      <div className={`font-display text-[22px] leading-none mt-1 ${warn ? 'text-ochre-500' : 'text-ink-900'}`}>
        {value}
      </div>
    </div>
  )
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
