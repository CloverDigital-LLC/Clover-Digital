import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Department, Venture } from '../lib/types'
import { useAuth } from '../auth/AuthProvider'
import { adminSurfaceEnabled } from '../lib/surface'

/**
 * Dashboard scope: view role + optional venture filter.
 *
 * Two layers of scoping:
 *   1. View role — `team` (cofounder lens, Clover Digital only) or
 *      `admin` (Mason's view, everything including personal ventures).
 *      Admin role is only honored on the explicit admin deployment surface.
 *   2. Selected venture — optional refinement on top of the role's
 *      base scope. Click a project bar in the briefing to drill into
 *      a single venture; click again or hit "Show all" to clear.
 *
 * Effective scope (consumed by hooks via useVentureScope):
 *   team + selected → [selected]   (must overlap with clover-digital
 *                                    in practice; team can't escape it)
 *   team + null     → ['clover-digital']
 *   admin + selected → [selected]
 *   admin + null    → null  (= no venture filter, show every row)
 */
type FilterableVenture = Venture | 'unassigned'
export type FilterableDepartment = Department | 'unassigned'
export type ViewRole = 'team' | 'admin'

interface ContextValue {
  // Venture filter — primary scope. Cofounders are pinned to clover-digital;
  // admin (Mason) can drill into any single venture.
  selected: FilterableVenture | null
  set: (v: FilterableVenture | null) => void
  toggle: (v: FilterableVenture) => void
  clear: () => void
  // Department filter — only meaningful in team view (admin slices by venture).
  // Inferred client-side from agent + tags via inferDepartment().
  selectedDepartment: FilterableDepartment | null
  setSelectedDepartment: (d: FilterableDepartment | null) => void
  toggleDepartment: (d: FilterableDepartment) => void
  clearDepartment: () => void
  /**
   * View role — derived directly from the authenticated DB role. Mason gets
   * 'admin'; everyone on the dashboard_users allowlist gets 'team'. There
   * is no UI toggle: Mason's email IS admin view, every other email IS
   * team view, period.
   */
  viewRole: ViewRole
}

const VentureFilterContext = createContext<ContextValue | null>(null)

const TEAM_DEFAULT: Venture[] = ['clover-digital']

export function VentureFilterProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth()
  // Admin-only preview override: `?preview=team` flips Mason into team view
  // so he can QA the cofounder experience without changing auth state.
  // Cofounders are already pinned to 'team' by their auth role, so the flag
  // is a no-op for them — there is NO inverse path to escalate to admin.
  const previewAsTeam =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview') === 'team'
  const viewRole: ViewRole =
    role === 'admin' && adminSurfaceEnabled && !previewAsTeam ? 'admin' : 'team'

  const [selected, setSelected] = useState<FilterableVenture | null>(null)
  const [selectedDepartment, setSelectedDept] =
    useState<FilterableDepartment | null>(null)

  const set = useCallback(
    (v: FilterableVenture | null) =>
      setSelected(viewRole === 'team' && v !== 'clover-digital' ? null : v),
    [viewRole],
  )
  const clear = useCallback(() => setSelected(null), [])
  const toggle = useCallback(
    (v: FilterableVenture) =>
      setSelected((prev) => {
        if (viewRole === 'team' && v !== 'clover-digital') return null
        return prev === v ? null : v
      }),
    [viewRole],
  )
  const setSelectedDepartment = useCallback(
    (d: FilterableDepartment | null) =>
      setSelectedDept(viewRole === 'admin' ? null : d),
    [viewRole],
  )
  const clearDepartment = useCallback(() => setSelectedDept(null), [])
  const toggleDepartment = useCallback(
    (d: FilterableDepartment) =>
      setSelectedDept((prev) => (prev === d ? null : d)),
    [],
  )

  const safeSelected =
    viewRole === 'team' && selected && selected !== 'clover-digital'
      ? null
      : selected
  const safeSelectedDepartment =
    viewRole === 'admin' ? null : selectedDepartment

  const value = useMemo(
    () => ({
      selected: safeSelected,
      set,
      toggle,
      clear,
      selectedDepartment: safeSelectedDepartment,
      setSelectedDepartment,
      toggleDepartment,
      clearDepartment,
      viewRole,
    }),
    [
      safeSelected,
      set,
      toggle,
      clear,
      safeSelectedDepartment,
      setSelectedDepartment,
      toggleDepartment,
      clearDepartment,
      viewRole,
    ],
  )

  return (
    <VentureFilterContext.Provider value={value}>
      {children}
    </VentureFilterContext.Provider>
  )
}

export function useVentureFilter() {
  const ctx = useContext(VentureFilterContext)
  if (!ctx)
    throw new Error('useVentureFilter must be used inside <VentureFilterProvider>')
  return ctx
}

/**
 * Effective venture scope for query hooks.
 *
 * - `null` → no filter (admin sees everything)
 * - `string[]` → IN clause for the venture column
 *
 * Convenience: also returns the same shape for knowledge.project, since
 * the venture and project enums share their values (knowledge adds
 * `personal` which only admins should ever see).
 */
export interface EffectiveScope {
  /** For tables with a `venture` column: agent_tasks, mason_commitments, goals, cd_target_accounts. */
  ventures: string[] | null
  /** For knowledge.project: like ventures but admin includes 'personal'. */
  projects: string[] | null
}

export function useVentureScope(): EffectiveScope {
  const { selected, viewRole } = useVentureFilter()

  if (selected) {
    return { ventures: [selected], projects: [selected] }
  }
  if (viewRole === 'team') {
    return { ventures: [...TEAM_DEFAULT], projects: [...TEAM_DEFAULT] }
  }
  // admin + no filter → no IN clause; admins see everything
  return { ventures: null, projects: null }
}
