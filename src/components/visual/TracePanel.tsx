import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TraceStep } from '../../types/trace'
import { guessType } from '../../lib/pyTrace'
import { Button } from '../atoms'

interface TracePanelProps {
  code: string
  steps: TraceStep[]
}

/** Divide el código en líneas y marca cuál está activa en cada paso. */
function CodeView({ code, activeLine }: { code: string; activeLine: number }) {
  const lines = useMemo(() => code.split('\n'), [code])
  return (
    <div className="overflow-x-auto">
      <pre className="text-sm font-mono leading-6">
        {lines.map((line, i) => {
          const n = i + 1
          const active = n === activeLine
          return (
            <div
              key={n}
              className={`flex ${active ? 'bg-[var(--accent)]/15 text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
            >
              <span className="w-10 shrink-0 select-none text-right pr-3 opacity-60">{n}</span>
              <span className="whitespace-pre">{line || ' '}</span>
            </div>
          )
        })}
      </pre>
    </div>
  )
}

/** Cajas de memoria: nombre, valor y tipo deducido del repr.
 *  Resalta en ámbar las variables nuevas o cuyo valor cambió respecto al
 *  paso anterior (diff). En el paso 0 no se resalta nada (estado inicial). */
function MemoryView({ step, prevStep }: { step: TraceStep; prevStep?: TraceStep }) {
  const { t } = useTranslation()
  const entries = Object.entries(step.variables)
  if (entries.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)] italic">
        {t('trace.noVars')}
      </p>
    )
  }
  return (
    <ul className="space-y-1">
      {entries.map(([name, repr]) => {
        const prev = prevStep ? prevStep.variables[name] : undefined
        const changed = Boolean(prevStep) && (prev === undefined || prev !== repr)
        return (
          <li
            key={name}
            className={`flex items-center gap-2 rounded-md px-2 py-1 font-mono text-sm ${
              changed
                ? 'bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/50'
                : 'bg-[var(--bg-secondary)]'
            }`}
          >
            <span className="text-[var(--accent)] font-semibold">{name}</span>
            <span className="text-[var(--text-secondary)]">=</span>
            <span className="text-[var(--text-primary)] break-all">{repr}</span>
            <span className="ml-auto shrink-0 rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--text-secondary)]">
              {guessType(repr)}
            </span>
            {changed ? (
              <span
                aria-label={t('trace.changed')}
                title={t('trace.changed')}
                className="shrink-0 text-[var(--accent)]"
              >
                ●
              </span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export default function TracePanel({ code, steps }: TracePanelProps) {
  const { t } = useTranslation()
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<number | null>(null)

  const step = steps[stepIdx] ?? steps[steps.length - 1]
  const total = steps.length

  useEffect(() => {
    if (!playing) return
    timerRef.current = window.setInterval(() => {
      setStepIdx(prev => {
        if (prev >= total - 1) {
          setPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 900)
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
    }
  }, [playing, total])

  const goNext = () => setStepIdx(prev => Math.min(total - 1, prev + 1))
  const goPrev = () => setStepIdx(prev => Math.max(0, prev - 1))
  const restart = () => {
    setPlaying(false)
    setStepIdx(0)
  }
  const togglePlay = () => {
    if (!playing && stepIdx >= total - 1) setStepIdx(0)
    setPlaying(p => !p)
  }

  if (total === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">{t('trace.empty')}</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={goPrev} disabled={stepIdx === 0} aria-label={t('trace.prevStep')}>
          ←
        </Button>
        <Button variant="ghost" onClick={togglePlay} aria-label={playing ? t('trace.pause') : t('trace.play')}>
          {playing ? t('trace.pause') : t('trace.play')}
        </Button>
        <Button variant="ghost" onClick={goNext} disabled={stepIdx >= total - 1} aria-label={t('trace.nextStep')}>
          →
        </Button>
        <Button variant="ghost" onClick={restart}>
          {t('trace.restart')}
        </Button>
        <span className="ml-auto text-sm text-[var(--text-secondary)]">
          {t('trace.stepIndicator', { current: stepIdx + 1, total })}
        </span>
      </div>

      {step?.error ? (
        <div className="rounded-lg border border-[var(--error)]/40 bg-[var(--error)]/10 p-3">
          <p className="font-mono text-sm text-[var(--error)]">{step.error}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {t('trace.errorHint')}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-xl glass p-4">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
            {t('trace.code')}
          </h3>
          <CodeView code={code} activeLine={step?.lineno ?? -1} />
        </section>

        <section className="rounded-xl glass p-4">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
            {t('trace.memory')}
          </h3>
          <MemoryView
            step={step ?? { lineno: -1, variables: {}, output: [] }}
            prevStep={stepIdx > 0 ? steps[stepIdx - 1] : undefined}
          />
        </section>
      </div>

      <section className="rounded-xl glass p-4">
        <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          {t('trace.output')}
        </h3>
        <div
          aria-live="polite"
          className="min-h-16 rounded-lg bg-[var(--code-bg)] p-3 font-mono text-sm text-[var(--code-text)]"
        >
          {step?.output.length ? (
            step.output.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap">{line}</div>
            ))
          ) : (
            <span className="text-[var(--text-secondary)]">{t('trace.noOutput')}</span>
          )}
        </div>
      </section>
    </div>
  )
}
