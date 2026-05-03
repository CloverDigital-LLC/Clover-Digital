/**
 * Archivist data hooks. Powers the richer Archivist surface (Tier 1):
 *  - Recent runs ledger (sessions + per-run proposal counts)
 *  - 24h change feed (proposals staged/applied/rejected, knowledge written, change_log)
 *  - Trust signals (fresh / stale / partial / failed)
 *  - Proposals grouped by proposal_type · payload.action with policy state
 *
 * Reads only. All writes (apply, status flips) stay backend / fleet MCP.
 *
 * Skipped sources mark a run "partial" — never healthy-green. The trust
 * panel reflects this.
 */
import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useVentureFilter } from '../context/VentureFilterContext'

const REFRESH_MS = 60_000
const ARCHIVIST = 'archivist'

// ─── Types ───────────────────────────────────────────────────────────

export interface ArchivistRun {
  session_id: string
  ran_at: string
  outcome: string
  venture: string | null
  /** "propose-only" / "auto-apply" inferred from session.summary text. */
  mode: 'propose-only' | 'auto-apply' | 'unknown'
  /** Sessions Archivist scanned (read off the most recent matching proposal). */
  sources_scanned: number | null
  proposals_created: number
  proposals_applied: number
  proposals_rejected: number
  partial: boolean
}

export interface ChangeFeedItem {
  id: string
  kind:
    | 'proposal_staged'
    | 'proposal_applied'
    | 'proposal_rejected'
    | 'knowledge_written'
    | 'change_log'
  title: string
  sub: string | null
  at: string
  ref_id: string
  /** UI hint for tone. */
  tone: 'clover' | 'ochre' | 'rust' | 'ink'
}

export interface TrustSignal {
  status: 'fresh' | 'stale' | 'partial' | 'failed'
  last_run_at: string | null
  hours_since_last: number | null
  expected_gap_hours: number
  partial_runs_recent: number
  failed_runs_recent: number
}

export interface ProposalGroupRow {
  proposal_type: string
  action: string
  pending: number
  applied: number
  rejected: number
  policy: 'mason-review' | 'auto-safe-later' | 'review-required' | 'report-only'
  policy_label: string
  policy_note: string
}

// ─── Apply policy ────────────────────────────────────────────────────
// Source of truth: the spec on fleet task e2be24fd. Distinguishes
// proposal_type from payload.action. The current `auto_approvable` flag
// is always false today; this map captures the trajectory.

interface PolicyDecision {
  policy: ProposalGroupRow['policy']
  label: string
  note: string
}

export function applyPolicyFor(
  proposal_type: string,
  action: string,
): PolicyDecision {
  if (action === 'promote_project_status') {
    return {
      policy: 'mason-review',
      label: 'Mason review',
      note: 'aggregate knowledge only — likely auto-safe later',
    }
  }
  if (action === 'update_agent_task_status') {
    return {
      policy: 'mason-review',
      label: 'Mason review',
      note: 'auto only with exact UUID + strong evidence + non-risky class',
    }
  }
  if (proposal_type === 'merge') {
    return {
      policy: 'review-required',
      label: 'Review',
      note: 'auto only for exact duplicates with very high similarity',
    }
  }
  if (proposal_type === 'supersede') {
    return {
      policy: 'review-required',
      label: 'Review',
      note: 'always review',
    }
  }
  if (proposal_type === 'decay') {
    return {
      policy: 'auto-safe-later',
      label: 'Auto-safe candidate',
      note: 'low blast radius — first auto-apply candidate',
    }
  }
  if (proposal_type === 'demote' || proposal_type === 'promote') {
    return {
      policy: 'review-required',
      label: 'Review',
      note: 'scope changes require review until proven',
    }
  }
  if (proposal_type === 'delete') {
    return {
      policy: 'report-only',
      label: 'Report-only',
      note: 'auto only for strict junk; never young rows',
    }
  }
  return {
    policy: 'mason-review',
    label: 'Mason review',
    note: 'unclassified — defaults to review',
  }
}

// ─── Hooks ───────────────────────────────────────────────────────────

/**
 * Last 7 Archivist runs with derived per-run proposal counts. Joins
 * agent_sessions + memory_proposals on the run timestamp window
 * (proposals carry no session_id; we attribute to the nearest preceding
 * session within 30 min).
 */
export function useArchivistRuns(limit = 7) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['archivist-runs', viewRole, limit],
    queryFn: async (): Promise<ArchivistRun[]> => {
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
      const [sessionsRes, proposalsRes] = await Promise.all([
        supabase
          .from('agent_sessions')
          .select('id, agent, venture, summary, outcome, created_at')
          .eq('agent', ARCHIVIST)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('memory_proposals')
          .select('id, status, payload, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false }),
      ])
      if (sessionsRes.error) throw sessionsRes.error
      if (proposalsRes.error) throw proposalsRes.error

      const sessions = sessionsRes.data ?? []
      const proposals = (proposalsRes.data ?? []) as Array<{
        id: string
        status: string
        payload: Record<string, unknown> | null
        created_at: string
      }>

      // Bucket proposals by the nearest preceding session created_at within
      // a 30-minute window. Archivist files all his proposals at run-end so
      // they cluster tightly.
      const sessionAt = sessions.map((s) => new Date(s.created_at).getTime())
      const proposalsBySession = new Map<string, typeof proposals>()
      for (const p of proposals) {
        const t = new Date(p.created_at).getTime()
        const idx = sessionAt.findIndex((st) => Math.abs(t - st) < 30 * 60_000)
        if (idx >= 0) {
          const sid = sessions[idx].id
          if (!proposalsBySession.has(sid)) proposalsBySession.set(sid, [])
          proposalsBySession.get(sid)!.push(p)
        }
      }

      return sessions.map((s) => {
        const matched = proposalsBySession.get(s.id) ?? []
        const created = matched.length
        const applied = matched.filter((p) => p.status === 'approved' || p.status === 'applied').length
        const rejected = matched.filter((p) => p.status === 'rejected').length
        const summary = (s.summary ?? '').toLowerCase()
        const mode: ArchivistRun['mode'] = summary.includes('propose-only')
          ? 'propose-only'
          : summary.includes('auto-apply')
            ? 'auto-apply'
            : 'unknown'
        // Pick sources_scanned from the freshest proposal payload in this run.
        const probe = matched[0]?.payload
        const sources_scanned =
          probe && typeof (probe as Record<string, unknown>).sessions_scanned === 'number'
            ? ((probe as Record<string, unknown>).sessions_scanned as number)
            : null
        const partial =
          s.outcome !== 'completed' ||
          summary.includes('skipped') ||
          summary.includes('partial')
        return {
          session_id: s.id,
          ran_at: s.created_at,
          outcome: s.outcome ?? 'unknown',
          venture: s.venture,
          mode,
          sources_scanned,
          proposals_created: created,
          proposals_applied: applied,
          proposals_rejected: rejected,
          partial,
        }
      })
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

/**
 * Trust signal — derived from the most recent run + recent partials/failures.
 * Skipped sources OR a non-completed outcome demote a run from "fresh" to
 * "partial". Multiple consecutive failures push it to "failed".
 */
export function useArchivistTrust() {
  const runs = useArchivistRuns(7)
  const data: TrustSignal | null = runs.data
    ? deriveTrust(runs.data)
    : null
  return { data, isLoading: runs.isLoading }
}

function deriveTrust(runs: ArchivistRun[]): TrustSignal {
  if (runs.length === 0) {
    return {
      status: 'failed',
      last_run_at: null,
      hours_since_last: null,
      expected_gap_hours: 24,
      partial_runs_recent: 0,
      failed_runs_recent: 0,
    }
  }
  const latest = runs[0]
  const hoursSince =
    (Date.now() - new Date(latest.ran_at).getTime()) / 3_600_000
  const partial = runs.filter((r) => r.partial).length
  const failed = runs.filter((r) => r.outcome !== 'completed').length
  const expected = 24 // archivist runs daily
  // Status precedence: failed > stale > partial > fresh
  let status: TrustSignal['status']
  if (failed >= 2 && runs[0].outcome !== 'completed') status = 'failed'
  else if (hoursSince > expected * 1.5) status = 'stale'
  else if (latest.partial) status = 'partial'
  else status = 'fresh'
  return {
    status,
    last_run_at: latest.ran_at,
    hours_since_last: hoursSince,
    expected_gap_hours: expected,
    partial_runs_recent: partial,
    failed_runs_recent: failed,
  }
}

/**
 * What changed in the last 24h because of Archivist. Pulls from:
 *  - memory_proposals (created/applied/rejected)
 *  - knowledge written by archivist
 *  - change_log entries with agent='archivist'
 * Sorted newest first.
 */
export function useArchivistChangeFeed24h() {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['archivist-change-feed-24h', viewRole],
    queryFn: async (): Promise<ChangeFeedItem[]> => {
      const since = new Date(Date.now() - 24 * 3_600_000).toISOString()

      const [proposalsRes, knowledgeRes, changesRes] = await Promise.all([
        supabase
          .from('memory_proposals')
          .select('id, proposal_type, status, payload, rationale, created_at, reviewed_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false }),
        supabase
          .from('knowledge')
          .select('id, title, category, project, source_agent, created_at')
          .eq('source_agent', ARCHIVIST)
          .gte('created_at', since)
          .order('created_at', { ascending: false }),
        supabase
          .from('change_log')
          .select('id, change_type, description, venture, created_at')
          .eq('agent', ARCHIVIST)
          .gte('created_at', since)
          .order('created_at', { ascending: false }),
      ])
      if (proposalsRes.error) throw proposalsRes.error
      if (knowledgeRes.error) throw knowledgeRes.error
      if (changesRes.error) throw changesRes.error

      const items: ChangeFeedItem[] = []

      for (const p of proposalsRes.data ?? []) {
        const action =
          (p.payload as Record<string, unknown> | null)?.action ??
          p.proposal_type ??
          'proposal'
        const project =
          ((p.payload as Record<string, unknown> | null)?.project as string) ??
          'fleet'
        if (p.status === 'pending') {
          items.push({
            id: `proposal-staged-${p.id}`,
            kind: 'proposal_staged',
            title: `Proposal staged: ${humanize(action as string)}`,
            sub: `${project} · ${p.rationale ?? '—'}`,
            at: p.created_at,
            ref_id: p.id,
            tone: 'clover',
          })
        } else if (p.status === 'approved' || p.status === 'applied') {
          items.push({
            id: `proposal-applied-${p.id}`,
            kind: 'proposal_applied',
            title: `Proposal applied: ${humanize(action as string)}`,
            sub: `${project}`,
            at: p.reviewed_at ?? p.created_at,
            ref_id: p.id,
            tone: 'clover',
          })
        } else if (p.status === 'rejected') {
          items.push({
            id: `proposal-rejected-${p.id}`,
            kind: 'proposal_rejected',
            title: `Proposal rejected: ${humanize(action as string)}`,
            sub: `${project}`,
            at: p.reviewed_at ?? p.created_at,
            ref_id: p.id,
            tone: 'ochre',
          })
        }
      }

      for (const k of knowledgeRes.data ?? []) {
        items.push({
          id: `knowledge-${k.id}`,
          kind: 'knowledge_written',
          title: `Knowledge: ${k.title}`,
          sub: `${k.project} · ${k.category}`,
          at: k.created_at,
          ref_id: k.id,
          tone: 'clover',
        })
      }

      for (const c of changesRes.data ?? []) {
        items.push({
          id: `change-${c.id}`,
          kind: 'change_log',
          title: c.description ?? c.change_type,
          sub: `${c.venture ?? 'fleet'} · ${c.change_type}`,
          at: c.created_at,
          ref_id: c.id,
          tone: 'ink',
        })
      }

      items.sort((a, b) => +new Date(b.at) - +new Date(a.at))
      return items
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

/**
 * All proposals grouped by (proposal_type, payload.action) with status
 * counts and a policy badge derived from the spec.
 */
export function useProposalsByType() {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['proposals-by-type', viewRole],
    queryFn: async (): Promise<ProposalGroupRow[]> => {
      const { data, error } = await supabase
        .from('memory_proposals')
        .select('id, proposal_type, status, payload')
      if (error) throw error
      const buckets = new Map<string, ProposalGroupRow>()
      for (const p of data ?? []) {
        const action =
          ((p.payload as Record<string, unknown> | null)?.action as string) ??
          p.proposal_type ??
          'unknown'
        const key = `${p.proposal_type}__${action}`
        const existing = buckets.get(key)
        if (!existing) {
          const policy = applyPolicyFor(p.proposal_type ?? '', action)
          buckets.set(key, {
            proposal_type: p.proposal_type ?? 'unknown',
            action,
            pending: 0,
            applied: 0,
            rejected: 0,
            policy: policy.policy,
            policy_label: policy.label,
            policy_note: policy.note,
          })
        }
        const row = buckets.get(key)!
        if (p.status === 'pending') row.pending += 1
        else if (p.status === 'approved' || p.status === 'applied')
          row.applied += 1
        else if (p.status === 'rejected') row.rejected += 1
      }
      return Array.from(buckets.values()).sort(
        (a, b) => b.pending + b.applied + b.rejected - (a.pending + a.applied + a.rejected),
      )
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

function humanize(s: string): string {
  return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
