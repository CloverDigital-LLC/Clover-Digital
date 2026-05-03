import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { normalizeHumanText, proseToMarkdown } from './proseToMarkdown'

interface Props {
  /** The raw text. May be markdown, may be prose, may be a stack trace. */
  text: string | null | undefined
  /**
   * Visual variant. `default` is editorial prose (rendered as markdown
   * via the smart-bullet heuristic). `code` keeps a mono container —
   * useful for log/code output where the structure matters. `error`
   * keeps everything raw on a rust-colored mono pre because errors are
   * almost always more useful exact than reformatted.
   */
  variant?: 'default' | 'code' | 'error'
  className?: string
}

/**
 * HumanText — renders prose as readable markdown by default, with the
 * smart-bullet heuristic kicking in for dense agent prose. Errors stay
 * raw, code stays raw. Everything else gets the friendly treatment.
 */
export function HumanText({ text, variant = 'default', className = '' }: Props) {
  const normalizedText = useMemo(() => (text ? normalizeHumanText(text) : ''), [text])

  const rendered = useMemo(() => {
    if (!normalizedText) return null
    if (variant !== 'default') return null
    return proseToMarkdown(normalizedText)
  }, [normalizedText, variant])

  if (!text) return null

  if (variant === 'error' || variant === 'code') {
    const base =
      variant === 'error'
        ? 'whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-rust-500 bg-ochre-100/50 border border-ochre-300/70 rounded-md p-3'
        : 'whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-ink-700 bg-cream-100 border border-cream-300/70 rounded-md p-3 max-h-[420px] overflow-auto scroll-soft'
    return <pre className={`${base} ${className}`}>{text}</pre>
  }

  return (
    <div className={`prose-clover ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="text-[13.5px] leading-relaxed text-ink-700 mb-2 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1 text-[13.5px] leading-relaxed text-ink-700 mb-2 last:mb-0 marker:text-clover-500">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1 text-[13.5px] leading-relaxed text-ink-700 mb-2 last:mb-0 marker:text-clover-500">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          h1: ({ children }) => (
            <h4 className="font-display text-[16px] text-ink-900 leading-snug mt-3 mb-1.5">
              {children}
            </h4>
          ),
          h2: ({ children }) => (
            <h4 className="font-display text-[15px] text-ink-900 leading-snug mt-3 mb-1.5">
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className="font-display text-[14px] text-ink-900 leading-snug mt-2.5 mb-1">
              {children}
            </h5>
          ),
          strong: ({ children }) => (
            <strong className="font-medium text-ink-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-ink-700">{children}</em>
          ),
          code: ({ children, ...props }) => {
            const isInline = !('inline' in props) || props.inline !== false
            if (isInline) {
              return (
                <code className="font-mono text-[12px] px-1 py-0.5 rounded bg-cream-200 text-ink-900">
                  {children}
                </code>
              )
            }
            return (
              <code className="font-mono text-[12px] block bg-cream-100 border border-cream-300/70 rounded-md p-3 overflow-auto scroll-soft">
                {children}
              </code>
            )
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-clover-700 underline decoration-clover-300 hover:decoration-clover-500"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-clover-300 pl-3 italic text-ink-500 my-2">
              {children}
            </blockquote>
          ),
        }}
      >
        {rendered ?? ''}
      </ReactMarkdown>
    </div>
  )
}
