import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Icon } from '../atoms'

interface AudioPlayerProps {
  script: string
  lang: 'es' | 'en'
  autoPlay?: boolean
}

interface Chapter {
  title: string
  text: string
}

function parseChapters(script: string): Chapter[] {
  const sentences = script.split(/[.!?]+/).filter(s => s.trim())
  const chapters: Chapter[] = []
  const chunkSize = Math.ceil(sentences.length / 3)

  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize).join('. ').trim()
    chapters.push({
      title: `Parte ${Math.floor(i / chunkSize) + 1}`,
      text: chunk + '.'
    })
  }

  return chapters
}

export default function AudioPlayer({ script, lang }: AudioPlayerProps) {
  const { t } = useTranslation()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [speed, setSpeed] = useState(1)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const chapters = parseChapters(script)

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  const playChapter = (chapterIndex: number) => {
    if (isPlaying) {
      window.speechSynthesis.pause()
      setIsPlaying(false)
      return
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsPlaying(true)
      return
    }

    setIsLoading(true)
    setCurrentChapter(chapterIndex)

    const utterance = new SpeechSynthesisUtterance(chapters[chapterIndex].text)
    utterance.lang = lang === 'es' ? 'es-ES' : 'en-US'
    utterance.rate = speed
    utterance.pitch = 1

    utterance.onend = () => {
      if (chapterIndex < chapters.length - 1) {
        playChapter(chapterIndex + 1)
      } else {
        setIsPlaying(false)
        setIsLoading(false)
      }
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setIsLoading(false)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
    setIsLoading(false)
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5]
    const currentIndex = speeds.indexOf(speed)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    setSpeed(nextSpeed)
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setTimeout(() => playChapter(currentChapter), 100)
    }
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--text-primary)]">{t('lesson.audio')}</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={changeSpeed}>
            {speed}x
          </Button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {chapters.map((chapter, index) => (
          <button
            key={index}
            onClick={() => playChapter(index)}
            className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
              currentChapter === index
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
            }`}
          >
            <div className="flex items-center gap-2">
              {currentChapter === index && isPlaying ? (
                <Icon name="pause" size={14} />
              ) : (
                <Icon name="play" size={14} />
              )}
              <span className="text-sm">{chapter.title}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => playChapter(currentChapter)}
          disabled={isLoading}
          className="p-3 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {isPlaying ? (
            <Icon name="pause" size={20} />
          ) : (
            <Icon name="play" size={20} />
          )}
        </button>
        <button
          onClick={stop}
          className="p-3 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
        >
          <Icon name="stop" size={20} />
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {chapters[currentChapter]?.title}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {isPlaying ? 'Reproduciendo...' : isLoading ? 'Cargando...' : 'Listo'}
          </p>
        </div>
      </div>
    </div>
  )
}
