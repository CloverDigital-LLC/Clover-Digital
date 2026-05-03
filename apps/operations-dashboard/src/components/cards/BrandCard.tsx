import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card } from '../atoms'
import {
  useBrandRankHistory,
  useGithubOrgPulse,
  useSiteHealth,
  logBrandRankSnapshot,
  PRIMARY_RANK_TERM,
  type BrandRankPoint,
} from '../../hooks/useBrandTraction'
import { fmtDate, relTime } from '../../lib/adapters'
import { useVentureFilter } from '../../context/VentureFilterContext'

export function BrandCard() {
  const { viewRole } = useVentureFilter()
  const isAdmin = viewRole === 'admin'

  const { data: rankPoints = [] } = useBrandRankHistory(PRIMARY_RANK_TERM)
  const { data: gh } = useGithubOrgPulse()
  const { data: site } = useSiteHealth()

  const latest = rankPoints[0]
  const prev = rankPoints[1]
  const moved =
    latest?.rank != null && prev?.rank != null ? prev.rank - latest.rank : null

  return (
    <Card
      title="Brand traction"
      action={isAdmin ? <LogRankAction term={PRIMARY_RANK_TERM} /> : undefined}
      footer={
        <>
          <span>
            {rankPoints.length} rank · {gh?.repo_count ?? '—'} repos ·{' '}
            {site?.ok ? 'site up' : site ? 'site down' : '—'}
          </span>
          <span>Live</span>
        </>
      }
    >
      <div className="space-y-4">
        {/* Brand rank */}
        <div className="rounded-lg border border-cream-300/70 bg-cream-100/40 p-3.5">
          <div className="flex items-baseline justify-between">
            <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
              Google rank · "{PRIMARY_RANK_TERM}"
            </div>
            {latest && (
              <div className="text-[10px] text-ink-400">
                {relTime(latest.captured_at)} · {latest.source}
              </div>
            )}
          </div>
          {latest ? (
            <div className="flex items-baseline gap-2 mt-1">
              <div className="font-display text-[26px] leading-none text-ink-900 tabular-nums">
                {latest.rank ?? '—'}
                {latest.rank !== null && (
                  <span className="text-[18px] text-ink-400">#</span>
                )}
              </div>
              {moved !== null && moved !== 0 && (
                <div
                  className={`text-[12px] font-medium ${
                    moved > 0 ? 'text-clover-700' : 'text-ochre-500'
                  }`}
                >
                  {moved > 0
                    ? `↑ ${moved} from #${prev!.rank}`
                    : `↓ ${Math.abs(moved)} from #${prev!.rank}`}
                </div>
              )}
              {latest.rank === null && (
                <div className="text-[11px] text-ink-400 italic">
                  not in top {latest.top_n_checked}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 text-[12px] text-ink-400 italic">
              No rank snapshots yet.{' '}
              {isAdmin && 'Click "Log rank" above to add one.'}
            </div>
          )}
          {rankPoints.length >= 2 && <RankSparkline points={rankPoints} />}
        </div>

        {/* GitHub org pulse */}
        <div className="border-l-2 border-clover-300 pl-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
            GitHub · {`cloverdigital-llc`}
          </div>
          {gh ? (
            <>
              <div className="flex items-baseline gap-3 mt-0.5">
                <span className="font-display text-[18px] text-ink-900 tabular-nums">
                  {gh.repo_count}
                </span>
                <span className="text-[11px] text-ink-500">
                  repo{gh.repo_count === 1 ? '' : 's'}
                </span>
                <span className="font-display text-[18px] text-ink-900 tabular-nums ml-2">
                  ★ {gh.total_stars}
                </span>
                <span className="text-[11px] text-ink-500">stars</span>
              </div>
              {gh.latest_commit && (
                <div className="mt-1.5">
                  <div className="font-mono text-[11.5px] text-ink-700 leading-snug line-clamp-1">
                    {gh.latest_commit.message}
                  </div>
                  <div className="text-[11px] text-ink-400 mt-0.5">
                    {gh.latest_commit.repo} · {gh.latest_commit.author} ·{' '}
                    {relTime(gh.latest_commit.date)}{' '}
                    {gh.latest_commit.url && (
                      <a
                        href={gh.latest_commit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-clover-700 hover:underline ml-1"
                      >
                        open ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-[11px] text-ink-400 italic mt-0.5">Loading…</div>
          )}
        </div>

        {/* Site health */}
        <div className="border-l-2 border-clover-300 pl-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
            cloverdigital.com
          </div>
          {site ? (
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  site.ok ? 'bg-clover-500 pulse-dot' : 'bg-rust-500'
                }`}
              />
              <span className="text-[13px] text-ink-900">
                {site.ok ? 'reachable' : 'unreachable'}
              </span>
              {site.latency_ms !== null && (
                <span className="text-[11px] text-ink-400 tabular-nums">
                  · {site.latency_ms}ms
                </span>
              )}
              <span className="text-[11px] text-ink-400 ml-auto">
                {relTime(site.checked_at)}
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-ink-400 italic mt-0.5">Pinging…</div>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * Tiny inline sparkline for rank trend. Lower is better, so we invert the
 * Y axis (rank 1 = top of chart). Skips null ranks (didn't appear).
 */
function RankSparkline({ points }: { points: BrandRankPoint[] }) {
  const chronological = [...points].reverse()
  const ranks = chronological
    .map((p) => p.rank)
    .filter((r): r is number => r !== null)
  if (ranks.length < 2) return null

  const max = Math.max(...ranks, 10)
  const min = Math.max(1, Math.min(...ranks))
  const span = max - min || 1
  const w = 200
  const h = 32
  const stepX = w / Math.max(chronological.length - 1, 1)

  const pts = chronological
    .map((p, i) => {
      if (p.rank === null) return null
      const x = i * stepX
      // invert: lower rank = higher position
      const y = ((p.rank - min) / span) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .filter(Boolean)
    .join(' ')

  return (
    <div className="mt-2.5">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full h-7"
      >
        <polyline
          fill="none"
          stroke="#1f4d35"
          strokeWidth="1.5"
          points={pts}
        />
      </svg>
      <div className="flex justify-between text-[9px] text-ink-400 mt-0.5">
        <span>
          {fmtDate(chronological[0].captured_at)} · #{chronological[0].rank ?? '—'}
        </span>
        <span>
          #{chronological[chronological.length - 1].rank ?? '—'} ·{' '}
          {fmtDate(chronological[chronological.length - 1].captured_at)}
        </span>
      </div>
    </div>
  )
}

/**
 * Admin-only "Log rank" inline form. Pops a tiny inline input for the new
 * rank value (or "not in top 100") and writes it through RLS-gated insert.
 */
function LogRankAction({ term }: { term: string }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      const trimmed = val.trim()
      const rank =
        trimmed === '' || trimmed.toLowerCase() === 'none'
          ? null
          : parseInt(trimmed, 10)
      if (rank !== null && (!Number.isFinite(rank) || rank < 1)) {
        setErr('Enter a positive integer or leave blank for "not in top 100"')
        setSaving(false)
        return
      }
      await logBrandRankSnapshot({ term, rank })
      qc.invalidateQueries({ queryKey: ['brand-rank-history', term] })
      setOpen(false)
      setVal('')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] text-clover-700 hover:underline"
      >
        Log rank →
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1.5 text-[12px]">
      <input
        type="text"
        autoFocus
        placeholder="rank or 'none'"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') {
            setOpen(false)
            setVal('')
          }
        }}
        className="w-24 px-2 py-0.5 rounded border border-cream-300 bg-cream-50 text-[12px] focus:border-clover-500 outline-none"
        disabled={saving}
      />
      <button
        onClick={save}
        disabled={saving}
        className="text-[11px] text-clover-700 hover:underline disabled:opacity-50"
      >
        {saving ? '…' : 'save'}
      </button>
      <button
        onClick={() => {
          setOpen(false)
          setVal('')
          setErr(null)
        }}
        className="text-[11px] text-ink-400 hover:text-ink-700"
      >
        cancel
      </button>
      {err && <span className="text-[10px] text-rust-500 ml-1">{err}</span>}
    </div>
  )
}
