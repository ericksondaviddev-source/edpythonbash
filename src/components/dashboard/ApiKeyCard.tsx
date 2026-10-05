import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../atoms'

interface ApiKeyCardProps {
  onOpenSettings?: () => void
}

export default function ApiKeyCard({ onOpenSettings }: ApiKeyCardProps) {
  const { t } = useTranslation()
  const [hasKey] = useState(() => Boolean(localStorage.getItem('openrouter_api_key')))

  return (
    <div className="glass rounded-xl p-6 shadow-lg flex flex-col justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          {t('dashboard.apiKeyTitle')}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {t('dashboard.apiKeyDesc')}
        </p>
      </div>
      {hasKey ? (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--success)]">
          ✓ {t('dashboard.apiKeyConnected')}
        </span>
      ) : (
        <Button onClick={onOpenSettings} disabled={!onOpenSettings}>
          {t('dashboard.apiKeySetup')}
        </Button>
      )}
    </div>
  )
}
