import { useMemo } from 'react'
import { useBriefing } from '../../hooks/useBriefing'
import { usePipelineKpis } from '../../hooks/usePipeline'
import {
  useActiveWork,
  useBlockedTasks,
  useTasksInWindow,
} from '../../hooks/useTasks'
import { useCommitments } from '../../hooks/useCommitments'
import {
  computeDepartmentDistribution,
  computeVentureDistribution,
  filterTasksByDepartment,
  pickTopTasks,
  type AttentionItem,
  type DepartmentShare,
} from '../../lib/adapters'
import { useDetail, parseAttentionItemId } from '../Detail/DetailContext'
import { useVentureFilter } from '../../context/VentureFilterContext'

const TONE_DOT: Record<string, string> = {
  clover: 'bg-clover-300',
  ochre: 'bg-ochre-300',
  rust: 'bg-rust-500',
  ink: 'bg-clover-200',
}

const TONE_ATTN: Record<string, string> = {
  ochre: 'text-ochre-500 bg-ochre-100',
  rust: 'text-rust-500 bg-ochre-100',
  clover: 'text-clover-800 bg-clover-50',
}

const VENTURE_LABELS: Record<string, string> = {
  'clover-digital': 'Clover Digital',
  'prairie-digital': 'Clover Digital', // legacy alias
  fleet: 'Fleet',
  'gate-404': 'AI Poker Stars',
  abstract: 'Abstract',
  unassigned: 'Unassigned',
}

const VENTURE_TONES: Record<string, string> = {
  'clover-digital': 'bg-clover-300',
  'prairie-digital': 'bg-clover-300',
  fleet: 'bg-clover-500',
  'gate-404': 'bg-ochre-300',
  abstract: 'bg-clover-200',
  unassigned: 'bg-cream-300',
}

const DEPARTMENT_LABELS: Record<string, string> = {
  sales: 'Sales',
  marketing: 'Marketing',
  'product-eng': 'Product / Eng',
  ops: 'Ops',
  unassigned: 'Unassigned',
}

const DEPARTMENT_TONES: Record<string, string> = {
  sales: 'bg-ochre-300',
  marketing: 'bg-clover-300',
  'product-eng': 'bg-clover-500',
  ops: 'bg-clover-200',
  unassigned: 'bg-cream-300',
}

/**
 * Smooth-scroll to a card by id and pulse a spotlight ring on it for a
 * second. Mason: clicking "13 blocked tasks" in the briefing should land
 * him on the BlockersCard with the relevant rows in view.
 */
function scrollAndSpotlight(elementId: string) {
  const el = document.getElementById(elementId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el.classList.add('attention-spotlight')
  // Remove after the keyframes finish so a second click re-triggers the
  // animation (DOM resets it on re-add).
  window.setTimeout(() => el.classList.remove('attention-spotlight'), 1600)
}

export function BriefingCard() {
  const { rollup } = useBriefing()
  const { data: kpis } = usePipelineKpis()
  const { data: activeTasks = [] } = useActiveWork()
  const { data: blockedTasks = [] } = useBlockedTasks()
  const { data: commitments = [] } = useCommitments()
  const { data: windowTasks = [] } = useTasksInWindow(7)
  const {
    selected,
    toggle,
    clear,
    viewRole,
    selectedDepartment,
    toggleDepartment,
    clearDepartment,
  } = useVentureFilter()

  // replies_this_week intentionally not surfaced — cold-email isn't live
  // yet, so the number is misleading. Re-add when outreach P5–P7 ship.

  const filteredCommitments = useMemo(
    () =>
      selected
        ? commitments.filter(
            (c) => (c.venture ?? 'unassigned') === selected,
          )
        : commitments,
    [commitments, selected],
  )

  const topTasks = useMemo(() => {
    const pool = filterTasksByDepartment(
      [...activeTasks, ...blockedTasks],
      selectedDepartment,
    )
    return pickTopTasks(pool, filteredCommitments, 5)
  }, [activeTasks, blockedTasks, filteredCommitments, selectedDepartment])

  const distribution = useMemo(
    () => computeVentureDistribution(windowTasks, 7),
    [windowTasks],
  )

  const departmentDistribution = useMemo(
    () => computeDepartmentDistribution(windowTasks, 7),
    [windowTasks],
  )

  // Use the adapter's needs_attention list verbatim — replies-to-review
  // was intentionally suppressed at the source (see adapters.ts) since
  // cold-email outreach isn't live yet.
  const needs = rollup.needs_attention

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <section className="bg-clover-800 text-white rounded-xl shadow-card overflow-hidden relative">
      <svg
        className="absolute -right-6 -top-6 opacity-[0.07]"
        width="260"
        height="260"
        viewBox="0 0 32 32"
      >
        <g fill="#faf6ef">
          <ellipse cx="11" cy="11" rx="6" ry="6" />
          <ellipse cx="21" cy="11" rx="6" ry="6" />
          <ellipse cx="11" cy="21" rx="6" ry="6" />
          <ellipse cx="21" cy="21" rx="6" ry="6" />
        </g>
      </svg>

      <div className="relative px-7 py-6">
        {/* Eyebrow + headline */}
        <div className="flex items-baseline justify-between gap-6 flex-wrap mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-clover-200 font-medium mb-1">
              Today's briefing
            </div>
            <h2 className="font-display text-[20px] leading-snug text-white">
              {today} ·{' '}
              <span className="italic text-clover-100">
                {rollup.active_tasks} in flight, {rollup.shipped_this_week} shipped this week.
              </span>
            </h2>
          </div>
          <div className="flex items-baseline gap-5">
            <BriefStat label="Active" value={rollup.active_tasks} />
            <BriefStat label="Shipped 7d" value={rollup.shipped_this_week} />
            <BriefStat label="Qualified" value={kpis?.meetings_booked ?? 0} />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Top tasks */}
          <div className="col-span-12 lg:col-span-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-clover-200 font-medium mb-3">
              Top tasks
            </div>
            {topTasks.length === 0 ? (
              <div className="text-[13px] text-clover-200 italic">
                Quiet morning. Nothing on fire.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {topTasks.map((t) => (
                  <TopTaskRow key={t.id} item={t} />
                ))}
              </ul>
            )}
          </div>

          {/* Bars: project distribution in admin, department activity in team */}
          <div className="col-span-12 lg:col-span-3">
            {viewRole === 'admin' ? (
              <>
                <div className="text-[11px] uppercase tracking-[0.14em] text-clover-200 font-medium mb-3 flex items-center justify-between gap-2">
                  <span>Where work went · 7d</span>
                  {selected && (
                    <button
                      onClick={clear}
                      className="text-[10px] uppercase tracking-[0.1em] text-ochre-300 hover:text-ochre-100 transition"
                    >
                      Show all
                    </button>
                  )}
                </div>
                {distribution.length === 0 ? (
                  <div className="text-[13px] text-clover-200 italic">
                    No activity in the last week.
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {distribution.map((v) => (
                      <ProjectBar
                        key={v.venture}
                        share={v}
                        selected={selected === v.venture}
                        anySelected={selected !== null}
                        onClick={() => toggle(v.venture as never)}
                      />
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <div className="text-[11px] uppercase tracking-[0.14em] text-clover-200 font-medium mb-3 flex items-center justify-between gap-2">
                  <span>Department activity · 7d</span>
                  {selectedDepartment && (
                    <button
                      onClick={clearDepartment}
                      className="text-[10px] uppercase tracking-[0.1em] text-ochre-300 hover:text-ochre-100 transition"
                    >
                      Show all
                    </button>
                  )}
                </div>
                {departmentDistribution.length === 0 ? (
                  <div className="text-[13px] text-clover-200 italic">
                    No activity in the last week.
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {departmentDistribution.map((d) => (
                      <DepartmentBar
                        key={d.department}
                        share={d}
                        selected={selectedDepartment === d.department}
                        anySelected={selectedDepartment !== null}
                        onClick={() =>
                          toggleDepartment(d.department as never)
                        }
                      />
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* Needs your attention */}
          <div className="col-span-12 lg:col-span-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-clover-200 font-medium mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ochre-300" />
              Needs your attention
            </div>
            <ul className="space-y-2">
              {needs.length === 0 ? (
                <li className="text-[13px] text-clover-200 italic">
                  All clear. Go work the pipeline.
                </li>
              ) : (
                needs.map((n, i) => {
                  const clickable = Boolean(n.scroll_to)
                  const inner = (
                    <>
                      <span
                        className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                          TONE_ATTN[n.tone] ?? TONE_ATTN.clover
                        }`}
                      >
                        !
                      </span>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-[12.5px] text-white font-medium leading-snug">
                          {n.label}
                          {clickable && (
                            <span className="text-clover-300 ml-1.5">→</span>
                          )}
                        </div>
                        {n.sub && (
                          <div className="text-[11px] text-clover-200 leading-snug mt-0.5 line-clamp-2">
                            {n.sub}
                          </div>
                        )}
                      </div>
                    </>
                  )
                  return clickable ? (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => scrollAndSpotlight(n.scroll_to!)}
                        title={`Jump to ${n.scroll_to}`}
                        className="w-full flex items-start gap-2.5 px-3 py-2 rounded-lg bg-clover-900/40 border border-clover-700/40 hover:bg-clover-900/60 hover:border-clover-500/60 transition cursor-pointer"
                      >
                        {inner}
                      </button>
                    </li>
                  ) : (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-clover-900/40 border border-clover-700/40"
                    >
                      {inner}
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function BriefStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-l border-clover-700/60 pl-3">
      <div className="text-[10px] uppercase tracking-[0.1em] text-clover-200">{label}</div>
      <div className="font-display text-[22px] leading-none mt-1 tabular-nums text-white">
        {value}
      </div>
    </div>
  )
}

function TopTaskRow({ item }: { item: AttentionItem }) {
  const { open } = useDetail()
  const target = parseAttentionItemId(item.id)
  const clickable = Boolean(target)

  return (
    <li
      className={`flex items-start gap-2.5 ${
        clickable
          ? 'cursor-pointer hover:bg-clover-900/40 -mx-2 px-2 py-1.5 rounded-md transition'
          : 'py-1'
      }`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={() => target && open(target)}
      onKeyDown={(e) => {
        if (target && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          open(target)
        }
      }}
      title={`${item.label}${item.sub ? `\n${item.sub}` : ''}`}
    >
      <span
        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
          TONE_DOT[item.tone] ?? TONE_DOT.clover
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-white font-medium leading-snug">
          {item.label}
        </div>
        <div className="truncate text-[11px] text-clover-200 mt-0.5">{item.sub}</div>
      </div>
    </li>
  )
}

function DepartmentBar({
  share,
  selected,
  anySelected,
  onClick,
}: {
  share: DepartmentShare
  selected: boolean
  anySelected: boolean
  onClick: () => void
}) {
  const label = DEPARTMENT_LABELS[share.department] ?? share.department
  const tone = DEPARTMENT_TONES[share.department] ?? 'bg-clover-200'
  // Match the admin venture-bar treatment: dim non-selected bars when a
  // filter is active so the selected one carries the visual weight.
  const dim = anySelected && !selected
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        title={
          selected
            ? `Click to show all — currently scoped to ${label}`
            : `Click to scope dashboard to ${label}`
        }
        className={`group w-full text-left rounded-md transition cursor-pointer px-2 -mx-2 py-1 ${
          selected
            ? 'bg-clover-900/50 ring-1 ring-clover-500/50'
            : 'hover:bg-clover-900/30'
        } ${dim ? 'opacity-50' : ''}`}
      >
        <div className="flex items-baseline justify-between text-[12px] mb-1">
          <span
            className={`truncate ${selected ? 'text-white font-medium' : 'text-white'}`}
          >
            {selected && '✓ '}
            {label}
          </span>
          <span className="font-mono tabular-nums text-clover-200 shrink-0 ml-2">
            {share.pct}% · {share.count}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-clover-900/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${tone}`}
            style={{ width: `${Math.max(2, share.pct)}%` }}
          />
        </div>
      </button>
    </li>
  )
}

function ProjectBar({
  share,
  selected,
  anySelected,
  onClick,
}: {
  share: { venture: string; count: number; pct: number }
  selected: boolean
  anySelected: boolean
  onClick: () => void
}) {
  const label = VENTURE_LABELS[share.venture] ?? share.venture
  const tone = VENTURE_TONES[share.venture] ?? 'bg-clover-200'
  // Dim the non-selected bars when a filter is active.
  const dim = anySelected && !selected
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        title={
          selected
            ? `Click to show all — currently scoped to ${label}`
            : `Click to scope dashboard to ${label}`
        }
        className={`group w-full text-left rounded-md transition cursor-pointer px-2 -mx-2 py-1 ${
          selected
            ? 'bg-clover-900/50 ring-1 ring-clover-500/50'
            : 'hover:bg-clover-900/30'
        } ${dim ? 'opacity-50' : ''}`}
      >
        <div className="flex items-baseline justify-between text-[12px] mb-1">
          <span
            className={`truncate ${selected ? 'text-white font-medium' : 'text-white'}`}
          >
            {selected && '✓ '}
            {label}
          </span>
          <span className="font-mono tabular-nums text-clover-200 shrink-0 ml-2">
            {share.pct}% · {share.count}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-clover-900/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${tone}`}
            style={{ width: `${Math.max(2, share.pct)}%` }}
          />
        </div>
      </button>
    </li>
  )
}
