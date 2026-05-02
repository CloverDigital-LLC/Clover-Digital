import { useEffect, useRef } from 'react'
import { useDetail } from './DetailContext'
import { useItemDetail } from './useItemDetail'
import { TaskDetail } from './renderers/TaskDetail'
import { KnowledgeDetail } from './renderers/KnowledgeDetail'
import { CommitmentDetail } from './renderers/CommitmentDetail'
import { AccountDetail } from './renderers/AccountDetail'
import { AgentDetail } from './renderers/AgentDetail'
import { GoalDetail } from './renderers/GoalDetail'
import { ProposalDetail } from './renderers/ProposalDetail'
import type {
  AgentTaskRow,
  KnowledgeRow,
  MasonCommitmentRow,
  CdTargetAccountRow,
  AgentHeartbeatRow,
  MemoryProposalRow,
} from '../../lib/types'
import type { GoalDetail as GoalDetailData } from '../../hooks/useGoals'

export function DetailDrawer() {
  const { current, close } = useDetail()
  const { data, isLoading, isError, error } = useItemDetail(
    current?.kind ?? null,
    current?.id ?? null,
  )
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Lock body scroll while open
  useEffect(() => {
    if (!current) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [current])

  // Focus the panel when it opens (so ESC works without prior interaction)
  useEffect(() => {
    if (current && panelRef.current) panelRef.current.focus()
  }, [current])

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          current
            ? 'opacity-100 pointer-events-auto bg-clover-900/30 dark:bg-black/60 backdrop-blur-[2px]'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Detail"
        className={`fixed top-0 right-0 z-50 h-full w-full sm:max-w-[560px] bg-cream-50 shadow-2xl outline-none transition-transform duration-200 ease-out flex flex-col ${
          current ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-cream-300/70">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-400 font-medium">
            {current ? labelFor(current.kind) : ''}
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="text-ink-500 hover:text-ink-900 transition w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-cream-200"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scroll-soft px-6 py-5">
          {!current ? null : isLoading ? (
            <DrawerSkeleton />
          ) : isError ? (
            <div className="rounded-md border border-rust-500/40 bg-ochre-100/60 px-3 py-2.5 text-[13px] text-rust-500">
              Failed to load: {(error as Error)?.message ?? 'unknown'}
            </div>
          ) : !data || !data.row ? (
            <div className="rounded-md border border-cream-300 bg-cream-100 px-3 py-2.5 text-[13px] text-ink-500 italic">
              Not found. The record may have been deleted.
            </div>
          ) : (
            <RenderByKind data={data} />
          )}
        </div>

        <footer className="px-6 py-3 border-t border-cream-300/70 text-[11px] text-ink-400 flex items-center justify-between">
          <span>ESC or click outside to close</span>
          <span className="font-mono">#item/{current?.kind}/…</span>
        </footer>
      </aside>
    </>
  )
}

function labelFor(kind: string): string {
  if (kind === 'task') return 'Task'
  if (kind === 'knowledge') return 'Knowledge'
  if (kind === 'commitment') return 'Commitment'
  if (kind === 'account') return 'Pipeline account'
  if (kind === 'agent') return 'Agent'
  if (kind === 'goal') return 'Goal'
  if (kind === 'proposal') return 'Archivist proposal'
  return kind
}

function RenderByKind({
  data,
}: {
  data: NonNullable<ReturnType<typeof useItemDetail>['data']>
}) {
  if (data.kind === 'task') return <TaskDetail row={data.row as AgentTaskRow} />
  if (data.kind === 'knowledge')
    return <KnowledgeDetail row={data.row as KnowledgeRow} />
  if (data.kind === 'commitment')
    return <CommitmentDetail row={data.row as MasonCommitmentRow} />
  if (data.kind === 'account')
    return <AccountDetail row={data.row as CdTargetAccountRow} />
  if (data.kind === 'agent')
    return (
      <AgentDetail row={data.row as { agent: string; beats: AgentHeartbeatRow[] }} />
    )
  if (data.kind === 'goal') return <GoalDetail row={data.row as GoalDetailData} />
  if (data.kind === 'proposal')
    return <ProposalDetail row={data.row as MemoryProposalRow} />
  return null
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-1/3 rounded bg-cream-300/70" />
      <div className="h-6 w-3/4 rounded bg-cream-300/60" />
      <div className="h-3 w-full rounded bg-cream-300/50" />
      <div className="h-3 w-5/6 rounded bg-cream-300/50" />
      <div className="h-3 w-2/3 rounded bg-cream-300/50" />
    </div>
  )
}
