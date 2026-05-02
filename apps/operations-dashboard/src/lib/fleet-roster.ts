/**
 * Canonical fleet agent roster — static metadata that the dashboard uses
 * to render agent profile pages. Liveness, current task, etc. are joined
 * in via hooks; this file is the "who they are" layer.
 *
 * Source of truth: ~/.claude/CLAUDE.md "Agent Roles" section + the
 * prairie-fleet-ops skill. If roles drift here, fix CLAUDE.md too.
 */
import type { Agent } from './types'

export type RuntimeMode = 'remote-ssh' | 'local' | 'cron'

export interface FleetAgent {
  /** Enum value used in agent_tasks.agent / agent_messages / etc. */
  id: Agent
  /** Display name for the dashboard. */
  name: string
  /** One-line role summary. */
  role: string
  /** Short tagline shown on the index card. */
  tagline: string
  /** Machine the agent runs on. */
  machine: string
  /** Linux user on that machine. */
  user: string
  /** Runtime model — "openai-codex" / "claude-opus-4-7" / "gpt-5.5" / "gemma-4" / "qwen-3.6" / "agent-cli". */
  runtime: string
  /** How it's invoked. */
  runtime_mode: RuntimeMode
  /** What this agent owns. Bulleted in the page header. */
  specialties: string[]
  /** What this agent should NOT touch. */
  out_of_scope: string[]
  /** Skills array — used for the capabilities matrix. */
  skills: string[]
  /** Visual hint — Tailwind class for the agent's accent color. */
  accent: string
}

export const FLEET_ROSTER: FleetAgent[] = [
  {
    id: 'mason',
    name: 'Mason',
    role: 'CEO / orchestrator',
    tagline: 'Sales, fundraise, top-of-funnel revenue. Files most of the work.',
    machine: 'commanddeck',
    user: 'mason',
    runtime: 'human',
    runtime_mode: 'local',
    specialties: ['sales', 'pricing', 'public-facing comms', 'fleet direction'],
    out_of_scope: [],
    skills: ['strategy', 'sales', 'product', 'comms', 'fundraise'],
    accent: 'bg-clover-800',
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    role: 'Orchestrator / PM / reviewer',
    tagline: 'Command Deck planner. Builds dashboards, MCPs, schemas, reviews PRs.',
    machine: 'commanddeck',
    user: 'mason',
    runtime: 'claude-opus-4-7 (1M context)',
    runtime_mode: 'local',
    specialties: ['architecture', 'schema design', 'dashboard build', 'MCP development', 'PR review'],
    out_of_scope: ['unattended overnight tasks (use fleet agents)', 'direct customer comms'],
    skills: ['code', 'architecture', 'sql', 'review', 'docs', 'mcp', 'react', 'typescript'],
    accent: 'bg-clover-500',
  },
  {
    id: 'codex',
    name: 'Codex',
    role: 'Builder / ground-game implementer',
    tagline: 'GPT-5.5 on Command Deck. Pairs with Claude Code on local repo work.',
    machine: 'commanddeck',
    user: 'mason',
    runtime: 'openai-codex (gpt-5.5)',
    runtime_mode: 'local',
    specialties: ['code execution', 'in-repo refactors', 'MCP edits', 'paired implementation with claude-code'],
    out_of_scope: ['cross-machine dispatch', 'task triage'],
    skills: ['code', 'refactor', 'tests', 'mcp'],
    accent: 'bg-cream-300',
  },
  {
    id: 'bighoss',
    name: 'BigHoss',
    role: 'Builder / CI / code + deploy',
    tagline: 'Gate 404, Clover website, contracts, Railway, Foundry. The hammer.',
    machine: 'bighoss',
    user: 'masoncagnoni',
    runtime: 'agent-cli (z.ai GLM 5.1 primary, OpenAI fallback)',
    runtime_mode: 'remote-ssh',
    specialties: ['code/build/deploy', 'contracts', 'CSS/React', 'CI fixes', 'website'],
    out_of_scope: ['client comms', 'sales prospecting'],
    skills: ['code', 'deploy', 'ci', 'contracts', 'web', 'foundry', 'railway'],
    accent: 'bg-ochre-300',
  },
  {
    id: 'hermes',
    name: 'Hermes',
    role: 'COO / comms hub / triage',
    tagline: 'Telegram, iMessage, local-model host. Routes work to the right agent.',
    machine: 'hermes',
    user: 'masoncags',
    runtime: 'agent-cli (gemma-4 local; qwen-3.6 pending)',
    runtime_mode: 'remote-ssh',
    specialties: ['comms triage', 'task routing', 'message ack/reply', 'local-model inference'],
    out_of_scope: ['code/build', 'contracts'],
    skills: ['comms', 'imessage', 'telegram', 'routing', 'local-llm', 'triage'],
    accent: 'bg-clover-700',
  },
  {
    id: 'derek',
    name: 'Derek',
    role: 'Sales / prospecting / client ops',
    tagline: 'Conductor host. Two modes — INTERNAL (direct), CLIENT (warm).',
    machine: 'conductor',
    user: 'gemma',
    runtime: 'agent-cli (gpt-5.5 via Codex backend)',
    runtime_mode: 'remote-ssh',
    specialties: ['outbound prospecting', 'qualification', 'pipeline research', 'persona work'],
    out_of_scope: ['code/build', 'comms triage'],
    skills: ['outreach', 'prospecting', 'qualification', 'persona', 'research'],
    accent: 'bg-ink-700',
  },
  {
    id: 'archivist',
    name: 'Archivist',
    role: 'Memory consolidator',
    tagline: 'Conductor cron. Scans sessions nightly and proposes board hygiene.',
    machine: 'conductor',
    user: 'gemma',
    runtime: 'agent-cli (gpt-5.5 via Codex backend)',
    runtime_mode: 'cron',
    specialties: ['session ingestion', 'memory_proposals', 'project-status promotion', 'dedupe detection'],
    out_of_scope: ['direct task creation', 'customer-table writes'],
    skills: ['memory', 'consolidation', 'dedupe', 'analysis'],
    accent: 'bg-ochre-500',
  },
]

export const ROSTER_BY_ID: Record<string, FleetAgent> = Object.fromEntries(
  FLEET_ROSTER.map((a) => [a.id, a]),
)

export function getAgent(id: string): FleetAgent | null {
  return ROSTER_BY_ID[id] ?? null
}

/** Agents that show on the /agents index. Excludes Mason (human, not in the
 *  agent-as-runtime sense) — but he can still be filtered in via includeMason. */
export function listFleetAgents({ includeMason = false } = {}): FleetAgent[] {
  return FLEET_ROSTER.filter((a) => includeMason || a.id !== 'mason')
}
