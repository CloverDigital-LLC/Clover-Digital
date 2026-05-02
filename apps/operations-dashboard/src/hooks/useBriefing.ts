import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { computeBriefing } from '../lib/adapters'
import { useActiveWork, useRecentlyShipped, useBlockedTasks } from './useTasks'
import { useCommitments } from './useCommitments'
import { useHeartbeats } from './useHeartbeats'

/** Pulls the latest daily_brief row for fallback narrative text. */
export function useDailyBrief() {
  return useQuery({
    queryKey: ['daily-brief'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_briefs')
        .select('id, brief_date, full_brief, action_items, fleet_status, created_at')
        .order('brief_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    refetchInterval: 5 * 60_000,
    enabled: supabaseConfigured,
  })
}

/**
 * Composes the briefing rollup from already-fetched widget data so we don't
 * round-trip the DB an extra time.
 */
export function useBriefing() {
  const active = useActiveWork()
  const shipped = useRecentlyShipped()
  const blocked = useBlockedTasks()
  const commits = useCommitments()
  const beats = useHeartbeats()
  const daily = useDailyBrief()

  // Replies-this-week count comes from pipeline KPIs to avoid a second query.
  // It's surfaced to BriefingCard separately as a prop.
  const rollup = useMemo(() => {
    const tasks = [
      ...(active.data ?? []),
      ...(shipped.data ?? []),
      ...(blocked.data ?? []),
    ]
    return computeBriefing(
      tasks,
      commits.data ?? [],
      beats.data ?? [],
      0, // replies count — overridden by BriefingCard which has it
    )
  }, [active.data, shipped.data, blocked.data, commits.data, beats.data])

  return {
    rollup,
    daily: daily.data ?? null,
    isLoading:
      active.isLoading ||
      shipped.isLoading ||
      blocked.isLoading ||
      commits.isLoading ||
      beats.isLoading,
  }
}
