import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lesson } from '../../types'
import { tracePython } from '../../lib/pyTrace'
import type { TraceStep } from '../../types/trace'
import TracePanel from '../visual/TracePanel'
import IframePreview from '../visual/IframePreview'
import { Button } from '../atoms'

type LessonLang = 'python' | 'bash' | 'html' | 'js'

function getLessonLanguage(lesson: Lesson): LessonLang {
  if (lesson.id.startsWith('M3.7')) return 'bash'
  if (lesson.id.startsWith('F0.3')) return 'js'
  if (lesson.id.startsWith('F0.2')) return 'html'
  return 'python'
}

export default function VisualTab({ lesson }: { lesson: Lesson }) {
  const { t } = useTranslation()
  const lang = getLessonLanguage(lesson)
  const [steps, setSteps] = useState<TraceStep[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jsOutput, setJsOutput] = useState<string | null>(null)
  const [jsError, setJsError] = useState<string | null>(null)
  const [jsLoading, setJsLoading] = useState(false)

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

  const runJs = async () => {
    setJsLoading(true)
    setJsError(null)
    setJsOutput('')
    try {
      const { getJsEngine } = await import('../../services/jsEngine')
      const result = await getJsEngine().run(lesson.codigo_corregido)
      setJsOutput(result.output)
      if (result.error) setJsError(result.error)
    } catch (e: any) {
      setJsError(e?.message ?? String(e))
    } finally {
      setJsLoading(false)
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

  if (lang === 'js') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={runJs} disabled={jsLoading}>
            {jsLoading ? t('visual.running') : t('visual.runJs')}
          </Button>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('visual.jsHint')}
          </p>
        </div>

        {jsError ? (
          <div className="rounded-lg border border-[var(--error)]/40 bg-[var(--error)]/10 p-3">
            <p className="font-mono text-sm text-[var(--error)]">{jsError}</p>
          </div>
        ) : null}

        {jsOutput ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
              {t('visual.jsConsole')}
            </h3>
            <pre className="rounded-lg bg-[var(--code-bg)] p-4 font-mono text-sm text-[var(--code-text)] whitespace-pre-wrap">
              {jsOutput}
            </pre>
          </div>
        ) : jsOutput !== null && !jsError ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
            <p className="text-sm text-[var(--text-secondary)]">{t('visual.jsNoOutput')}</p>
          </div>
        ) : (
          !jsLoading && (
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
