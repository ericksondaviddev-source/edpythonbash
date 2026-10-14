import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] press focus-ring ' +
      'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ' +
      'select-none whitespace-nowrap'

    const variants = {
      primary:
        'bg-[var(--accent)] text-[var(--accent-ink)] shadow-apple-sm hover:shadow-apple-md hover:bg-[var(--accent-hover)] active:bg-[var(--accent)]',
      secondary:
        'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] shadow-apple-xs hover:bg-[var(--border)] hover:border-[var(--border-strong)]',
      ghost:
        'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
      danger:
        'bg-[var(--danger)] text-white shadow-apple-sm hover:opacity-90 active:opacity-100'
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-[13px] gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-[15px] gap-2'
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export default Button
