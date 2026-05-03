import type { Department } from './types'

export interface DepartmentDefinition {
  id: Department
  slug: Department
  label: string
  shortLabel: string
  owner: string
  remit: string
  accent: string
}

export const DEPARTMENTS: DepartmentDefinition[] = [
  {
    id: 'sales',
    slug: 'sales',
    label: 'Sales',
    shortLabel: 'Sales',
    owner: 'Derek lane',
    remit: 'Pipeline, outbound, client conversations, and revenue motion.',
    accent: 'bg-clover-700',
  },
  {
    id: 'marketing',
    slug: 'marketing',
    label: 'Marketing',
    shortLabel: 'Marketing',
    owner: 'Dan lane',
    remit: 'Brand, content, offers, outbound assets, and demand signals.',
    accent: 'bg-ochre-300',
  },
  {
    id: 'product-eng',
    slug: 'product-eng',
    label: 'Product / Eng',
    shortLabel: 'Product',
    owner: 'Jasper lane',
    remit: 'Dashboard, agent tooling, client product, infrastructure, and delivery systems.',
    accent: 'bg-clover-500',
  },
  {
    id: 'ops',
    slug: 'ops',
    label: 'Operations',
    shortLabel: 'Ops',
    owner: 'Shannon lane',
    remit: 'Client delivery, internal process, handoffs, scheduling, and admin.',
    accent: 'bg-ink-700',
  },
]

const BY_ID = new Map(DEPARTMENTS.map((department) => [department.id, department]))

export function getDepartment(id: string | null | undefined): DepartmentDefinition | null {
  if (!id) return null
  return BY_ID.get(id as Department) ?? null
}

export function departmentLabel(id: Department | 'unassigned' | string | null | undefined): string {
  if (!id) return 'Unassigned'
  if (id === 'unassigned') return 'Unassigned'
  return BY_ID.get(id as Department)?.label ?? id
}
