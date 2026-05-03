import type { Agent, AgentTaskRow, Department } from './types'
import { filterTasksByDepartment } from './adapters'

export interface CloverAgentDefinition {
  id: string
  name: string
  role: string
  department: Department
  status: 'active' | 'building' | 'planned'
  owner: string
  model?: string
  skills: string[]
  summary: string
  agentId?: Agent
}

export interface CloverAgentTemplateRow {
  id: string
  name: string
  version: string
  status: string
  description: string | null
  supported_services: string[] | null
  required_integrations: string[] | null
  created_by_team: string | null
  created_by_agent: string | null
  created_at: string | null
  updated_at: string | null
}

export const CLOVER_AGENT_REGISTRY: CloverAgentDefinition[] = [
  {
    id: 'derek',
    name: 'Derek',
    role: 'Sales operator',
    department: 'sales',
    status: 'active',
    owner: 'Mason',
    model: 'Hermes runtime',
    skills: ['prospecting', 'pipeline hygiene', 'lead qualification', 'follow-up drafting'],
    summary: 'Owns outbound and sales execution so the team can see what is being worked and what needs human input.',
    agentId: 'derek',
  },
  {
    id: 'archivist',
    name: 'Archivist',
    role: 'Memory and board hygiene',
    department: 'product-eng',
    status: 'building',
    owner: 'Mason',
    model: 'propose-first agent',
    skills: ['session review', 'duplicate detection', 'knowledge capture', 'task proposal'],
    summary: 'Keeps Clover Ops clean by turning useful context into reviewed tasks, goals, and knowledge without making duplicate tickets.',
    agentId: 'archivist',
  },
  {
    id: 'hermes',
    name: 'Hermes',
    role: 'Operations coordinator',
    department: 'ops',
    status: 'building',
    owner: 'Mason',
    model: 'Hermes runtime',
    skills: ['handoffs', 'messages', 'reminders', 'team routing'],
    summary: 'Coordinates follow-ups and cross-agent handoffs once Clover-specific messaging integrations are live.',
    agentId: 'hermes',
  },
  {
    id: 'builder',
    name: 'Builder',
    role: 'Product implementation',
    department: 'product-eng',
    status: 'active',
    owner: 'Jasper',
    model: 'Claude/Codex paired builder',
    skills: ['dashboard work', 'MCP surfaces', 'GitHub changes', 'deployment support'],
    summary: 'Represents the Clover-specific build lane without exposing private fleet machines or internal host details.',
    agentId: 'bighoss',
  },
  {
    id: 'onboarding-agent',
    name: 'Onboarding Agent',
    role: 'Client intake and launch',
    department: 'ops',
    status: 'planned',
    owner: 'Shannon',
    skills: ['client intake', 'iMessage readiness', 'calendar handoff', 'launch checklist'],
    summary: 'The planned client-facing agent that will guide new Clover customers from intake to first working workflow.',
  },
]

export function agentsForDepartment(department: Department): CloverAgentDefinition[] {
  return CLOVER_AGENT_REGISTRY.filter((agent) => agent.department === department)
}

export function tasksForCloverAgent(tasks: AgentTaskRow[], agent: CloverAgentDefinition): AgentTaskRow[] {
  if (!agent.agentId) return []
  return tasks.filter((task) => task.agent === agent.agentId || task.assigned_to === agent.agentId)
}

export function countDepartmentTasks(tasks: AgentTaskRow[], department: Department): number {
  return filterTasksByDepartment(tasks, department).length
}
