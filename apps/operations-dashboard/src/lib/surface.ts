export type DashboardSurface = 'clover' | 'admin'

const requestedSurface = String(
  import.meta.env.VITE_DASHBOARD_SURFACE ?? '',
).toLowerCase()

const legacyAdminFlag =
  String(import.meta.env.VITE_ENABLE_ADMIN_SURFACE ?? '').toLowerCase() ===
  'true'

export const dashboardSurface: DashboardSurface =
  requestedSurface === 'admin' || legacyAdminFlag ? 'admin' : 'clover'

export const adminSurfaceEnabled = dashboardSurface === 'admin'

export const surfaceBrand =
  dashboardSurface === 'admin' ? 'Mason Admin' : 'Clover Digital'

export const surfaceKicker =
  dashboardSurface === 'admin' ? 'Aggregate Ops' : 'Operations'

export const surfaceTitle =
  dashboardSurface === 'admin'
    ? 'Mason Admin Dashboard'
    : 'Clover Digital Dashboard'
