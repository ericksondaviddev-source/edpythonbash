import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
}

export default function Breadcrumb({ trail }: { trail: Crumb[] }) {
  if (trail.length <= 1) return null
  return (
    <nav aria-label="breadcrumb" className="px-4 md:px-6 pb-2">
      <ol className="flex items-center gap-1 text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-nowrap">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true" className="opacity-60">/</span>}
              {crumb.to && !last ? (
                <Link to={crumb.to} className="hover:text-[var(--accent)] transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'text-[var(--text-primary)] font-medium' : ''}>
                  {crumb.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
