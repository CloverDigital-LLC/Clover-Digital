/**
 * Archivist Overview — Tier 1 of the richer surface mandated in fleet
 * task e2be24fd. Composed of:
 *
 *  1. TrustPanel       — fresh / stale / partial / failed strip
 *  2. RunsLedger       — last N runs with mode, scanned, proposals
 *  3. ChangeFeed24h    — what Archivist did in the last 24h
 *  4. ProposalBoard    — proposal_type · action × policy state
 *
 * The existing ArchivistReviewCard (pending queue + drawer) lives below.
 * This card answers "is Archivist healthy and what is it doing" so Mason
 * can trust the lane before approving anything.
 *
 * Read-only. Apply / approve still goes through fleet MCP.
 */
import { Card } from '../atoms'
import {
  useArchivistRuns,
  useArchivistTrust,
  useArchivistChangeFeed24h,
  useProposalsByType,
  type ArchivistRun,
  type ChangeFeedItem,
  type ProposalGroupRow,
  type TrustSignal,
} from '../../hooks/useArchivist'
import { fmtDate, fmtTime, relTime } from '../../lib/adapters'
import { useDetail } from '../Detail/DetailContext'

const TRUST_TONE: Record<TrustSignal['status'], { dot: string; label: string; tone: string }> = {
  fresh: { dot: 'bg-clover-500', label: 'Fresh', tone: 'text-clover-700' },
  partial: { dot: 'bg-ochre-500', label: 'Partial', tone: 'text-ochre-500' },
  stale: { dot: 'bg-ochre-500', label: 'Stale', tone: 'text-ochre-500' },
  failed: { dot: 'bg-rust-500', label: 'Failed', tone: 'text-rust-500' },
}

const POLICY_TONE: Record<ProposalGroupRow['policy'], string> = {
  'mason-review': 'bg-ochre-100 text-ochre-500',
  'auto-safe-later': 'bg-clover-50 text-clover-700',
  'review-required': 'bg-cream-200 text-ink-700',
  'report-only': 'bg-cream-100 text-ink-500',
}

const FEED_DOT: Record<ChangeFeedItem['kind'], string> = {
  proposal_staged: 'bg-clover-300',
  proposal_applied: 'bg-clover-700',
  proposal_rejected: 'bg-ochre-500',
  knowledge_written: 'bg-clover-500',
  change_log: 'bg-ink-400',
}

export function ArchivistOverview() {
  const trust = useArchivistTrust()
  const runs = useArchivistRuns(7)
  const feed = useArchivistChangeFeed24h()
  const groups = useProposalsByType()

  return (
    <Card
      title="Archivist"
      action={<TrustPanel signal={trust.data} />}
      footer={
        <>
          <span>
            {runs.data?.length ?? 0} runs in 30d ·{' '}
            {feed.data?.length ?? 0} changes in 24h
          </span>
          <span>{trust.isLoading ? 'Loading…' : 'Live'}</span>
        </>
      }
    >
      <div className="space-y-5">
        {/* Two-column: runs ledger + 24h change feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RunsLedger runs={runs.data ?? []} loading={runs.isLoading} />
          <ChangeFeed items={feed.data ?? []} loading={feed.isLoading} />
        </div>

        {/* Proposal board */}
        <ProposalBoard groups={groups.data ?? []} loading={groups.isLoading} />
      </div>
    </Card>
  )
}

// ─── Trust panel ─────────────────────────────────────────────────────

function TrustPanel({ signal }: { signal: TrustSignal | null }) {
  if (!signal) {
    return (
      <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
        Loading…
      </span>
    )
  }
  const t = TRUST_TONE[signal.status]
  const sub =
    signal.last_run_at == null
      ? 'no runs yet'
      : `last run ${relTime(signal.last_run_at)} · expects ${signal.expected_gap_hours}h cadence`
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      <span className={`text-[11px] uppercase tracking-[0.12em] font-medium ${t.tone}`}>
        {t.label}
      </span>
      <span className="text-[11px] text-ink-400 hidden md:inline">· {sub}</span>
    </div>
  )
}

// ─── Recent runs ledger ──────────────────────────────────────────────

function RunsLedger({ runs, loading }: { runs: ArchivistRun[]; loading: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400 mb-2">
        Recent runs
      </div>
      {loading ? (
        <div className="text-[12px] text-ink-400 italic">Loading…</div>
      ) : runs.length === 0 ? (
        <div className="text-[12px] text-ink-400 italic">No runs yet.</div>
      ) : (
        <ul className="space-y-2">
          {runs.map((r) => (
            <li
              key={r.session_id}
              className="rounded-md border border-cream-300/70 bg-cream-100/40 px-3 py-2"
              title={`${r.outcome} · venture=${r.venture ?? 'fleet'} · mode=${r.mode}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[12px] text-ink-900 tabular-nums">
                  {fmtDate(r.ran_at)} {fmtTime(r.ran_at)}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-[0.1em] font-medium ${
                    r.partial ? 'text-ochre-500' : 'text-clover-700'
                  }`}
                >
                  {r.partial ? 'partial' : r.mode}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-3 text-[12px] text-ink-500 tabular-nums">
                <span>
                  <span className="text-ink-900 font-medium">
                    {r.sources_scanned ?? '—'}
                  </span>{' '}
                  scanned
                </span>
                <span>
                  +<span className="text-ink-900 font-medium">{r.proposals_created}</span>{' '}
                  staged
                </span>
                {r.proposals_applied > 0 && (
                  <span className="text-clover-700">
                    +{r.proposals_applied} applied
                  </span>
                )}
                {r.proposals_rejected > 0 && (
                  <span className="text-ochre-500">
                    {r.proposals_rejected} rejected
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── 24h change feed ─────────────────────────────────────────────────

function ChangeFeed({ items, loading }: { items: ChangeFeedItem[]; loading: boolean }) {
  const { open } = useDetail()
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400 mb-2">
        24h changes
      </div>
      {loading ? (
        <div className="text-[12px] text-ink-400 italic">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-[12px] text-ink-400 italic">
          Quiet last 24h — no proposals, knowledge writes, or change-log entries.
        </div>
      ) : (
        <ul className="space-y-2 max-h-[260px] overflow-y-auto scroll-soft pr-1">
          {items.map((it) => {
            const clickable =
              it.kind === 'proposal_staged' ||
              it.kind === 'proposal_applied' ||
              it.kind === 'proposal_rejected' ||
              it.kind === 'knowledge_written'
            const onClick = () => {
              if (it.kind === 'knowledge_written')
                open({ kind: 'knowledge', id: it.ref_id })
              else if (clickable) open({ kind: 'proposal', id: it.ref_id })
            }
            return (
              <li
                key={it.id}
                className={`flex items-start gap-2.5 px-2 py-1.5 -mx-1 rounded-md ${
                  clickable
                    ? 'cursor-pointer hover:bg-cream-100/70 transition'
                    : ''
                }`}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? onClick : undefined}
                onKeyDown={(e) => {
                  if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onClick()
                  }
                }}
              >
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${FEED_DOT[it.kind]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-ink-900 leading-snug truncate">
                    {it.title}
                  </div>
                  {it.sub && (
                    <div className="text-[11px] text-ink-400 mt-0.5 line-clamp-1">
                      {it.sub}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-ink-400 tabular-nums whitespace-nowrap mt-1">
                  {relTime(it.at)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ─── Proposal board (type · action × policy) ─────────────────────────

function ProposalBoard({
  groups,
  loading,
}: {
  groups: ProposalGroupRow[]
  loading: boolean
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400 mb-2 flex items-center justify-between">
        <span>Proposal board</span>
        <span className="text-[10px] normal-case tracking-normal text-ink-400">
          type · action · policy
        </span>
      </div>
      {loading ? (
        <div className="text-[12px] text-ink-400 italic">Loading…</div>
      ) : groups.length === 0 ? (
        <div className="text-[12px] text-ink-400 italic">No proposals on file.</div>
      ) : (
        <div className="overflow-x-auto scroll-soft">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.08em] text-ink-400 border-b border-cream-300">
                <th className="py-1.5 pr-3 font-medium">Type</th>
                <th className="py-1.5 pr-3 font-medium">Action</th>
                <th className="py-1.5 pr-3 font-medium text-right tabular-nums">
                  Pending
                </th>
                <th className="py-1.5 pr-3 font-medium text-right tabular-nums">
                  Applied
                </th>
                <th className="py-1.5 pr-3 font-medium text-right tabular-nums">
                  Rejected
                </th>
                <th className="py-1.5 pl-3 font-medium">Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300/60">
              {groups.map((g) => (
                <tr key={`${g.proposal_type}__${g.action}`}>
                  <td className="py-2 pr-3 font-medium text-ink-900 capitalize">
                    {g.proposal_type}
                  </td>
                  <td className="py-2 pr-3 font-mono text-[11.5px] text-ink-700">
                    {g.action}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-ink-900">
                    {g.pending}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-clover-700">
                    {g.applied || '—'}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-ochre-500">
                    {g.rejected || '—'}
                  </td>
                  <td className="py-2 pl-3">
                    <span
                      className={`text-[10px] uppercase tracking-[0.1em] font-medium px-1.5 py-0.5 rounded ${POLICY_TONE[g.policy]}`}
                      title={g.policy_note}
                    >
                      {g.policy_label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
