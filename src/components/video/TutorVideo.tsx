import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Icon } from '../atoms'
import { useAudio } from '../../hooks/useAudio'
import type { TutorStep } from '../../lib/tutorScript'

interface TutorVideoProps {
  steps: TutorStep[]
  title?: string
  speed?: number
  voiceLang?: 'es' | 'en'
}

/** Pausa tras cada narración: base + por palabra (voz ~150ppm en español). */
export const NARRATION_BASE_MS = 1500
export const NARRATION_PER_WORD_MS = 350

export function narrationMs(narration: string): number {
  const words = narration.trim() === '' ? 0 : narration.trim().split(/\s+/).length
  return NARRATION_BASE_MS + words * NARRATION_PER_WORD_MS
}

export default function TutorVideo({ steps, title, speed = 30, voiceLang = 'es' }: TutorVideoProps) {
  const { t } = useTranslation()
  const { play, stop } = useAudio()
  const [stepIdx, setStepIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState<'typing' | 'narrating' | 'done'>('typing')
  const [playing, setPlaying] = useState(true)
  const [voiceOn, setVoiceOn] = useState(true)
  const intervalRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const voiceRef = useRef(voiceOn)
  voiceRef.current = voiceOn

  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const startStep = useCallback(
    (idx: number) => {
      const step = steps[idx]
      if (!step) return
      clearTimers()
      stop()
      setStepIdx(idx)
      setTyped('')
      setPhase('typing')
      setPlaying(true)
      let i = 0
      intervalRef.current = window.setInterval(() => {
        if (i < step.code.length) {
          i++
          setTyped(step.code.slice(0, i))
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current)
          intervalRef.current = null
          setPhase('narrating')
          if (voiceRef.current && step.narration.trim() !== '') {
            stop()
            play(step.narration, voiceLang)
          }
          timeoutRef.current = window.setTimeout(() => {
            if (idx + 1 < steps.length) startStep(idx + 1)
            else {
              setPhase('done')
              setPlaying(false)
            }
          }, narrationMs(step.narration))
        }
      }, speed)
    },
    [steps, speed, voiceLang, play, stop]
  )

  useEffect(() => {
    if (steps.length > 0) startStep(0)
    return () => {
      clearTimers()
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (steps.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">{t('tutor.empty')}</p>
  }

  const step = steps[stepIdx]
  const showNarration = typed === step.code

  const handlePlayPause = () => {
    if (playing) {
      clearTimers()
      stop()
      setPlaying(false)
    } else {
      startStep(stepIdx)
    }
  }

  const handleSkip = () => {
    clearTimers()
    stop()
    const last = steps[steps.length - 1]
    setStepIdx(steps.length - 1)
    setTyped(last.code)
    setPhase('done')
    setPlaying(false)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)]">
      <div className="px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          {title ?? t('tutor.title')}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">
            {t('tutor.stepOf', { current: stepIdx + 1, total: steps.length })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (voiceOn) stop()
              setVoiceOn(v => !v)
            }}
            aria-label={voiceOn ? t('tutor.voiceOff') : t('tutor.voiceOn')}
          >
            <Icon name={voiceOn ? 'volume' : 'mute'} size={14} />
            {t('tutor.voice')}
          </Button>
        </div>
      </div>

      <div className="bg-[var(--code-bg)] p-4 min-h-[200px]">
        <pre className="text-sm font-mono">
          <code className="text-[var(--code-text)]">
            {typed}
            {phase === 'typing' && playing && <span className="code-cursor">|</span>}
          </code>
        </pre>
        {showNarration && step.narration.trim() !== '' && (
          <div
            aria-live="polite"
            className="mt-3 flex gap-2 items-start rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3"
          >
            <Icon name="chat" size={16} className="mt-0.5 flex-shrink-0 text-[var(--accent)]" />
            <p className="text-sm text-[var(--text-primary)]">{step.narration}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={stepIdx === 0}
            onClick={() => startStep(stepIdx - 1)}
            aria-label={t('tutor.prev')}
          >
            <Icon name="prev" size={14} />
            {t('tutor.prev')}
          </Button>
          <Button variant="primary" size="sm" onClick={handlePlayPause}>
            <Icon name={playing ? 'pause' : 'play'} size={14} />
            {playing ? t('tutor.pause') : t('tutor.play')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={stepIdx >= steps.length - 1}
            onClick={() => startStep(stepIdx + 1)}
            aria-label={t('tutor.next')}
          >
            <Icon name="next" size={14} />
            {t('tutor.next')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => startStep(0)} aria-label={t('tutor.restart')}>
            <Icon name="restart" size={14} />
          </Button>
        </div>
        {phase !== 'done' && (
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            {t('video.skip')}
          </Button>
        )}
      </div>
    </div>
  )
}
