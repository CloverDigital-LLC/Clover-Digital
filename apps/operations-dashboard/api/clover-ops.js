import { createClient } from '@supabase/supabase-js'

const ALLOWED_TABLES = new Set([
  'cd_goals',
  'cd_knowledge',
  'cd_target_accounts',
  'cd_tasks',
])

const SAFE_COLUMN = /^[A-Za-z_][A-Za-z0-9_]*$/
const SAFE_OR = /^[A-Za-z0-9_.,:-]+$/

function getBearer(req) {
  const header = req.headers.authorization ?? req.headers.Authorization ?? ''
  const value = Array.isArray(header) ? header[0] : header
  return value.startsWith('Bearer ') ? value.slice('Bearer '.length) : null
}

function applyFilters(query, filters = []) {
  for (const filter of filters) {
    if (filter.type === 'or') {
      if (typeof filter.value !== 'string' || !SAFE_OR.test(filter.value)) {
        throw new Error('Invalid OR filter')
      }
      query = query.or(filter.value)
      continue
    }

    if (!SAFE_COLUMN.test(filter.column ?? '')) {
      throw new Error('Invalid filter column')
    }

    if (filter.type === 'eq') query = query.eq(filter.column, filter.value)
    else if (filter.type === 'neq') query = query.neq(filter.column, filter.value)
    else if (filter.type === 'gte') query = query.gte(filter.column, filter.value)
    else if (filter.type === 'is') query = query.is(filter.column, filter.value)
    else if (filter.type === 'in') query = query.in(filter.column, filter.values ?? [])
    else if (filter.type === 'notIn') {
      query = query.not(filter.column, 'in', `(${(filter.values ?? []).join(',')})`)
    } else if (filter.type === 'not') {
      if (!['in', 'is'].includes(filter.operator)) throw new Error('Invalid not operator')
      query = query.not(filter.column, filter.operator, filter.value)
    } else {
      throw new Error('Invalid filter type')
    }
  }
  return query
}

function applyOrder(query, order = []) {
  for (const item of order) {
    if (!SAFE_COLUMN.test(item.column ?? '')) throw new Error('Invalid order column')
    query = query.order(item.column, {
      ascending: item.ascending ?? true,
      nullsFirst: item.nullsFirst,
    })
  }
  return query
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = getBearer(req)
    if (!token) return res.status(401).json({ error: 'Missing bearer token' })

    const prairieUrl = process.env.VITE_SUPABASE_URL
    const prairieAnon = process.env.VITE_SUPABASE_ANON_KEY
    const cloverUrl = process.env.VITE_CLOVER_OPS_SUPABASE_URL
    const cloverService = process.env.CLOVER_OPS_SUPABASE_SERVICE_KEY
    if (!prairieUrl || !prairieAnon || !cloverUrl || !cloverService) {
      return res.status(500).json({ error: 'Server env is not configured' })
    }

    const prairie = createClient(prairieUrl, prairieAnon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: role, error: roleError } = await prairie.rpc('dashboard_role')
    if (roleError || role !== 'admin') {
      return res.status(403).json({ error: 'Admin session required' })
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (!ALLOWED_TABLES.has(body.table)) {
      return res.status(400).json({ error: 'Unsupported Clover Ops table' })
    }

    const clover = createClient(cloverUrl, cloverService, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    let query = clover
      .from(body.table)
      .select(body.select ?? '*', {
        count: body.count ?? undefined,
        head: body.head ?? false,
      })
    query = applyFilters(query, body.filters)
    query = applyOrder(query, body.order)
    if (typeof body.limit === 'number') query = query.limit(body.limit)

    const { data, error, count } = await query
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ data, count: count ?? null })
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Bad request',
    })
  }
}
