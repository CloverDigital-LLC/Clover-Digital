import { useId } from 'react'

export interface SortOption<K extends string = string> {
  value: K
  label: string
}

interface Props<K extends string = string> {
  value: K
  options: SortOption<K>[]
  onChange: (value: K) => void
  /** Compact label inside the pill ("Sort", "Order by", etc). */
  label?: string
  className?: string
}

/**
 * Brand-styled native `<select>` — keyboard accessible by default,
 * looks like a Card action pill. Used in card headers in place of
 * the "See all →" link when sorting is more useful.
 */
export function SortMenu<K extends string = string>({
  value,
  options,
  onChange,
  label = 'Sort',
  className = '',
}: Props<K>) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={`relative inline-flex items-center gap-1 text-[12px] text-clover-700 dark:text-clover-300 hover:text-clover-800 dark:hover:text-clover-200 cursor-pointer ${className}`}
    >
      <span className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
        {label}
      </span>
      <span className="relative inline-flex items-center">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as K)}
          className="appearance-none bg-transparent pr-4 pl-1 py-0.5 text-[12px] text-ink-700 dark:text-clover-200 hover:text-ink-900 dark:hover:text-cream-50 cursor-pointer focus:outline-none"
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-cream-50 dark:bg-night-800 text-ink-900"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-ink-400"
          width="9"
          height="9"
          viewBox="0 0 10 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  )
}
