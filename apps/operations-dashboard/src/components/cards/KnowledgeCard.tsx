import { useMemo, useState } from 'react'
import { Card, EmptyState } from '../atoms'
import { SortMenu } from '../atoms/SortMenu'
import { useKnowledge } from '../../hooks/useKnowledge'
import { relTime } from '../../lib/adapters'
import { useDetail } from '../Detail/DetailContext'
import {
  sortKnowledge,
  type KnowledgeSortKey,
  KNOWLEDGE_SORT_OPTIONS,
} from '../../lib/sorting'

const CAT_LABEL: Record<string, string> = {
  decision: 'Decision',
  research: 'Research',
  insight: 'Insight',
}
const CAT_COLOR: Record<string, string> = {
  decision: 'text-clover-800 border-clover-300',
  research: 'text-ink-700 border-cream-300',
  insight: 'text-ochre-500 border-ochre-300',
}

export function KnowledgeCard() {
  const { data = [], isLoading } = useKnowledge(6)
  const { open } = useDetail()
  const [sortKey, setSortKey] = useState<KnowledgeSortKey>('newest')
  const sorted = useMemo(() => sortKnowledge(data, sortKey), [data, sortKey])
  return (
    <Card
      title="Decisions & research"
      scrollBody
      className="h-full"
      action={
        <SortMenu value={sortKey} options={KNOWLEDGE_SORT_OPTIONS} onChange={setSortKey} />
      }
      footer={
        <>
          <span>Latest entries</span>
          <span>{isLoading ? 'Loading…' : `${data.length} shown`}</span>
        </>
      }
    >
      {data.length === 0 && !isLoading ? (
        <EmptyState icon="·" line="No recent entries." sub="Log a decision when one happens." />
      ) : (
        <ul className="space-y-4">
          {sorted.map((k) => (
            <li
              key={k.id}
              title={`${k.title}\n\n${k.content}`}
              role="button"
              tabIndex={0}
              onClick={() => open({ kind: 'knowledge', id: k.id })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  open({ kind: 'knowledge', id: k.id })
                }
              }}
              className="cursor-pointer hover:bg-cream-100/70 -mx-2 px-2 py-1 rounded-md transition"
            >
              <div className="flex items-center gap-2 mb-1 whitespace-nowrap">
                <span
                  className={`text-[10px] uppercase tracking-[0.1em] font-medium px-1.5 py-0.5 rounded border ${
                    CAT_COLOR[k.category] ?? 'text-ink-500 border-cream-300'
                  }`}
                >
                  {CAT_LABEL[k.category] ?? k.category}
                </span>
                <span className="text-[11px] text-ink-400 whitespace-nowrap">· {k.project}</span>
                <span className="text-[11px] text-ink-400 ml-auto whitespace-nowrap">
                  {relTime(k.created_at)}
                </span>
              </div>
              <div className="font-display text-[15px] text-ink-900 leading-snug">{k.title}</div>
              <div className="text-[12.5px] text-ink-500 leading-snug mt-0.5 line-clamp-1">
                {k.content}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
