/**
 * Canonical project / venture roster — used by /projects index + per-
 * project pages. Matches the venture enum in the DB; new ventures
 * register here so the dashboard can render them.
 *
 * "Project" and "venture" are used interchangeably here — the DB
 * column name varies (knowledge.project vs agent_tasks.venture) but
 * the values are the same enum.
 */
import type { Venture } from './types'

export type ProjectType = 'company' | 'internal' | 'exploratory'
export type ProjectStatus = 'active' | 'paused' | 'pre-launch' | 'archived'

export interface Project {
  /** URL slug + DB venture value. */
  id: Exclude<Venture, 'prairie-digital'>
  name: string
  type: ProjectType
  status: ProjectStatus
  tagline: string
  /** One-line description for the index card. */
  description: string
  /** Tailwind accent class for the header stripe + tile accent. */
  accent: string
  /** Public-facing site, when applicable. */
  website?: string
}

export const PROJECT_ROSTER: Project[] = [
  {
    id: 'clover-digital',
    name: 'Clover Digital',
    type: 'company',
    status: 'active',
    tagline: 'Digital employees for Midwest SMBs.',
    description:
      'Outbound + onboarding agents (Derek/Hermes/Jasper stack) shipping to Springfield-area SMBs. Primary revenue lane.',
    accent: 'bg-clover-700',
    website: 'https://cloverdigital.com',
  },
  {
    id: 'gate-404',
    name: 'AI Poker Stars',
    type: 'company',
    status: 'active',
    tagline: 'Onchain poker against AI agents.',
    description:
      'Abstract-mainnet poker site (gate-404 / aipokerstars.xyz) — agents play, humans bet, smart contracts settle.',
    accent: 'bg-ochre-300',
    website: 'https://aipokerstars.xyz',
  },
  {
    id: 'yatsu-gaming',
    name: 'Yatsu Gaming',
    type: 'company',
    status: 'pre-launch',
    tagline: 'New venture — coming online.',
    description:
      'Mason just added this to the board. Schema enum updated; data and structure to come.',
    accent: 'bg-clover-300',
  },
  {
    id: 'abstract',
    name: 'Abstract',
    type: 'exploratory',
    status: 'paused',
    tagline: 'Visa Labs / x402 pitch — paused.',
    description:
      'Pitch work for the Visa Labs intro paused 2026-04-30 per Mason. Knowledge entries kept; no active execution.',
    accent: 'bg-cream-300',
  },
  {
    id: 'fleet',
    name: 'Fleet',
    type: 'internal',
    status: 'active',
    tagline: 'The agents themselves.',
    description:
      'Internal infra — agent runtimes, dashboards, MCPs, schema. Not a customer venture; the operating system that powers the rest.',
    accent: 'bg-clover-500',
  },
]

export const PROJECT_BY_ID: Record<string, Project> = Object.fromEntries(
  PROJECT_ROSTER.map((p) => [p.id, p]),
)

export function getProject(id: string): Project | null {
  return PROJECT_BY_ID[id] ?? null
}
