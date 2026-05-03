import { useQuery } from '@tanstack/react-query'
import {
  cloverOpsConfigured,
  supabase,
  supabaseConfigured,
} from '../lib/supabase'
import { cloverOpsReadReady, selectCloverOps } from '../lib/cloverOpsBridge'
import { adaptCdAccount } from '../lib/adapters'
import type { CdTargetAccountRow } from '../lib/types'
import { toCloverOpsId } from '../lib/cloverOps'
import { useVentureFilter } from '../context/VentureFilterContext'

const REFRESH_MS = 60_000

export function usePipeline(limit = 10) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['pipeline', limit, viewRole],
    queryFn: async () => {
      async function fetchRows(useCloverOps: boolean) {
        const select =
          'id, business_name, vertical, location_city, location_state, fit_score, status, updated_at, priority'
        const { data, error } = useCloverOps
          ? await selectCloverOps<CdTargetAccountRow>('cd_target_accounts', select, {
              filters: [{ type: 'neq', column: 'status', value: 'disqualified' }],
              order: [{ column: 'fit_score', ascending: false, nullsFirst: false }],
              limit,
            })
          : await supabase
              .from('cd_target_accounts')
              .select(select)
              .neq('status', 'disqualified')
              .order('fit_score', { ascending: false, nullsFirst: false })
              .limit(limit)
        if (error) throw error
        return (data as unknown as CdTargetAccountRow[]).map((row) => {
          const adapted = adaptCdAccount(row)
          return useCloverOps ? { ...adapted, id: toCloverOpsId(adapted.id) } : adapted
        })
      }

      if (await cloverOpsReadReady()) {
        try {
          return await fetchRows(true)
        } catch (error) {
          console.warn('[clover-ops] pipeline unavailable:', error)
        }
      }
      return viewRole === 'admin' && supabaseConfigured ? fetchRows(false) : []
    },
    refetchInterval: REFRESH_MS,
    enabled: (viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured,
  })
}

export function usePipelineKpis() {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['pipeline-kpis', viewRole],
    queryFn: async () => {
      // active prospects = anything not disqualified
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
      async function fetchKpis(useCloverOps: boolean) {
        if (useCloverOps) {
          return Promise.all([
            selectCloverOps('cd_target_accounts', 'id', {
              count: 'exact',
              head: true,
              filters: [{ type: 'neq', column: 'status', value: 'disqualified' }],
            }),
            selectCloverOps('cd_target_accounts', 'id', {
              count: 'exact',
              head: true,
              filters: [
                { type: 'gte', column: 'updated_at', value: sevenDaysAgo },
                { type: 'neq', column: 'status', value: 'new' },
                { type: 'neq', column: 'status', value: 'disqualified' },
              ],
            }),
            selectCloverOps('cd_target_accounts', 'id', {
              count: 'exact',
              head: true,
              filters: [
                { type: 'eq', column: 'status', value: 'qualified' },
                { type: 'gte', column: 'updated_at', value: sevenDaysAgo },
              ],
            }),
            selectCloverOps<{ fit_score: number | null }>(
              'cd_target_accounts',
              'fit_score',
              {
                filters: [
                  { type: 'neq', column: 'status', value: 'disqualified' },
                  { type: 'not', column: 'fit_score', operator: 'is', value: null },
                ],
                limit: 2000,
              },
            ),
          ])
        }
        return Promise.all([
          supabase
            .from('cd_target_accounts')
            .select('id', { count: 'exact', head: true })
            .neq('status', 'disqualified'),
          supabase
            .from('cd_target_accounts')
            .select('id', { count: 'exact', head: true })
            .gte('updated_at', sevenDaysAgo)
            .neq('status', 'new')
            .neq('status', 'disqualified'),
          supabase
            .from('cd_target_accounts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'qualified')
            .gte('updated_at', sevenDaysAgo),
          supabase
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
      if (await cloverOpsReadReady()) {
        try {
          ;[activeRes, repliedRes, qualifiedRes, avgRes] = await fetchKpis(true)
        } catch (error) {
          console.warn('[clover-ops] pipeline KPIs unavailable:', error)
        }
      }
      if (
        (!activeRes || !repliedRes || !qualifiedRes || !avgRes) &&
        viewRole === 'admin' &&
        supabaseConfigured
      ) {
        ;[activeRes, repliedRes, qualifiedRes, avgRes] = await fetchKpis(false)
      }
      if (!activeRes || !repliedRes || !qualifiedRes || !avgRes) {
        return {
          active_prospects: 0,
          avg_score: 0,
          replies_this_week: 0,
          meetings_booked: 0,
        }
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
    enabled: (viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured,
  })
}
