import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lesson } from '../../types'
import { tracePython } from '../../lib/pyTrace'
import type { TraceStep } from '../../types/trace'
import TracePanel from '../visual/TracePanel'
import IframePreview from '../visual/IframePreview'
import { Button } from '../atoms'

type LessonLang = 'python' | 'bash' | 'html'

function getLessonLanguage(lesson: Lesson): LessonLang {
  if (lesson.id.startsWith('M3.7')) return 'bash'
  if (lesson.id.startsWith('F0.2') || lesson.id.startsWith('F0.3')) return 'html'
  return 'python'
}

export default function VisualTab({ lesson }: { lesson: Lesson }) {
  const { t } = useTranslation()
  const lang = getLessonLanguage(lesson)
  const [steps, setSteps] = useState<TraceStep[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTrace = async () => {
    setLoading(true)
    setError(null)
    setSteps([])
    try {
      const result = await tracePython(lesson.codigo_corregido)
      setSteps(result)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  if (lang === 'html') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">
          {t('visual.htmlHint')}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--error)]">
              {t('lesson.brokenCode')}
            </h3>
            <IframePreview code={lesson.codigo_roto} title={t('lesson.brokenCode')} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--success)]">
              {t('lesson.fixedCode')}
            </h3>
            <IframePreview code={lesson.codigo_corregido} title={t('lesson.fixedCode')} />
          </div>
        </div>
      </div>
    )
  }

  if (lang === 'bash') {
    return (
      <div className="rounded-xl glass p-6 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          {t('visual.bashComingSoon')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={runTrace} disabled={loading}>
          {loading ? t('visual.running') : t('visual.runTrace')}
        </Button>
        <p className="text-sm text-[var(--text-secondary)]">
          {t('visual.pythonHint')}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-[var(--error)]/40 bg-[var(--error)]/10 p-3">
          <p className="font-mono text-sm text-[var(--error)]">{error}</p>
        </div>
      ) : null}

      {steps.length > 0 ? (
        <TracePanel code={lesson.codigo_corregido} steps={steps} />
      ) : (
        !loading && (
          <div className="rounded-xl glass p-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              {t('visual.pressRun')}
            </p>
          </div>
        )
      )}
    </div>
  )
}
