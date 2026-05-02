/**
 * Focus mode — ADHD pass 5.
 *
 * Mason: when re-entering after distraction, the full dashboard is too
 * much. Focus mode collapses the page to "money strip + attention pills
 * + command center + blockers" and hides everything else. Each thing
 * cut from the screen has a project/agent home it lives on.
 *
 * Persists across reloads via localStorage. `f` toggles when no input
 * has focus; same idea as Gmail/Linear keyboard nav.
 */
import { useEffect, useState } from 'react'

const KEY = 'clover-dashboard.focus-mode'

export function useFocusMode() {
  const [focus, setFocus] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(KEY) === '1'
  })

  // Persist across reloads.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (focus) window.localStorage.setItem(KEY, '1')
    else window.localStorage.removeItem(KEY)
  }, [focus])

  // `f` toggles, but only when not typing into a field. Modifier keys
  // (cmd/ctrl/alt) are skipped so we don't fight browser shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'f' && e.key !== 'F') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (target?.isContentEditable) return
      e.preventDefault()
      setFocus((prev) => !prev)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return [focus, setFocus] as const
}
