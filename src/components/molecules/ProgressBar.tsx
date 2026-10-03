interface ProgressBarProps {
  value: number
  max: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ProgressBar({
  value,
  max,
  label,
  showPercentage = true,
  size = 'md'
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between mb-1 text-sm">
          {label && <span className="text-[var(--text-secondary)]">{label}</span>}
          {showPercentage && <span className="text-[var(--text-secondary)]">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full ${sizes[size]} bg-[var(--bg-tertiary)] rounded-full overflow-hidden`}>
        <div
          className="h-full bg-[var(--accent)] transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
