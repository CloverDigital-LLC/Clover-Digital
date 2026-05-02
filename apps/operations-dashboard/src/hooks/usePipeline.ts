import { useQuery } from '@tanstack/react-query'
import {
  cloverOpsConfigured,
  cloverOpsSessionReady,
  cloverOpsSupabase,
  supabase,
  supabaseConfigured,
} from '../lib/supabase'
import { adaptCdAccount } from '../lib/adapters'
import type { CdTargetAccountRow } from '../lib/types'
import { toCloverOpsId } from '../lib/cloverOps'

const REFRESH_MS = 60_000

export function usePipeline(limit = 10) {
  return useQuery({
    queryKey: ['pipeline', limit],
    queryFn: async () => {
      async function fetchRows(useCloverOps: boolean) {
        const client = useCloverOps ? cloverOpsSupabase : supabase
        const { data, error } = await client
          .from('cd_target_accounts')
          .select(
            'id, business_name, vertical, location_city, location_state, fit_score, status, updated_at, priority',
          )
          .neq('status', 'disqualified')
          .order('fit_score', { ascending: false, nullsFirst: false })
          .limit(limit)
        if (error) throw error
        return (data as unknown as CdTargetAccountRow[]).map((row) => {
          const adapted = adaptCdAccount(row)
          return useCloverOps ? { ...adapted, id: toCloverOpsId(adapted.id) } : adapted
        })
      }

      if (cloverOpsConfigured && (await cloverOpsSessionReady())) {
        try {
          return await fetchRows(true)
        } catch (error) {
          console.warn('[clover-ops] pipeline unavailable, falling back to prairie-fleet:', error)
        }
      }
      return fetchRows(false)
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured || cloverOpsConfigured,
  })
}

export function usePipelineKpis() {
  return useQuery({
    queryKey: ['pipeline-kpis'],
    queryFn: async () => {
      // active prospects = anything not disqualified
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
      async function fetchKpis(useCloverOps: boolean) {
        const client = useCloverOps ? cloverOpsSupabase : supabase
        return Promise.all([
          client
            .from('cd_target_accounts')
            .select('id', { count: 'exact', head: true })
            .neq('status', 'disqualified'),
          client
            .from('cd_target_accounts')
            .select('id', { count: 'exact', head: true })
            .gte('updated_at', sevenDaysAgo)
            .neq('status', 'new')
            .neq('status', 'disqualified'),
          client
            .from('cd_target_accounts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'qualified')
            .gte('updated_at', sevenDaysAgo),
          client
            .from('cd_target_accounts')
            .select('fit_score')
            .neq('status', 'disqualified')
            .not('fit_score', 'is', null)
            .limit(2000),
        ])
      }

      let activeRes
      let repliedRes
      let qualifiedRes
      let avgRes
      if (cloverOpsConfigured && (await cloverOpsSessionReady())) {
        try {
          ;[activeRes, repliedRes, qualifiedRes, avgRes] = await fetchKpis(true)
        } catch (error) {
          console.warn('[clover-ops] pipeline KPIs unavailable, falling back to prairie-fleet:', error)
        }
      }
      if (!activeRes || !repliedRes || !qualifiedRes || !avgRes) {
        ;[activeRes, repliedRes, qualifiedRes, avgRes] = await fetchKpis(false)
      }

      const fitScores = (avgRes.data ?? []).map((r) => r.fit_score as number)
      const avgFit =
        fitScores.length === 0
          ? 0
          : fitScores.reduce((a, b) => a + b, 0) / fitScores.length

      // Display avg as 1-5 (same normalization as the row score)
      const avg5 = avgFit >= 80 ? 5 : avgFit >= 60 ? 4 : avgFit >= 40 ? 3 : avgFit >= 20 ? 2 : 1

      return {
        active_prospects: activeRes.count ?? 0,
        avg_score: Number(avg5.toFixed(1)),
        replies_this_week: repliedRes.count ?? 0,
        meetings_booked: qualifiedRes.count ?? 0,
      }
    },
    refetchInterval: REFRESH_MS,
    enabled: supabaseConfigured || cloverOpsConfigured,
  })
}
