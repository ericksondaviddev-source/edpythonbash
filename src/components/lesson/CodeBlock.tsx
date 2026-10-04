import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface CodeBlockProps {
  code: string
  language: 'python' | 'bash' | 'html' | 'css'
  title?: string
  animate?: boolean
  speed?: number
  onRun?: () => void
  runnable?: boolean
}

export default function CodeBlock({
  code,
  title,
  animate = false,
  speed = 30,
  onRun,
  runnable = false
}: CodeBlockProps) {
  const { t } = useTranslation()
  const [displayedCode, setDisplayedCode] = useState(animate ? '' : code)
  const [isTyping, setIsTyping] = useState(false)
  const [, setIsComplete] = useState(!animate)
  const [copied, setCopied] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!animate) {
      setDisplayedCode(code)
      setIsComplete(true)
      return
    }

    setIsTyping(true)
    setIsComplete(false)
    let index = 0

    intervalRef.current = window.setInterval(() => {
      if (index < code.length) {
        setDisplayedCode(code.slice(0, index + 1))
        index++
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        setIsTyping(false)
        setIsComplete(true)
      }
    }, speed)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [code, animate, speed])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSkip = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setDisplayedCode(code)
    setIsTyping(false)
    setIsComplete(true)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)]">
      {title && (
        <div className="px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{title}</span>
          <div className="flex items-center gap-2">
            {animate && isTyping && (
              <button
                onClick={handleSkip}
                className="no-min-touch text-xs px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                {t('common.skip')}
              </button>
            )}
            <button
              onClick={handleCopy}
              className="no-min-touch text-xs px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-white transition-colors"
            >
              {copied ? t('common.copied') : t('common.copy')}
            </button>
            {runnable && onRun && (
              <button
                onClick={onRun}
                className="text-xs px-2 py-1 rounded bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                {t('common.run')}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="bg-[var(--code-bg)] p-4 overflow-x-auto">
        <pre className="text-sm font-mono">
          <code className="text-[var(--code-text)]">
            {displayedCode}
            {isTyping && <span className="code-cursor">|</span>}
          </code>
        </pre>
      </div>
    </div>
  )
}
