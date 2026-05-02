/**
 * Path-to-revenue strip — the money anchor at the top of the dashboard.
 *
 * Mason loves money signals. This shows:
 *   - 0 / 8 paid pilots (the goal, a9116549)
 *   - $0 / $10k MRR with a fill bar
 *   - $X/mo qualified pipeline value (the wow number — currently
 *     $1.29M/mo across ~1k accounts)
 *
 * Calm clover styling — same warmth as WinsStripe; this is "you're on
 * the path," not "fix this."
 */
import { Link } from 'wouter'
import { useMoneyMeter } from '../hooks/useMoney'

export function MoneyMeter() {
  const { data, isLoading } = useMoneyMeter()
  if (isLoading || !data) return null
  const mrrPct = data.mrr_target_cents > 0
    ? Math.min(100, Math.round((data.mrr_cents / data.mrr_target_cents) * 100))
    : 0
  const pilotsPct = data.pilots_target > 0
    ? Math.min(100, Math.round((data.pilots_signed / data.pilots_target) * 100))
    : 0
  return (
    <Link href="/projects/clover-digital">
      <a className="block group">
        <div className="rounded-xl border border-clover-200 bg-clover-50/60 dark:bg-night-800 dark:border-night-700 px-4 py-3 hover:border-clover-300 transition cursor-pointer">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] uppercase tracking-[0.14em] text-clover-700 font-medium">
                Path to revenue
              </span>
              <span className="text-[11px] text-ink-400">
                Q2 goal: 8 pilots, $10k MRR
              </span>
            </div>
            <span className="text-[11px] text-clover-700 group-hover:text-clover-900 transition">
              Clover Digital →
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Pilots progress */}
            <ProgressBlock
              label="Paid pilots"
              big={`${data.pilots_signed} / ${data.pilots_target}`}
              pct={pilotsPct}
              sub={`${data.pilots_target - data.pilots_signed} to first revenue target`}
            />
            {/* MRR thermometer */}
            <ProgressBlock
              label="MRR"
              big={`${formatDollars(data.mrr_cents)} / ${formatDollars(data.mrr_target_cents)}`}
              pct={mrrPct}
              sub={
                mrrPct === 0
                  ? 'Each pilot at $1.25k/mo moves the needle ~12%'
                  : `${mrrPct}% to target`
              }
            />
            {/* Pipeline potential — the wow number */}
            <div className="rounded-lg bg-cream-50 dark:bg-night-900 border border-clover-200/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.1em] text-clover-700 font-medium">
                Qualified pipeline
              </div>
              <div className="font-display text-[22px] tabular-nums text-ink-900 leading-none mt-1">
                {formatDollars(data.qualified_pipeline_cents)}
                <span className="text-[12px] text-ink-500 ml-1">/ mo potential</span>
              </div>
              <div className="text-[11px] text-ink-500 mt-1">
                {data.qualified_count.toLocaleString()} qualified accounts
              </div>
            </div>
          </div>
        </div>
      </a>
    </Link>
  )
}

function ProgressBlock({
  label,
  big,
  pct,
  sub,
}: {
  label: string
  big: string
  pct: number
  sub: string
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-clover-700 font-medium">
        {label}
      </div>
      <div className="font-display text-[22px] tabular-nums text-ink-900 leading-none mt-1">
        {big}
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-cream-200 dark:bg-night-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-clover-700 transition-all"
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <div className="text-[11px] text-ink-500 mt-1">{sub}</div>
    </div>
  )
}

/** Compact dollar formatter — $0, $1.25k, $10k, $1.29M. */
function formatDollars(cents: number): string {
  const dollars = cents / 100
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`
  if (dollars >= 10_000) return `$${Math.round(dollars / 1_000)}k`
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`
  return `$${dollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}
