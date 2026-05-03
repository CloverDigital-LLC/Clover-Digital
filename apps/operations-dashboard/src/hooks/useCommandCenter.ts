import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { usePendingProposals } from './useMemoryProposals'
import {
  buildTrustSignals,
  buildWaitingItems,
  pickAgentPush,
  pickMasonFocus,
} from '../lib/adapters'
import { useActiveWork, useBlockedTasks } from './useTasks'
import { useCommitments } from './useCommitments'
import { useHeartbeats } from './useHeartbeats'
import type { KnowledgeRow } from '../lib/types'
import { useVentureFilter } from '../context/VentureFilterContext'

export function useLatestArchivistStatus() {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['latest-archivist-status', viewRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge')
        .select('id, project, category, title, content, source_agent, source_machine, source_channel, tags, is_private, expires_at, created_at, updated_at, scope, confidence')
        .eq('source_agent', 'archivist')
        .eq('project', 'fleet')
        .eq('category', 'status')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data ?? null) as KnowledgeRow | null
    },
    refetchInterval: 60_000,
    enabled: supabaseConfigured && viewRole === 'admin',
  })
}

export function useCommandCenter() {
  const active = useActiveWork()
  const blocked = useBlockedTasks()
  const commitments = useCommitments()
  const liveness = useHeartbeats()
  const proposals = usePendingProposals()
  const archivist = useLatestArchivistStatus()

  const model = useMemo(() => {
    const activeTasks = active.data ?? []
    const blockedTasks = blocked.data ?? []
    const commitmentItems = commitments.data ?? []
    const liveAgents = liveness.data ?? []
    const proposalRows = proposals.data ?? []
    const sourceErrors = [
      active.error && 'active work',
      blocked.error && 'blockers',
      commitments.error && 'commitments',
      liveness.error && 'heartbeats',
      proposals.error && 'proposals',
      archivist.error && 'archivist',
    ].filter(Boolean) as string[]

    const focusTasks = Array.from(
      new Map([...activeTasks, ...blockedTasks].map((task) => [task.id, task])).values(),
    )

    const now = pickMasonFocus(focusTasks, commitmentItems)
    const next = pickAgentPush(activeTasks, commitmentItems)
    const waiting = buildWaitingItems(
      blockedTasks,
      commitmentItems,
      liveAgents,
      proposalRows,
      now ? [now.id] : [],
    )
    const trust = buildTrustSignals(
      liveAgents,
      proposalRows,
      archivist.data
        ? { created_at: archivist.data.created_at, content: archivist.data.content }
        : null,
      new Date(),
      sourceErrors,
    )

    return { now, next, waiting, trust }
  }, [
    active.data,
    blocked.data,
    commitments.data,
    liveness.data,
    proposals.data,
    proposals.error,
    archivist.data,
    archivist.error,
    active.error,
    blocked.error,
    commitments.error,
    liveness.error,
  ])

  return {
    ...model,
    isLoading:
      active.isLoading ||
      blocked.isLoading ||
      commitments.isLoading ||
      liveness.isLoading ||
      proposals.isLoading ||
      archivist.isLoading,
  }
}
