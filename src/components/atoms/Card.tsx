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
        className={`glass rounded-[var(--radius-lg)] p-6 shadow-apple-md ${className}`}
        {...props}
      >
        {title && (
          <h3 className="text-[17px] font-semibold tracking-[var(--tracking-tight)] text-[var(--text-primary)] mb-2">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] mb-4">{subtitle}</p>
        )}
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
