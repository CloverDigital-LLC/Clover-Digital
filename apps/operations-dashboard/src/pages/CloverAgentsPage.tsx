import { Link } from 'wouter'
import { AgentPill, Card, StatusPill } from '../components/atoms'
import { DepartmentNav } from '../components/DepartmentNav'
import { useCloverAgentTemplates } from '../hooks/useCloverAgents'
import { useProjectTasks, type ProjectTaskBuckets } from '../hooks/useProject'
import {
  CLOVER_AGENT_REGISTRY,
  tasksForCloverAgent,
  type CloverAgentDefinition,
  type CloverAgentTemplateRow,
} from '../lib/cloverAgents'
import { departmentLabel } from '../lib/departments'
import type { AgentTaskRow } from '../lib/types'

export function CloverAgentsPage() {
  const tasks = useProjectTasks('clover-digital')
  const templates = useCloverAgentTemplates()
  const allTasks = flattenBuckets(tasks.data)

  return (
    <main className="max-w-[1240px] mx-auto px-6 pt-8 pb-16">
      <nav className="text-[12px] text-ink-400 mb-3 flex items-center gap-1.5">
        <Link href="/" className="hover:text-clover-700 transition">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">Agents</span>
      </nav>
      <div className="flex items-start justify-between gap-5 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-[34px] tracking-tight text-ink-900 leading-tight">
            Clover agents
          </h1>
          <p className="text-[13.5px] text-ink-500 mt-1 max-w-2xl">
            Team-safe registry for Clover Digital agents, their lane, current work, and registered templates.
          </p>
        </div>
        <Link href="/departments">
          <a className="text-[12px] text-clover-700 hover:underline mt-2">View departments</a>
        </Link>
      </div>

      <div className="mb-5">
        <DepartmentNav />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {CLOVER_AGENT_REGISTRY.map((agent) => (
          <CloverAgentCard key={agent.id} agent={agent} tasks={allTasks} />
        ))}
      </div>

      <div className="mt-8">
        <TemplateRegistryCard templates={templates.data ?? []} loading={templates.isLoading} />
      </div>
    </main>
  )
}

function CloverAgentCard({
  agent,
  tasks,
}: {
  agent: CloverAgentDefinition
  tasks: AgentTaskRow[]
}) {
  const agentTasks = tasksForCloverAgent(tasks, agent)
  const openTasks = agentTasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled' && task.status !== 'failed')
  const blocked = openTasks.filter((task) => task.status === 'blocked')
  const running = openTasks.filter((task) =>
    ['running', 'researching', 'planned', 'plan_review', 'code_review', 'testing', 'deploying'].includes(task.status),
  )
  return (
    <Card className="min-h-[260px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-[21px] text-ink-900 leading-none">{agent.name}</h2>
            {agent.agentId && <AgentPill agent={agent.agentId} />}
          </div>
          <div className="text-[12.5px] text-ink-700 mt-1">{agent.role}</div>
        </div>
        <StatusPill status={agent.status === 'active' ? 'idle' : agent.status === 'building' ? 'planned' : 'queued'} />
      </div>
      <p className="text-[12.5px] text-ink-500 leading-relaxed mt-3">{agent.summary}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[12px] tabular-nums">
        <MiniMetric label="Open" value={openTasks.length} />
        <MiniMetric label="Running" value={running.length} />
        <MiniMetric label="Blocked" value={blocked.length} warn={blocked.length > 0} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-ink-400">
        <Link href={`/departments/${agent.department}`}>
          <a className="text-clover-700 hover:underline">{departmentLabel(agent.department)}</a>
        </Link>
        <span>{agent.owner}</span>
      </div>
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        {agent.skills.map((skill) => (
          <span key={skill} className="rounded-full bg-cream-200 px-2 py-0.5 text-[11px] text-ink-700">
            {skill}
          </span>
        ))}
      </div>
    </Card>
  )
}

function TemplateRegistryCard({
  templates,
  loading,
}: {
  templates: CloverAgentTemplateRow[]
  loading: boolean
}) {
  return (
    <Card
      title="Registered templates"
      action={
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
          {templates.length} rows
        </span>
      }
    >
      {templates.length === 0 ? (
        <div className="text-[12.5px] text-ink-500 italic">
          {loading ? 'Loading registered templates...' : 'No database templates registered yet. Built-in Clover agents are shown above.'}
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((template) => (
            <li key={template.id} className="rounded-md border border-cream-300/70 bg-cream-100/40 px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-display text-[15px] text-ink-900">{template.name}</div>
                <span className="font-mono text-[11px] text-ink-400">{template.version}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StatusPill status={template.status} />
                {template.created_by_team && (
                  <span className="text-[11px] text-ink-400">{template.created_by_team}</span>
                )}
              </div>
              {template.description && (
                <p className="text-[12px] text-ink-500 leading-relaxed mt-2 line-clamp-2">
                  {template.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function MiniMetric({
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
      <div className={`font-display text-[21px] leading-none mt-1 ${warn ? 'text-ochre-500' : 'text-ink-900'}`}>
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
