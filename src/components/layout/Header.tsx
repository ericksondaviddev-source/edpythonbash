import { useThemeStore } from '../../store/useThemeStore'
import { useLanguageStore } from '../../store/useLanguageStore'
import { useTranslation } from 'react-i18next'
import { Icon } from '../atoms'
import Breadcrumb, { type Crumb } from '../molecules/Breadcrumb'

interface HeaderProps {
  onOpenSettings: () => void
  onOpenMenu?: () => void
  trail?: Crumb[]
}

export default function Header({ onOpenSettings, onOpenMenu, trail = [] }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore()
  const { lang, toggleLanguage } = useLanguageStore()
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-50 glass border-x-0 border-t-0 border-b border-[var(--border-glass)] px-4 md:px-6 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 md:gap-3">
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="p-2 rounded-[var(--radius-sm)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] press hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] md:hidden"
              aria-label={t('header.openMenu')}
            >
              <Icon name="menu" size={20} />
            </button>
          )}
          <img src="/logo.svg" alt="ED-python/bash" className="h-8 hidden sm:block" />
          <div>
            <h1 className="text-[15px] md:text-base font-semibold tracking-[var(--tracking-tight)] text-[var(--accent)] leading-tight">
              ED-python/bash
            </h1>
            <p className="text-[10px] md:text-[11px] text-[var(--text-tertiary)] leading-tight font-medium">
              by ED-Dev
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 rounded-[var(--radius-full)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] press hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] hover:border-[var(--accent)] text-[13px] font-semibold tracking-wide"
          >
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-[var(--radius-full)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] press hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] hover:border-[var(--accent)]"
            aria-label={t('theme.toggle')}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-[var(--radius-full)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] press hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] hover:border-[var(--accent)]"
            aria-label={t('header.settings')}
          >
            <Icon name="settings" size={18} />
          </button>
        </div>
      </div>
      <Breadcrumb trail={trail} />
    </header>
  )
}
