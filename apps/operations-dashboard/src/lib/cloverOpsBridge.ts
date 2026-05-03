import {
  cloverOpsConfigured,
  cloverOpsSessionReady,
  cloverOpsSupabase,
  supabase,
  supabaseConfigured,
} from './supabase'
import { adminSurfaceEnabled } from './surface'

type CloverTable =
  | 'cd_goals'
  | 'cd_knowledge'
  | 'cd_target_accounts'
  | 'cd_tasks'

type CloverFilter =
  | { type: 'eq' | 'neq' | 'gte'; column: string; value: string | number }
  | { type: 'is'; column: string; value: null | boolean }
  | { type: 'in' | 'notIn'; column: string; values: Array<string | number> }
  | { type: 'not'; column: string; operator: 'in' | 'is'; value: string | null }
  | { type: 'or'; value: string }

type CloverOrder = {
  column: string
  ascending?: boolean
  nullsFirst?: boolean
}

export type CloverQueryOptions = {
  filters?: CloverFilter[]
  order?: CloverOrder[]
  limit?: number
  head?: boolean
  count?: 'exact' | 'planned' | 'estimated'
}

export type CloverQueryResult<T> = {
  data: T[] | null
  error: { message?: string } | null
  count?: number | null
}

export async function cloverOpsReadReady(): Promise<boolean> {
  if (!cloverOpsConfigured) return false
  if (!adminSurfaceEnabled) return cloverOpsSessionReady()
  if (!supabaseConfigured) return false
  const { data } = await supabase.auth.getSession()
  return Boolean(data.session?.access_token)
}

export async function selectCloverOps<T>(
  table: CloverTable,
  select: string,
  options: CloverQueryOptions = {},
): Promise<CloverQueryResult<T>> {
  if (adminSurfaceEnabled) {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) return { data: [], error: null, count: 0 }
    const response = await fetch('/api/clover-ops', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ table, select, ...options }),
    })
    const json = await response.json().catch(() => ({}))
    if (!response.ok) {
      return {
        data: [],
        error: { message: json.error ?? `Clover Ops API ${response.status}` },
      }
    }
    return {
      data: (json.data ?? []) as T[],
      error: null,
      count: json.count ?? null,
    }
  }

  let query = cloverOpsSupabase.from(table).select(select, {
    count: options.count,
    head: options.head,
  })
  for (const filter of options.filters ?? []) {
    if (filter.type === 'eq') query = query.eq(filter.column, filter.value)
    else if (filter.type === 'neq') query = query.neq(filter.column, filter.value)
    else if (filter.type === 'gte') query = query.gte(filter.column, filter.value)
    else if (filter.type === 'is') query = query.is(filter.column, filter.value)
    else if (filter.type === 'in') query = query.in(filter.column, filter.values)
    else if (filter.type === 'notIn')
      query = query.not(filter.column, 'in', `(${filter.values.join(',')})`)
    else if (filter.type === 'not')
      query = query.not(filter.column, filter.operator, filter.value)
    else if (filter.type === 'or') query = query.or(filter.value)
  }
  for (const item of options.order ?? []) {
    query = query.order(item.column, {
      ascending: item.ascending,
      nullsFirst: item.nullsFirst,
    })
  }
  if (typeof options.limit === 'number') query = query.limit(options.limit)
  const { data, error, count } = await query
  return {
    data: (data ?? []) as T[],
    error,
    count,
  }
}
