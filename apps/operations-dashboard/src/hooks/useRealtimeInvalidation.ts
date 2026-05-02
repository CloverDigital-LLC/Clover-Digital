import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

/**
 * Subscribe to Postgres row changes on the tables the dashboard reads,
 * and invalidate the matching React Query caches when anything changes.
 *
 * This turns the dashboard from "polls every 30-60s" into "appears
 * within ~1s of an agent writing." Polling stays as a backstop in case
 * a websocket message gets dropped.
 *
 * Tables → query keys mapping is hand-maintained. If you add a new
 * hook, add the table → keys entry below.
 */
const TABLE_TO_KEYS: Record<string, string[][]> = {
  agent_tasks: [
    ['active-work'],
    ['recently-shipped'],
    ['cross-venture'],
    ['blocked-tasks'],
    ['tasks-in-window'],
    ['item-detail'],
    ['goals-progress'],
    ['goal-detail'],
  ],
  mason_commitments: [
    ['mason-commitments'],
    ['item-detail'],
    ['goals-progress'],
    ['goal-detail'],
  ],
  knowledge: [['knowledge'], ['latest-archivist-status'], ['item-detail']],
  agent_heartbeats: [['heartbeats'], ['item-detail']],
  cd_target_accounts: [['pipeline'], ['pipeline-kpis'], ['item-detail']],
  daily_briefs: [['daily-brief']],
  memory_proposals: [['pending-memory-proposals']],
  goals: [['goals'], ['goals-progress'], ['goal-detail']],
  artifacts: [['artifacts']],
  artifact_links: [['artifacts']],
}

export function useRealtimeInvalidation() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const accessToken = session?.access_token ?? null

  useEffect(() => {
    if (!supabaseConfigured) return
    // Wait for a real auth token. Without it, RLS-protected realtime
    // subscriptions return CHANNEL_ERROR. Each token rotation re-runs
    // this effect (accessToken is in the dep list).
    if (!accessToken) return

    // Tell the realtime client about the user's JWT so RLS enforcement
    // works server-side. This is what was missing before.
    supabase.realtime.setAuth(accessToken)

    const tables = Object.keys(TABLE_TO_KEYS)
    const channel = supabase.channel(`clover-dashboard-${Date.now()}`, {
      config: { broadcast: { ack: false }, presence: { key: '' } },
    })

    for (const table of tables) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          for (const key of TABLE_TO_KEYS[table]) {
            queryClient.invalidateQueries({ queryKey: key, exact: false })
          }
        },
      )
    }

    let retryTimer: ReturnType<typeof setTimeout> | null = null
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        // eslint-disable-next-line no-console
        console.info('[realtime] subscribed to', tables.length, 'tables')
        if (retryTimer) {
          clearTimeout(retryTimer)
          retryTimer = null
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        // eslint-disable-next-line no-console
        console.warn('[realtime] subscription issue:', status, err)
        // Auto-retry after a short backoff. Polling stays as backstop in
        // the meantime so data still freshens, just slower.
        if (!retryTimer) {
          retryTimer = setTimeout(() => {
            retryTimer = null
            channel.unsubscribe().then(() => channel.subscribe())
          }, 5000)
        }
      } else if (status === 'CLOSED') {
        // eslint-disable-next-line no-console
        console.info('[realtime] channel closed')
      }
    })

    return () => {
      if (retryTimer) clearTimeout(retryTimer)
      supabase.removeChannel(channel)
    }
  }, [queryClient, accessToken])
}
