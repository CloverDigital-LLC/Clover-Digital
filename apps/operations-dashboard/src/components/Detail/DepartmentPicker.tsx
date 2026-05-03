/**
 * Admin-only department setter for a task. Writes directly to
 * agent_tasks.department via the JS client; an UPDATE RLS policy
 * (`dashboard_update_tasks`) gates it to admins.
 *
 * Optimistic update: we set local state immediately and let realtime
 * invalidate the cache. If the write fails (network or RLS), we revert
 * and surface the error inline.
 */
import { useState } from 'react'
import { cloverOpsSupabase, supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import type { Department } from '../../lib/types'
import { fromCloverOpsId, isCloverOpsId } from '../../lib/cloverOps'

const OPTIONS: Array<{ value: Department | 'unassigned' | ''; label: string }> = [
  { value: '', label: '— inferred from agent —' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'product-eng', label: 'Product / Eng' },
  { value: 'ops', label: 'Ops' },
  { value: 'unassigned', label: 'Unassigned (explicit)' },
]

export function DepartmentPicker({
  taskId,
  current,
}: {
  taskId: string
  current: Department | 'unassigned' | null
}) {
  const qc = useQueryClient()
  const [value, setValue] = useState<Department | 'unassigned' | ''>(
    current ?? '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(next: Department | 'unassigned' | '') {
    const prev = value
    setValue(next)
    setSaving(true)
    setError(null)
    const { error: err } = isCloverOpsId(taskId)
      ? await cloverOpsSupabase
          .from('cd_tasks')
          .update({ department: next === '' ? null : next })
          .eq('id', fromCloverOpsId(taskId))
      : await supabase
          .from('agent_tasks')
          .update({ department: next === '' ? null : next })
          .eq('id', taskId)
    setSaving(false)
    if (err) {
      setValue(prev)
      setError(err.message)
      return
    }
    // Nudge any task-list queries to refetch so the bars + cards reflect
    // the new department immediately, even if realtime is slow.
    qc.invalidateQueries({ queryKey: ['active-work'] })
    qc.invalidateQueries({ queryKey: ['blocked-tasks'] })
    qc.invalidateQueries({ queryKey: ['recently-shipped'] })
    qc.invalidateQueries({ queryKey: ['tasks-in-window'] })
    qc.invalidateQueries({ queryKey: ['item-detail'] })
  }

  return (
    <div className="flex items-center gap-3 text-[13px]">
      <select
        value={value}
        onChange={(e) =>
          handleChange(e.target.value as Department | 'unassigned' | '')
        }
        disabled={saving}
        className="px-2.5 py-1.5 rounded-md border border-cream-300 bg-cream-50 text-[13px] text-ink-900 focus:border-clover-500 outline-none disabled:opacity-50"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {saving && <span className="text-[11px] text-ink-400 italic">saving…</span>}
      {error && (
        <span className="text-[11px] text-rust-500 bg-ochre-100 border border-ochre-300 rounded px-1.5 py-0.5">
          {error}
        </span>
      )}
    </div>
  )
}
