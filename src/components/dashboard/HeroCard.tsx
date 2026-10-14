import { useTranslation } from 'react-i18next'

interface HeroCardProps {
  completedCount: number
  total: number
}

export default function HeroCard({ completedCount, total }: HeroCardProps) {
  const { t } = useTranslation()
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0

  return (
    <div className="glass rounded-[var(--radius-xl)] p-6 shadow-apple-lg inti-rays relative overflow-hidden">
      <div className="flex items-center gap-4">
        <img src="/logo.svg" alt="ED-python/bash" className="h-14 hidden sm:block" />
        <div>
          <h1 className="text-display text-[26px] md:text-[32px] text-[var(--text-primary)]">
            {t('dashboard.title')}
          </h1>
          <p className="text-[var(--text-secondary)] text-[15px]">{t('dashboard.welcome')}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between text-[13px] font-medium text-[var(--text-secondary)]">
        <span>{completedCount} {t('dashboard.of')} {total}</span>
        <span className="font-semibold text-[var(--accent)]">{percent}%</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full overflow-hidden bg-[var(--bg-tertiary)]">
        <div
          className="h-full tricolor-bar transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
