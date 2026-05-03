import { Link } from 'wouter'
import { DEPARTMENTS } from '../lib/departments'
import type { Department } from '../lib/types'

export function DepartmentNav({ active }: { active?: Department | null }) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-1">
      {DEPARTMENTS.map((department) => (
        <Link key={department.id} href={`/departments/${department.slug}`}>
          <a
            className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition ${
              active === department.id
                ? 'border-clover-300 bg-clover-50 text-clover-800 font-medium'
                : 'border-cream-300 bg-cream-50 text-ink-500 hover:text-ink-900 hover:border-clover-200'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${department.accent}`} />
            {department.label}
          </a>
        </Link>
      ))}
    </nav>
  )
}
