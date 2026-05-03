export const CLOVER_PROJECT_KEYS = ['clover-digital', 'prairie-digital'] as const
export const CLOVER_PROJECT_FILTER = '(clover-digital,prairie-digital)'

export function withoutCloverVentures(
  ventures: string[] | null | undefined,
): string[] | null {
  if (!ventures) return null
  return ventures.filter(
    (venture) => venture !== 'clover-digital' && venture !== 'prairie-digital',
  )
}

export function withoutCloverProjects(
  projects: string[] | null | undefined,
): string[] | null {
  if (!projects) return null
  return projects.filter(
    (project) => project !== 'clover-digital' && project !== 'prairie-digital',
  )
}

export function isCloverProject(project: string | null | undefined): boolean {
  return project === 'clover-digital' || project === 'prairie-digital'
}
