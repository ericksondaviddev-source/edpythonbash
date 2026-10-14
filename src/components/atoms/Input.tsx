import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-[140ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--bg-primary)] focus:shadow-[var(--shadow-focus)] ${
            error ? 'border-[var(--error)]' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-[13px] text-[var(--error)]">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
