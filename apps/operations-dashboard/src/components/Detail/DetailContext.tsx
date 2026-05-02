import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Detail-drawer context.
 *
 * Any card can call `open({ kind, id })` to surface a slide-in detail view
 * for the underlying record. The drawer is rendered once at the App root
 * (see `<DetailDrawer />` in App.tsx) so any nested component can drive it.
 *
 * URL hash sync: opening a target writes `#item/<kind>/<id>` so links can
 * be deep-shared. ESC + backdrop-click + close-button all clear the hash.
 *
 * Recognized kinds — keep these in lockstep with the renderers in
 * `renderers/`. AttentionItem ids from the command center use the form
 * `task-<uuid>` / `commitment-<uuid>` / `agent-<name>`; we strip the prefix
 * before opening (see `parseAttentionItemId`).
 */
export type DetailKind =
  | 'task'
  | 'knowledge'
  | 'commitment'
  | 'account'
  | 'agent'
  | 'goal'
  | 'proposal'

export interface DetailTarget {
  kind: DetailKind
  id: string
}

interface DetailContextValue {
  current: DetailTarget | null
  open: (target: DetailTarget) => void
  close: () => void
}

const DetailContext = createContext<DetailContextValue | null>(null)

const HASH_PREFIX = '#item/'

function parseHash(): DetailTarget | null {
  const hash = window.location.hash
  if (!hash.startsWith(HASH_PREFIX)) return null
  const rest = hash.slice(HASH_PREFIX.length)
  const [kind, ...idParts] = rest.split('/')
  const id = idParts.join('/')
  if (!kind || !id) return null
  if (
    kind !== 'task' &&
    kind !== 'knowledge' &&
    kind !== 'commitment' &&
    kind !== 'account' &&
    kind !== 'agent' &&
    kind !== 'goal' &&
    kind !== 'proposal'
  ) {
    return null
  }
  return { kind, id }
}

function writeHash(target: DetailTarget | null) {
  if (target) {
    const next = `${HASH_PREFIX}${target.kind}/${target.id}`
    if (window.location.hash !== next) {
      history.replaceState(null, '', next)
    }
  } else if (window.location.hash.startsWith(HASH_PREFIX)) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}

export function DetailProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<DetailTarget | null>(() => parseHash())

  const open = useCallback((target: DetailTarget) => {
    setCurrent(target)
    writeHash(target)
  }, [])

  const close = useCallback(() => {
    setCurrent(null)
    writeHash(null)
  }, [])

  // Hash → state (browser back/forward, manual edits)
  useEffect(() => {
    const onHashChange = () => setCurrent(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // ESC closes
  useEffect(() => {
    if (!current) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, close])

  const value = useMemo(() => ({ current, open, close }), [current, open, close])

  return <DetailContext.Provider value={value}>{children}</DetailContext.Provider>
}

export function useDetail() {
  const ctx = useContext(DetailContext)
  if (!ctx) throw new Error('useDetail must be used inside <DetailProvider>')
  return ctx
}

/**
 * Convert an AttentionItem.id (e.g. `task-<uuid>`, `commitment-<uuid>`,
 * `agent-<name>`) into a DetailTarget. Returns null for ids the drawer
 * doesn't know how to render.
 */
export function parseAttentionItemId(itemId: string): DetailTarget | null {
  const dash = itemId.indexOf('-')
  if (dash <= 0) return null
  const prefix = itemId.slice(0, dash)
  const rest = itemId.slice(dash + 1)
  if (!rest) return null
  if (prefix === 'task') return { kind: 'task', id: rest }
  if (prefix === 'commitment') return { kind: 'commitment', id: rest }
  if (prefix === 'agent') return { kind: 'agent', id: rest }
  if (prefix === 'proposal') return { kind: 'proposal', id: rest }
  return null
}
