import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, subtitle, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 ${className}`}
        {...props}
      >
        {title && (
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-[var(--text-secondary)] mb-4">{subtitle}</p>
        )}
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
