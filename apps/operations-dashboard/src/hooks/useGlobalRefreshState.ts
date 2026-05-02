import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Global view of "is anything refetching right now" + "when did we last
 * see fresh data from anywhere." Drives the header's live indicator.
 */
export interface GlobalRefreshState {
  /** Most recent successful refetch timestamp across all queries. */
  lastRefreshedAt: Date | null
  /** True if any query is currently mid-fetch. */
  isAnyFetching: boolean
  /** Wall-clock now — re-renders every second so age strings tick. */
  now: Date
}

export function useGlobalRefreshState(): GlobalRefreshState {
  const queryClient = useQueryClient()
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  const [isAnyFetching, setIsAnyFetching] = useState(false)
  const [now, setNow] = useState<Date>(() => new Date())

  // Subscribe to React Query cache events; recompute on any change.
  // setState calls are deferred via queueMicrotask so we don't trigger
  // "Cannot update a component while rendering a different component"
  // when the cache event fires synchronously during another component's render.
  useEffect(() => {
    const cache = queryClient.getQueryCache()
    let scheduled = false

    const recompute = () => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(() => {
        scheduled = false
        const queries = cache.getAll()
        let fetching = false
        let maxUpdated = 0
        for (const q of queries) {
          if (q.state.fetchStatus === 'fetching') fetching = true
          if (q.state.dataUpdatedAt > maxUpdated) maxUpdated = q.state.dataUpdatedAt
        }
        setIsAnyFetching(fetching)
        if (maxUpdated > 0) {
          setLastRefreshedAt((prev) => {
            const next = new Date(maxUpdated)
            // Only re-render if the timestamp actually advanced
            if (prev && prev.getTime() === next.getTime()) return prev
            return next
          })
        }
      })
    }
    recompute()
    const unsub = cache.subscribe(recompute)
    return unsub
  }, [queryClient])

  // Ticking wall clock so age renders advance.
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  return { lastRefreshedAt, isAnyFetching, now }
}

/** Shorter helper: format an age in seconds/minutes for the header. */
export function formatAge(at: Date | null, now: Date): string {
  if (!at) return '—'
  const seconds = Math.max(0, Math.floor((now.getTime() - at.getTime()) / 1000))
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}
