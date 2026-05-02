/**
 * Top-of-page "today at a glance" strip — compact horizontal pills that
 * surface what needs Mason RIGHT NOW so re-entry after distraction is
 * a single glance, not a hunt.
 *
 * Reads the same `needs_attention` rollup the Briefing card computes,
 * so the data is already battle-tested. Each pill is clickable and
 * uses the existing scroll-spotlight pattern from BriefingCard to land
 * Mason on the relevant downstream card.
 *
 * Pass 1 of the ADHD-friendly layout work (fleet task 59986b98).
 */
import { useBriefing } from '../hooks/useBriefing'
import type { NeedsAttention } from '../lib/adapters'

/**
 * Per-tone pill styling. Rust is reserved for actual problems (drifted
 * commitments, hard failures) — gets richer background + bolder text +
 * slightly larger padding so it pops in the row. Ochre = medium urgency.
 * Clover = informational / positive.
 */
const TONE: Record<
  NeedsAttention['tone'],
  { dot: string; ring: string; text: string; bg: string; weight: string; size: string }
> = {
  rust: {
    dot: 'bg-rust-500',
    ring: 'ring-rust-500/50',
    text: 'text-rust-500',
    bg: 'bg-ochre-100',
    weight: 'font-semibold',
    size: 'px-3 py-2',
  },
  ochre: {
    dot: 'bg-ochre-500',
    ring: 'ring-ochre-300/60',
    text: 'text-ochre-500',
    bg: 'bg-cream-50 dark:bg-night-800',
    weight: 'font-medium',
    size: 'px-2.5 py-1.5',
  },
  clover: {
    dot: 'bg-clover-700',
    ring: 'ring-clover-200',
    text: 'text-clover-800',
    bg: 'bg-cream-50 dark:bg-night-800',
    weight: 'font-medium',
    size: 'px-2.5 py-1.5',
  },
}

function scrollAndSpotlight(elementId: string) {
  const el = document.getElementById(elementId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el.classList.add('attention-spotlight')
  window.setTimeout(() => el.classList.remove('attention-spotlight'), 1600)
}

export function TodayStripe() {
  const { rollup, isLoading } = useBriefing()
  // Replies-to-review intentionally not surfaced here — Mason: that's a
  // sales/cold-email future surface, not a needs-Mason-now signal.
  const needs: NeedsAttention[] = rollup.needs_attention

  // Returns inline pill content (no outer wrapper) so the dashboard can flow
  // these alongside WinsStripe pills in a single wrapping row.
  if (isLoading) {
    return (
      <span className="text-[11px] text-ink-400 italic self-center">Loading today…</span>
    )
  }

  if (needs.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-ink-500 px-1">
        <span className="w-1.5 h-1.5 rounded-full bg-clover-500 pulse-dot" />
        All clear. Go work the pipeline.
      </div>
    )
  }

  return (
    <>
      {needs.map((n, i) => {
        const t = TONE[n.tone] ?? TONE.clover
        const clickable = Boolean(n.scroll_to)
        const labelSize = n.tone === 'rust' ? 'text-[13px]' : 'text-[12.5px]'
        const inner = (
          <>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />
            <span className={`${labelSize} text-ink-900 ${t.weight} leading-none`}>
              {n.label}
            </span>
            {n.sub && (
              <span className="hidden sm:inline text-[11px] text-ink-400 leading-none truncate max-w-[18rem]">
                {n.sub}
              </span>
            )}
            {clickable && <span className={`text-[11px] ml-0.5 ${t.text}`}>→</span>}
          </>
        )
        return clickable ? (
          <button
            key={i}
            type="button"
            onClick={() => scrollAndSpotlight(n.scroll_to!)}
            className={`group flex items-center gap-2 ${t.size} rounded-full ${t.bg} ring-1 ${t.ring} hover:brightness-95 transition cursor-pointer`}
            title={`Jump to ${n.scroll_to}`}
          >
            {inner}
          </button>
        ) : (
          <div
            key={i}
            className={`flex items-center gap-2 ${t.size} rounded-full ${t.bg} ring-1 ${t.ring}`}
          >
            {inner}
          </div>
        )
      })}
    </>
  )
}
