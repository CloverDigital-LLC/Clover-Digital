/**
 * Brand traction widget data sources.
 *
 * - Rank history: brand_rank_snapshots table on prairie-fleet (manual now,
 *   SERP-automated when task 6d0a815e lands)
 * - GitHub org pulse: live from GitHub API across cloverdigital-llc repos
 * - Site health: HEAD ping to cloverdigital.com
 *
 * Latest commit: still here for compatibility, used in the dashboard.
 */
import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useVentureFilter } from '../context/VentureFilterContext'

const ORG = 'cloverdigital-llc'
const SITE = 'https://cloverdigital.com'
const PRIMARY_TERM = 'clover digital'

export interface BrandRankPoint {
  id: string
  term: string
  rank: number | null
  top_n_checked: number
  source: string
  notes: string | null
  captured_at: string
}

export interface GhRepo {
  name: string
  full_name: string
  stargazers_count: number
  pushed_at: string
  default_branch: string
  private: boolean
  html_url: string
}

export interface GhCommit {
  sha: string
  html_url: string
  commit: { author: { name: string; date: string }; message: string }
}

export interface SiteHealth {
  ok: boolean
  status: number | null
  latency_ms: number | null
  checked_at: string
}

export function useBrandRankHistory(term: string = PRIMARY_TERM) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['brand-rank-history', viewRole, term],
    queryFn: async (): Promise<BrandRankPoint[]> => {
      const { data, error } = await supabase
        .from('brand_rank_snapshots')
        .select('id, term, rank, top_n_checked, source, notes, captured_at')
        .eq('term', term)
        .order('captured_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []) as BrandRankPoint[]
    },
    refetchInterval: 60_000,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

export function useGithubOrgPulse() {
  return useQuery({
    queryKey: ['gh-org-pulse', ORG],
    queryFn: async () => {
      const repoRes = await fetch(
        `https://api.github.com/orgs/${ORG}/repos?per_page=50&sort=pushed`,
        { headers: { Accept: 'application/vnd.github+json' } },
      )
      if (!repoRes.ok) throw new Error(`gh repos: ${repoRes.status}`)
      const repos = (await repoRes.json()) as GhRepo[]

      // Latest commit from the most-recently-pushed public repo
      const top = repos.find((r) => !r.private) ?? repos[0]
      let latestCommit: GhCommit | null = null
      if (top) {
        const cRes = await fetch(
          `https://api.github.com/repos/${top.full_name}/commits?per_page=1`,
          { headers: { Accept: 'application/vnd.github+json' } },
        )
        if (cRes.ok) {
          const arr = (await cRes.json()) as GhCommit[]
          latestCommit = arr[0] ?? null
        }
      }

      const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0)
      const lastPush = repos[0]?.pushed_at ?? null

      return {
        repo_count: repos.length,
        total_stars: totalStars,
        last_push_at: lastPush,
        repos,
        latest_commit: latestCommit
          ? {
              repo: top!.full_name,
              message: latestCommit.commit.message.split('\n')[0],
              author: latestCommit.commit.author.name,
              date: latestCommit.commit.author.date,
              url: latestCommit.html_url,
            }
          : null,
      }
    },
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  })
}

export function useSiteHealth() {
  return useQuery({
    queryKey: ['site-health', SITE],
    queryFn: async (): Promise<SiteHealth> => {
      const start = performance.now()
      try {
        // no-cors mode lets us check reachability without CORS issues; we
        // can't read status but we can detect failures and time it.
        await fetch(SITE, { method: 'GET', mode: 'no-cors', cache: 'no-store' })
        return {
          ok: true,
          status: null, // opaque under no-cors
          latency_ms: Math.round(performance.now() - start),
          checked_at: new Date().toISOString(),
        }
      } catch {
        return {
          ok: false,
          status: null,
          latency_ms: null,
          checked_at: new Date().toISOString(),
        }
      }
    },
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  })
}

/** Insert a manual brand-rank snapshot. Admin-only by RLS. */
export async function logBrandRankSnapshot(args: {
  term: string
  rank: number | null
  source?: string
  notes?: string
  captured_by?: string
}) {
  const { data, error } = await supabase
    .from('brand_rank_snapshots')
    .insert({
      term: args.term,
      rank: args.rank,
      source: args.source ?? 'manual',
      notes: args.notes ?? null,
      captured_by: args.captured_by ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export const PRIMARY_RANK_TERM = PRIMARY_TERM
