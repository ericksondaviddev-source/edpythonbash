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
    <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--accent)]">{xp}</div>
          <div className="text-sm text-[var(--text-secondary)]">{t('dashboard.xp')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--accent)]">{level}</div>
          <div className="text-sm text-[var(--text-secondary)]">{t('dashboard.level')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--accent)]">{streak}</div>
          <div className="text-sm text-[var(--text-secondary)]">{t('dashboard.streak')} ({t('dashboard.days')})</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--accent)]">{progressPercent}%</div>
          <div className="text-sm text-[var(--text-secondary)]">{t('dashboard.lessonsCompleted')}</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-[var(--text-secondary)]">
          <span>{lessonsCompleted} {t('dashboard.of')} {totalLessons}</span>
          <span>{progressPercent}%</span>
        </div>
      </div>
    </div>
  )
}
