import { useCommandCenter } from '../../hooks/useCommandCenter'
import type { AttentionItem, TrustSignal } from '../../lib/adapters'
import { AgentPill, Card } from '../atoms'
import { parseAttentionItemId, useDetail } from '../Detail/DetailContext'

const TONE_CLASS: Record<
  string,
  { dot: string; border: string; bg: string; text: string }
> = {
  clover: {
    dot: 'bg-clover-700',
    border: 'border-clover-200',
    bg: 'bg-clover-50/70',
    text: 'text-clover-800',
  },
  ochre: {
    dot: 'bg-ochre-500',
    border: 'border-ochre-300',
    bg: 'bg-ochre-100/60',
    text: 'text-ochre-500',
  },
  rust: {
    dot: 'bg-rust-500',
    border: 'border-rust-500/35',
    bg: 'bg-ochre-100/75',
    text: 'text-rust-500',
  },
  ink: {
    dot: 'bg-ink-500',
    border: 'border-cream-300',
    bg: 'bg-cream-100/70',
    text: 'text-ink-700',
  },
}

export function CommandCenterCard() {
  const { now, next, waiting, trust, isLoading } = useCommandCenter()

  return (
    <Card
      title="Command center"
      action={
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
          Guardrails
        </span>
      }
      footer={
        <>
          <span>Guardrails, not gates.</span>
          <span className="tabular-nums">Refresh 30s</span>
        </>
      }
      className="border-clover-200/80"
    >
      <div className="grid grid-cols-12 gap-4">
        <FocusPanel
          eyebrow="Now"
          empty="No Mason handoff is shouting."
          item={now}
          loading={isLoading}
          className="col-span-12 lg:col-span-4"
        />
        <FocusPanel
          eyebrow="Next push"
          empty="No agent work needs a nudge."
          item={next}
          loading={isLoading}
          className="col-span-12 lg:col-span-4"
        />
        <QueuePanel
          title="Waiting"
          empty="No blockers, drift, stale beats, or proposals."
          items={waiting}
          loading={isLoading}
          className="col-span-12 md:col-span-6 lg:col-span-2"
        />
        <TrustPanel
          signals={trust}
          loading={isLoading}
          className="col-span-12 md:col-span-6 lg:col-span-2"
        />
      </div>
    </Card>
  )
}

function FocusPanel({
  eyebrow,
  item,
  empty,
  loading,
  className,
}: {
  eyebrow: string
  item: AttentionItem | null
  empty: string
  loading: boolean
  className?: string
}) {
  const tone = item ? TONE_CLASS[item.tone] : TONE_CLASS.ink
  const { open } = useDetail()
  const target = item ? parseAttentionItemId(item.id) : null
  const clickable = Boolean(target)

  return (
    <div
      className={`min-h-[170px] rounded-lg border px-4 py-3.5 ${tone.border} ${tone.bg} ${className ?? ''} ${clickable ? 'cursor-pointer hover:shadow-card transition' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={() => target && open(target)}
      onKeyDown={(e) => {
        if (target && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          open(target)
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.12em] text-ink-400">
          {eyebrow}
        </div>
        <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
      </div>
      {loading ? (
        <SkeletonLines />
      ) : item ? (
        <div className="mt-4">
          <h3
            className="font-display text-[22px] leading-[1.15] tracking-tight text-ink-900 line-clamp-3"
            title={item.label}
          >
            {item.label}
          </h3>
          <div
            className="mt-3 text-[12px] leading-snug text-ink-500 line-clamp-2"
            title={item.sub}
          >
            {item.sub}
          </div>
          {item.owner && (
            <div className="mt-4">
              <AgentPill agent={item.owner} />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-7">
          <div className="font-display text-[19px] leading-tight text-ink-900">
            Clear lane.
          </div>
          <div className="mt-2 text-[12px] leading-snug text-ink-500">{empty}</div>
        </div>
      )}
    </div>
  )
}

function QueuePanel({
  title,
  items,
  empty,
  loading,
  className,
}: {
  title: string
  items: AttentionItem[]
  empty: string
  loading: boolean
  className?: string
}) {
  const { open } = useDetail()
  return (
    <div
      className={`min-h-[170px] rounded-lg border border-cream-300/80 bg-cream-100/50 px-3.5 py-3.5 ${className ?? ''}`}
    >
      <div className="text-[10px] uppercase tracking-[0.12em] text-ink-400">
        {title}
      </div>
      {loading ? (
        <SkeletonLines compact />
      ) : items.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {items.slice(0, 4).map((item) => {
            const tone = TONE_CLASS[item.tone] ?? TONE_CLASS.ink
            const target = parseAttentionItemId(item.id)
            const clickable = Boolean(target)
            return (
              <li
                key={item.id}
                className={`flex min-w-0 items-start gap-2.5 ${clickable ? 'cursor-pointer hover:bg-cream-200/60 -mx-2 px-2 py-1 rounded-md transition' : ''}`}
                title={`${item.label}${item.sub ? `\n${item.sub}` : ''}`}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={() => target && open(target)}
                onKeyDown={(e) => {
                  if (target && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    open(target)
                  }
                }}
              >
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-ink-900">
                    {item.label}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-500">
                    {item.sub}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="mt-5 text-[12px] leading-snug text-ink-500">{empty}</div>
      )}
    </div>
  )
}

function TrustPanel({
  signals,
  loading,
  className,
}: {
  signals: TrustSignal[]
  loading: boolean
  className?: string
}) {
  return (
    <div
      className={`min-h-[170px] rounded-lg border border-cream-300/80 bg-cream-100/50 px-3.5 py-3.5 ${className ?? ''}`}
    >
      <div className="text-[10px] uppercase tracking-[0.12em] text-ink-400">
        Trust
      </div>
      {loading ? (
        <SkeletonLines compact />
      ) : (
        <ul className="mt-3 space-y-3">
          {signals.map((signal) => {
            const tone = TONE_CLASS[signal.tone] ?? TONE_CLASS.ink
            return (
              <li
                key={signal.label}
                className="min-w-0"
                title={`${signal.label}: ${signal.value}${signal.sub ? `\n${signal.sub}` : ''}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[12px] font-medium text-ink-700">
                    {signal.label}
                  </span>
                  <span
                    className={`shrink-0 text-[12px] font-semibold tabular-nums ${tone.text}`}
                  >
                    {signal.value}
                  </span>
                </div>
                <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-500">
                  {signal.sub}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function SkeletonLines({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mt-4 space-y-2.5">
      <div className="h-3 w-3/4 rounded bg-cream-300/70" />
      <div className="h-3 w-full rounded bg-cream-300/60" />
      {!compact && <div className="h-3 w-1/2 rounded bg-cream-300/50" />}
    </div>
  )
}
