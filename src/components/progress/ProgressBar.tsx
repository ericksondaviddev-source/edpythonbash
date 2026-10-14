import { useTranslation } from 'react-i18next'

interface ProgressBarProps {
  xp: number
  level: number
  streak: number
  lessonsCompleted: number
  totalLessons: number
}

export default function ProgressBar({ xp, level, streak, lessonsCompleted, totalLessons }: ProgressBarProps) {
  const { t } = useTranslation()
  const progressPercent = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0

  return (
    <div className="p-6 rounded-[var(--radius-lg)] glass shadow-apple-md">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { value: xp, label: t('dashboard.xp') },
          { value: level, label: t('dashboard.level') },
          { value: streak, label: `${t('dashboard.streak')} (${t('dashboard.days')})` },
          { value: `${progressPercent}%`, label: t('dashboard.lessonsCompleted') },
        ].map((stat, i) => (
          <div
            key={i}
            className="text-center p-4 rounded-[var(--radius-md)] bg-[var(--bg-secondary)]/70 border border-[var(--border)]"
          >
            <div className="text-display text-[26px] text-[var(--accent)] leading-none">{stat.value}</div>
            <div className="mt-1.5 text-[12px] font-medium text-[var(--text-secondary)] leading-tight">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[12px] font-medium text-[var(--text-secondary)]">
          <span>{lessonsCompleted} {t('dashboard.of')} {totalLessons}</span>
          <span>{progressPercent}%</span>
        </div>
      </div>
    </div>
  )
}
