/**
 * Heuristic: convert dense prose into markdown bullets when the text
 * looks like it's hiding a list. Designed to be defensive — if the input
 * already has markdown structure (a `- ` prefix, a `# ` header, a
 * fenced code block), we leave it alone.
 *
 * Rules:
 *   - "Header: a, b, and c" with ≥2 clauses after the colon → render
 *     "**Header:**" then a bullet list.
 *   - A sentence with ≥3 comma-separated clauses → render as bullets.
 *   - Sentences with leading dates ("2026-04-27:") → first sentence is
 *     pulled out as a summary line.
 *   - UUIDs (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) get backticks so the
 *     markdown renderer code-styles them.
 *
 * Designed to under-promise: if heuristics don't trigger we just return
 * the original text. Markdown renderer handles plain prose fine.
 */

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi

const HAS_MARKDOWN_RE =
  /(^|\n)\s*(#{1,6} |[-*+] |\d+\.\s|```|>\s|\|\s*[-:])/

const DATE_PREFIX_RE = /^\d{4}-\d{2}-\d{2}:\s*/

export function proseToMarkdown(input: string): string {
  if (!input) return input
  const trimmed = input.trim()
  if (!trimmed) return trimmed

  // If there's already markdown structure, just code-format UUIDs and
  // hand back. Don't try to "smart-bullet" markdown.
  if (HAS_MARKDOWN_RE.test(trimmed)) {
    return codeFormatIds(trimmed)
  }

  const paragraphs = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const out: string[] = []

  for (const paragraph of paragraphs) {
    out.push(transformParagraph(paragraph))
  }

  return out.join('\n\n')
}

function transformParagraph(text: string): string {
  // Pull off a leading date stamp as a small summary if present.
  let header: string | null = null
  let body = text
  const dateMatch = body.match(DATE_PREFIX_RE)
  if (dateMatch) {
    body = body.slice(dateMatch[0].length)
  }

  const sentences = splitSentences(body)
  const blocks: string[] = []
  if (dateMatch) {
    // First sentence becomes the summary header alongside the date
    const firstSentence = sentences.shift()
    if (firstSentence) {
      header = `**${dateMatch[0].trim()} ${firstSentence.replace(/[.!?]$/, '')}**`
    } else {
      header = `**${dateMatch[0].trim()}**`
    }
  }

  if (header) blocks.push(header)

  for (const sentence of sentences) {
    blocks.push(transformSentence(sentence))
  }

  return codeFormatIds(blocks.join('\n\n'))
}

function transformSentence(sentence: string): string {
  const clean = sentence.trim().replace(/[.!?]$/, '')
  if (!clean) return ''

  // "Header: a, b, and c" pattern
  const colonIdx = findColonOutsideBrackets(clean)
  if (colonIdx > 0 && colonIdx < clean.length - 1) {
    const head = clean.slice(0, colonIdx).trim()
    const rest = clean.slice(colonIdx + 1).trim()
    const items = splitClauses(rest)
    if (items.length >= 2 && head.length < 60) {
      const bullets = items.map((it) => `- ${capitalize(it)}`).join('\n')
      return `**${capitalize(head)}:**\n${bullets}`
    }
  }

  // Plain enumeration: ≥3 comma-separated clauses
  const items = splitClauses(clean)
  if (items.length >= 3) {
    return items.map((it) => `- ${capitalize(it)}`).join('\n')
  }

  // Otherwise: regular paragraph.
  return clean + '.'
}

function splitSentences(text: string): string[] {
  // Naive sentence split: period/exclaim/question followed by whitespace
  // and a capital letter. Tolerant of decimals and ellipses.
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function findColonOutsideBrackets(text: string): number {
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth--
    else if (c === ':' && depth === 0) return i
  }
  return -1
}

function splitClauses(text: string): string[] {
  // Split on commas at top-level depth, collapsing trailing "and " on the
  // last item. Preserves parenthesized content (UUIDs etc).
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth--

    if (depth === 0 && c === ',') {
      parts.push(current.trim())
      current = ''
      // skip space
      while (i + 1 < text.length && text[i + 1] === ' ') i++
      // skip a leading "and " on the next item
      if (text.slice(i + 1, i + 5).toLowerCase() === 'and ') i += 4
    } else {
      current += c
    }
  }
  if (current.trim()) parts.push(current.trim())
  return parts.map(stripLeadingAnd).filter(Boolean)
}

function stripLeadingAnd(s: string): string {
  return s.replace(/^and\s+/i, '').trim()
}

function capitalize(s: string): string {
  if (!s) return s
  return s[0].toUpperCase() + s.slice(1)
}

function codeFormatIds(text: string): string {
  return text.replace(UUID_RE, (m) => `\`${m}\``)
}
