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
    <header className="sticky top-0 z-50 glass border-x-0 border-t-0 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3">
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] transition-colors md:hidden"
              aria-label="Abrir menú"
            >
              <Icon name="menu" size={20} />
            </button>
          )}
          <img src="/logo.svg" alt="ED-python/bash" className="h-8 hidden sm:block" />
          <div>
            <h1 className="text-base md:text-lg font-bold text-[var(--accent)] leading-tight">
              ED-python/bash
            </h1>
            <p className="text-[10px] md:text-xs text-[var(--text-secondary)] leading-tight">
              by ED-Dev
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] transition-colors text-sm font-medium"
          >
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] transition-colors"
            aria-label={t('theme.toggle')}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={20} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] transition-colors"
            aria-label="Configuración"
          >
            <Icon name="settings" size={20} />
          </button>
        </div>
      </div>
      <Breadcrumb trail={trail} />
    </header>
  )
}
