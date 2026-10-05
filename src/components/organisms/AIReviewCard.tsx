import { useState } from 'react'
import { useAI } from '../../hooks/useAI'
import { useTranslation } from 'react-i18next'
import { Button } from '../atoms'

interface AIReviewCardProps {
  code: string
  language: 'python' | 'bash'
}

export default function AIReviewCard({ code, language }: AIReviewCardProps) {
  const { t } = useTranslation()
  const [review, setReview] = useState<string | null>(null)
  const [needsCode, setNeedsCode] = useState(false)
  const { chat, isLoading, error } = useAI()

  const handleReview = async () => {
    if (!code.trim()) {
      setNeedsCode(true)
      setTimeout(() => setNeedsCode(false), 3000)
      return
    }
    setNeedsCode(false)
    setReview(null)

    const response = await chat([
      {
        role: 'system',
        content: t('aiReview.systemPrompt')
      },
      {
        role: 'user',
        content: t('aiReview.userPrompt', {
          language: language === 'bash' ? 'Bash' : 'Python',
          langCode: language,
          code
        })
      }
    ])

    setReview(response)
  }

  return (
    <div className="mt-4 border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-[var(--bg-secondary)] flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{t('aiReview.title')}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            {t('aiReview.flow')}
          </p>
        </div>
        <Button onClick={handleReview} disabled={isLoading} size="sm">
          {isLoading ? t('aiReview.reviewing') : t('aiReview.review')}
        </Button>
      </div>

      {needsCode && (
        <div className="px-4 py-2 bg-[var(--warning)]/10">
          <p className="text-xs text-[var(--warning)]">
            {t('aiReview.needsCode')}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="px-4 py-4">
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-3/4" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-2/3" />
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-[var(--error)]/10">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      {review && !isLoading && (
        <div className="px-4 py-4 bg-[var(--bg-primary)]">
          <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">
            {review}
          </pre>
        </div>
      )}
    </div>
  )
}
