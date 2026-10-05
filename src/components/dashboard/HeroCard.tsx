import { useTranslation } from 'react-i18next'

interface HeroCardProps {
  completedCount: number
  total: number
}

export default function HeroCard({ completedCount, total }: HeroCardProps) {
  const { t } = useTranslation()
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0

  return (
    <div className="glass rounded-xl p-6 shadow-lg inti-rays relative overflow-hidden">
      <div className="flex items-center gap-4">
        <img src="/logo.svg" alt="ED-python/bash" className="h-14 hidden sm:block" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            {t('dashboard.title')}
          </h1>
          <p className="text-[var(--text-secondary)]">{t('dashboard.welcome')}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-secondary)]">
        <span>{completedCount} {t('dashboard.of')} {total}</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-1 h-2.5 rounded-full overflow-hidden bg-[var(--bg-tertiary)]">
        <div
          className="h-full tricolor-bar transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
