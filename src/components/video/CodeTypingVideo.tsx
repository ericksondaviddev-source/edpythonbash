import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Icon } from '../atoms'

interface CodeTypingVideoProps {
  code: string
  speed?: number
  ascii3d?: {
    enabled: boolean
    type: 'intro' | 'outro' | 'transition'
    duration?: number
  }
  onComplete?: () => void
}

interface Chapter {
  title: string
  code: string
}

function parseChapters(code: string): Chapter[] {
  const lines = code.split('\n')
  const chapters: Chapter[] = []
  const chunkSize = Math.ceil(lines.length / 3)

  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize).join('\n')
    chapters.push({
      title: `Parte ${Math.floor(i / chunkSize) + 1}`,
      code: chunk
    })
  }

  return chapters
}

export default function CodeTypingVideo({
  code,
  speed = 30,
  ascii3d,
  onComplete
}: CodeTypingVideoProps) {
  const { t } = useTranslation()
  const [displayedCode, setDisplayedCode] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [, setIsComplete] = useState(false)
  const [showAscii, setShowAscii] = useState(false)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const chapters = parseChapters(code)

  useEffect(() => {
    if (ascii3d?.enabled && ascii3d.type === 'intro') {
      setShowAscii(true)
      const timer = setTimeout(() => {
        setShowAscii(false)
        startTyping()
      }, ascii3d.duration || 3000)
      return () => clearTimeout(timer)
    } else {
      startTyping()
    }
  }, [])

  const startTyping = () => {
    setIsTyping(true)
    setIsComplete(false)
    setIsPlaying(true)
    let index = 0
    const chapterCode = chapters[currentChapter]?.code || code

    intervalRef.current = window.setInterval(() => {
      if (index < chapterCode.length) {
        setDisplayedCode(chapterCode.slice(0, index + 1))
        index++
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        setIsTyping(false)
        setIsComplete(true)
        setIsPlaying(false)
        onComplete?.()
      }
    }, speed)
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      setIsPlaying(false)
    } else {
      startTyping()
    }
  }

  const handleSkip = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setDisplayedCode(chapters[currentChapter]?.code || code)
    setIsTyping(false)
    setIsComplete(true)
    setShowAscii(false)
    setIsPlaying(false)
    onComplete?.()
  }

  const handleChapterChange = (index: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setCurrentChapter(index)
    setDisplayedCode('')
    setIsTyping(false)
    setIsComplete(false)
    setIsPlaying(false)
    setTimeout(() => startTyping(), 100)
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'codigo.py'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)]">
      <div className="px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-secondary)]">{t('video.title')}</span>
        <div className="flex items-center gap-2">
          {isTyping && (
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              {t('video.skip')}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Icon name="download" size={14} />
          </Button>
        </div>
      </div>

      <div className="bg-[var(--code-bg)] p-4 min-h-[200px]">
        {showAscii && (
          <div className="flex items-center justify-center h-[200px]">
            <Ascii3D />
          </div>
        )}
        {!showAscii && (
          <pre className="text-sm font-mono">
            <code className="text-[var(--code-text)]">
              {displayedCode}
              {isTyping && <span className="code-cursor">|</span>}
            </code>
          </pre>
        )}
      </div>

      <div className="px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2">
            {chapters.map((chapter, index) => (
              <button
                key={index}
                onClick={() => handleChapterChange(index)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  currentChapter === index
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                }`}
              >
                {chapter.title}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={handlePlayPause}>
            {isPlaying ? <Icon name="pause" size={14} /> : <Icon name="play" size={14} />}
            {isPlaying ? 'Pausar' : 'Reproducir'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Ascii3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let rotation = 0

    const draw = () => {
      ctx.fillStyle = '#1E1E2E'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const chars = ' .:-=+*#%@'
      const size = 20
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      for (let i = -5; i <= 5; i++) {
        for (let j = -5; j <= 5; j++) {
          const x = i * size
          const y = j * size

          const rotatedX = x * Math.cos(rotation) - y * Math.sin(rotation)
          const rotatedY = x * Math.sin(rotation) + y * Math.cos(rotation)

          const depth = Math.sin(rotatedX * 0.01) + Math.cos(rotatedY * 0.01)
          const charIndex = Math.floor((depth + 2) / 4 * (chars.length - 1))

          ctx.fillStyle = '#CDD6F4'
          ctx.font = '12px monospace'
          ctx.fillText(chars[charIndex], centerX + rotatedX, centerY + rotatedY)
        }
      }

      rotation += 0.02
      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} width={400} height={200} />
}
