/**
 * Reusable atoms — pulled from the Claude Design artifact.
 * Same visual vocabulary; just typed and modular.
 */
import type { ReactNode } from 'react'

const AGENT_MAP: Record<
  string,
  { bg: string; fg: string; dot: string; label: string }
> = {
  hermes: { bg: 'bg-clover-50', fg: 'text-clover-800', dot: 'bg-clover-700', label: 'Hermes' },
  bighoss: { bg: 'bg-ochre-100', fg: 'text-ochre-500', dot: 'bg-ochre-500', label: 'Bighoss' },
  derek: { bg: 'bg-cream-300/70', fg: 'text-ink-700', dot: 'bg-ink-700', label: 'Derek' },
  'claude-code': { bg: 'bg-clover-100', fg: 'text-clover-800', dot: 'bg-clover-500', label: 'Claude' },
  codex: { bg: 'bg-cream-200', fg: 'text-ink-900', dot: 'bg-ink-700', label: 'Codex' },
  archivist: { bg: 'bg-ochre-100', fg: 'text-ochre-500', dot: 'bg-ochre-500', label: 'Archivist' },
  mason: { bg: 'bg-clover-100', fg: 'text-clover-800', dot: 'bg-clover-800', label: 'Mason · CEO' },
  // Cofounders. Distinct dot colors so the goal cards read at a glance:
  // who owns Marketing (Dan/CMO) vs Ops (Shannon/COO) vs Product (Jasper/CTO).
  jasper: { bg: 'bg-clover-50', fg: 'text-clover-800', dot: 'bg-clover-500', label: 'Jasper · CTO' },
  shannon: { bg: 'bg-cream-200', fg: 'text-ink-900', dot: 'bg-clover-700', label: 'Shannon · COO' },
  dan: { bg: 'bg-ochre-100', fg: 'text-ochre-500', dot: 'bg-ochre-500', label: 'Dan · CMO' },
}

export function AgentPill({ agent }: { agent: string | null }) {
  const m = (agent && AGENT_MAP[agent]) || {
    bg: 'bg-cream-300/70',
    fg: 'text-ink-700',
    dot: 'bg-ink-700',
    label: agent ?? 'unassigned',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

const STATUS_MAP: Record<string, { bg: string; fg: string; label: string; dot: string }> = {
  // Tasks
  running: { bg: 'bg-clover-50', fg: 'text-clover-800', label: 'Running', dot: 'bg-clover-700 pulse-dot' },
  queued: { bg: 'bg-cream-200', fg: 'text-ink-500', label: 'Queued', dot: 'bg-ink-400' },
  completed: { bg: 'bg-clover-50', fg: 'text-clover-700', label: 'Completed', dot: 'bg-clover-500' },
  blocked: { bg: 'bg-ochre-100', fg: 'text-ochre-500', label: 'Blocked', dot: 'bg-ochre-500' },
  failed: { bg: 'bg-ochre-100', fg: 'text-rust-500', label: 'Failed', dot: 'bg-rust-500' },
  cancelled: { bg: 'bg-cream-200', fg: 'text-ink-500', label: 'Cancelled', dot: 'bg-ink-400' },
  researching: { bg: 'bg-clover-50', fg: 'text-clover-700', label: 'Researching', dot: 'bg-clover-500 pulse-dot' },
  planned: { bg: 'bg-cream-200', fg: 'text-ink-700', label: 'Planned', dot: 'bg-ink-500' },
  plan_review: { bg: 'bg-cream-200', fg: 'text-ink-700', label: 'Plan review', dot: 'bg-ink-500' },
  code_review: { bg: 'bg-cream-200', fg: 'text-ink-700', label: 'Code review', dot: 'bg-ink-500' },
  testing: { bg: 'bg-clover-50', fg: 'text-clover-700', label: 'Testing', dot: 'bg-clover-500 pulse-dot' },
  deploying: { bg: 'bg-clover-50', fg: 'text-clover-700', label: 'Deploying', dot: 'bg-clover-500 pulse-dot' },

  // Pipeline (cd_target_accounts)
  new: { bg: 'bg-cream-200', fg: 'text-ink-500', label: 'New', dot: 'bg-ink-400' },
  qualified: { bg: 'bg-clover-50', fg: 'text-clover-800', label: 'Qualified', dot: 'bg-clover-700' },
  disqualified: { bg: 'bg-cream-100', fg: 'text-ink-400', label: 'Disqualified', dot: 'bg-ink-400' },

  // Commitments
  open: { bg: 'bg-cream-200', fg: 'text-ink-700', label: 'Open', dot: 'bg-ink-500' },
  in_progress: { bg: 'bg-clover-50', fg: 'text-clover-800', label: 'In progress', dot: 'bg-clover-700' },
  done: { bg: 'bg-clover-50', fg: 'text-clover-700', label: 'Done', dot: 'bg-clover-500' },
  delegated: { bg: 'bg-cream-300', fg: 'text-ink-700', label: 'Delegated', dot: 'bg-ink-500' },
  dropped: { bg: 'bg-cream-100', fg: 'text-ink-400', label: 'Dropped', dot: 'bg-ink-400' },

  // Liveness
  busy: { bg: 'bg-clover-50', fg: 'text-clover-800', label: 'Busy', dot: 'bg-clover-700 pulse-dot' },
  idle: { bg: 'bg-cream-200', fg: 'text-ink-500', label: 'Idle', dot: 'bg-clover-500' },
  stale: { bg: 'bg-ochre-100', fg: 'text-ochre-500', label: 'Stale', dot: 'bg-ochre-500' },
  offline: { bg: 'bg-cream-100', fg: 'text-ink-400', label: 'Offline', dot: 'bg-ink-400' },
}

export function StatusPill({ status }: { status: string }) {
  const m = STATUS_MAP[status] ?? { bg: 'bg-cream-200', fg: 'text-ink-500', label: status, dot: 'bg-ink-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

export function Score({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-3 rounded-sm ${i <= value ? 'bg-clover-700' : 'bg-cream-300'}`}
        />
      ))}
      <span className="ml-1.5 text-[11px] text-ink-500 tabular-nums">{value}</span>
    </span>
  )
}

interface CardProps {
  title?: string
  action?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  className?: string
  /** When true, the body scrolls internally instead of growing the card. */
  scrollBody?: boolean
  /** DOM id — used by the briefing's "Needs your attention" scroll-to. */
  id?: string
}

export function Card({
  title,
  action,
  footer,
  children,
  className = '',
  scrollBody = false,
  id,
}: CardProps) {
  return (
    <section
      id={id}
      className={`bg-cream-50 dark:bg-night-800 border border-cream-300/80 dark:border-night-700 rounded-xl shadow-card overflow-hidden flex flex-col ${className}`}
    >
      {(title || action) && (
        <header className="px-5 pt-4 pb-3 flex items-baseline justify-between gap-3 shrink-0">
          <h3 className="font-display text-[18px] tracking-tight text-ink-900 font-medium">
            {title}
          </h3>
          {action && (
            <div className="text-[12px] text-clover-700 dark:text-clover-300 hover:text-clover-800 dark:hover:text-clover-200 cursor-pointer">
              {action}
            </div>
          )}
        </header>
      )}
      <div className="card-divider h-px shrink-0" />
      <div
        className={`flex-1 px-5 py-4 min-h-0 ${
          scrollBody ? 'overflow-y-auto scroll-soft' : ''
        }`}
      >
        {children}
      </div>
      {footer && (
        <>
          <div className="card-divider h-px shrink-0" />
          <div className="px-5 py-2.5 text-[11px] text-ink-400 dark:text-clover-300/70 flex items-center justify-between bg-cream-100/40 dark:bg-night-900/40 shrink-0">
            {footer}
          </div>
        </>
      )}
    </section>
  )
}

interface KpiProps {
  label: string
  value: string | number
  delta?: string
  highlight?: boolean
}

export function Kpi({ label, value, delta, highlight }: KpiProps) {
  return (
    <div
      className={`rounded-lg px-3.5 py-3 border ${
        highlight
          ? 'bg-clover-800 border-clover-800 text-white'
          : 'bg-cream-100/60 border-cream-300/70'
      }`}
    >
      <div
        className={`text-[10px] uppercase tracking-[0.1em] ${
          highlight ? 'text-clover-200' : 'text-ink-400'
        }`}
      >
        {label}
      </div>
      <div
        className={`font-display text-[28px] leading-none mt-1.5 tabular-nums ${
          highlight ? 'text-white' : 'text-ink-900'
        }`}
      >
        {value}
      </div>
      {delta && (
        <div
          className={`text-[11px] mt-1.5 ${
            highlight ? 'text-clover-200' : 'text-clover-700'
          }`}
        >
          {delta}
        </div>
      )}
    </div>
  )
}

export function EmptyState({
  icon,
  line,
  sub,
}: {
  icon: string
  line: string
  sub?: string
}) {
  return (
    <div className="py-8 text-center">
      <div className="font-display text-[28px] text-clover-500 leading-none">{icon}</div>
      <div className="font-display italic text-[16px] text-ink-700 mt-2">{line}</div>
      {sub && <div className="text-[12px] text-ink-400 mt-1">{sub}</div>}
    </div>
  )
}

export function CloverMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
      <g fill="#1f4d35">
        <ellipse cx="11" cy="11" rx="6" ry="6" />
        <ellipse cx="21" cy="11" rx="6" ry="6" />
        <ellipse cx="11" cy="21" rx="6" ry="6" />
        <ellipse cx="21" cy="21" rx="6" ry="6" />
      </g>
      <rect x="15.4" y="14" width="1.2" height="14" fill="#1f4d35" rx="0.6" />
    </svg>
  )
}
