/**
 * Shared atoms for detail renderers — kept tiny and visual-only so each
 * renderer can compose freely without cross-coupling.
 */
import { useState, type ReactNode } from 'react'
import { fmtDate, fmtTime } from '../../../lib/adapters'
import { HumanText } from '../../HumanText/HumanText'

export function FieldGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400 mb-2">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export function Field({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-baseline gap-3 text-[13px] leading-snug">
      <span className="text-[11px] uppercase tracking-[0.08em] text-ink-400 font-medium w-32 shrink-0">
        {label}
      </span>
      <span className="flex-1 text-ink-900 break-words">{value}</span>
    </div>
  )
}

/**
 * Pull a 1–2 sentence TL;DR off the front of a long-form description.
 *
 * - Strips leading markdown chrome (##, *, -, >) so the summary is a clean
 *   sentence even if the source starts with a header.
 * - Cuts at the first paragraph break (\n\n) — most Mason / agent task
 *   descriptions front-load the "why" in the first paragraph.
 * - If that paragraph is still long (>220 chars), truncates at the nearest
 *   sentence boundary so we don't strand readers mid-clause.
 */
function extractSummary(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  // Take everything up to the first paragraph break.
  const firstPara = trimmed.split(/\n\s*\n/)[0].trim()
  // Strip leading markdown punctuation so summaries look clean as standalone.
  const stripped = firstPara.replace(/^(#{1,6}\s+|[-*]\s+|>\s+)/, '').trim()

  if (stripped.length <= 220) return stripped

  const window = stripped.slice(0, 220)
  const sentenceEnd = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('! '),
    window.lastIndexOf('? '),
  )
  if (sentenceEnd > 80) return window.slice(0, sentenceEnd + 1).trim()
  return window.trim() + '…'
}

/**
 * Renders a TL;DR up top with a "Show full context ↓" toggle for the rest.
 *
 * If the body fits comfortably (≤220 chars / one paragraph), we just render
 * the full text — no collapse, no toggle. Anything chunky gets the
 * accordion treatment so the detail drawer doesn't turn into a wall of text.
 *
 * Markdown is preserved in both states (delegates to HumanText).
 */
export function CollapsibleText({
  text,
  variant,
}: {
  text: string
  variant?: 'default' | 'code' | 'error'
}) {
  const [expanded, setExpanded] = useState(false)
  const trimmed = text.trim()
  const summary = extractSummary(trimmed)

  // Threshold: if the full body is ≤ ~280 chars or only marginally longer
  // than the summary, just render it inline. No accordion needed.
  const isShort = trimmed.length <= 280
  const collapseHelps = trimmed.length > summary.length + 60

  if (isShort || !collapseHelps) {
    return <HumanText text={trimmed} variant={variant} />
  }

  if (expanded) {
    return (
      <div>
        <HumanText text={trimmed} variant={variant} />
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 text-[11px] uppercase tracking-[0.1em] text-clover-700 hover:text-clover-900 font-medium transition"
        >
          ↑ Show less
        </button>
      </div>
    )
  }

  return (
    <div>
      <HumanText text={summary} variant={variant} />
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-2 text-[11px] uppercase tracking-[0.1em] text-clover-700 hover:text-clover-900 font-medium transition"
      >
        ↓ Show full context
      </button>
    </div>
  )
}

export interface TimelineEvent {
  at: string
  label: string
  tone: 'clover' | 'ochre' | 'rust' | 'ink'
}

const TONE_DOT: Record<TimelineEvent['tone'], string> = {
  clover: 'bg-clover-700',
  ochre: 'bg-ochre-500',
  rust: 'bg-rust-500',
  ink: 'bg-ink-400',
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0)
    return <div className="text-[12px] text-ink-400 italic">No timeline yet.</div>
  // sort ascending by time
  const sorted = [...events].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  )
  return (
    <ul className="relative space-y-3 pl-5">
      <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-cream-300" />
      {sorted.map((e, i) => (
        <li key={`${e.at}-${i}`} className="relative">
          <span
            className={`absolute -left-[18px] top-[5px] w-2.5 h-2.5 rounded-full ring-2 ring-cream-50 ${TONE_DOT[e.tone]}`}
          />
          <div className="text-[12.5px] text-ink-900 leading-snug">{e.label}</div>
          <div className="text-[11px] text-ink-400 tabular-nums">
            {fmtDate(e.at)} · {fmtTime(e.at)}
          </div>
        </li>
      ))}
    </ul>
  )
}
