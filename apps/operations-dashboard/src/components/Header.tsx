import type { ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { CloverMark } from './atoms'
import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../theme/ThemeProvider'
import { formatAge, useGlobalRefreshState } from '../hooks/useGlobalRefreshState'
import { useVentureFilter } from '../context/VentureFilterContext'
import { surfaceBrand, surfaceKicker } from '../lib/surface'

export function Header() {
  const { user, signOut, designMode } = useAuth()
  const { lastRefreshedAt, isAnyFetching, now } = useGlobalRefreshState()
  const ageLabel = formatAge(lastRefreshedAt, now)
  const { viewRole } = useVentureFilter()
  const [location] = useLocation()
  const isAgents = location.startsWith('/agents')
  const isProjects = location.startsWith('/projects')
  const isHome = !isAgents && !isProjects

  return (
    <header className="sticky top-0 z-50 bg-cream-50/95 dark:bg-night-900/95 backdrop-blur-sm border-b border-cream-300/80 dark:border-night-700">
      <div className="max-w-[1240px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          {/* Logo always goes home */}
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition"
            title="Back to dashboard"
          >
            <CloverMark size={24} />
            <span className="font-display text-[20px] tracking-tight text-clover-800 dark:text-clover-300 font-medium">
              {surfaceBrand}
            </span>
          </Link>
          <span className="hidden sm:inline-block ml-3 text-[11px] uppercase tracking-[0.14em] text-ink-400 dark:text-clover-300/70 font-medium border-l border-cream-300 dark:border-night-700 pl-3">
            {surfaceKicker}
          </span>
          {designMode && (
            <span className="ml-3 text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-ochre-100 text-ochre-500 font-medium">
              design mode
            </span>
          )}
          {/* Top nav — admin-only. Team view (cofounders) lives on the
              dashboard; the project + agent surfaces are Mason follow-ups
              and we don't want cofounders bouncing between them. */}
          {viewRole === 'admin' && (
            <nav className="hidden md:flex items-center gap-1 ml-6 text-[12px]">
              <NavPill href="/" active={isHome}>Dashboard</NavPill>
              <NavPill href="/projects" active={isProjects}>Projects</NavPill>
              <NavPill href="/agents" active={isAgents}>Agents</NavPill>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div
            className="hidden md:flex items-center gap-2 text-[11px] text-ink-400 dark:text-clover-300/80"
            title={
              lastRefreshedAt
                ? `Last successful refetch: ${lastRefreshedAt.toLocaleTimeString()}`
                : 'No data fetched yet'
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAnyFetching
                  ? 'bg-ochre-300 pulse-dot'
                  : 'bg-clover-500 pulse-dot'
              }`}
            />
            <span className="tabular-nums text-ink-700 dark:text-cream-100">
              {isAnyFetching ? 'refreshing…' : ageLabel}
            </span>
          </div>
          <ThemeToggle />
          {user && (
            <button
              onClick={signOut}
              className="text-[13px] text-ink-500 hover:text-ink-900 transition"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-cream-300 dark:border-night-700 text-ink-700 dark:text-clover-200 hover:bg-cream-200 dark:hover:bg-night-700 transition"
    >
      {theme === 'dark' ? (
        // sun
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // moon
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

function NavPill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={`px-2.5 py-1 rounded-full transition ${
        active
          ? 'bg-clover-100 text-clover-800 dark:bg-night-700 dark:text-clover-200 font-medium'
          : 'text-ink-500 dark:text-clover-300/80 hover:text-ink-900 dark:hover:text-clover-100'
      }`}
    >
      {children}
    </Link>
  )
}
