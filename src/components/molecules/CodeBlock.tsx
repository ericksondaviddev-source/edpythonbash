import { useState } from 'react'
import { Button, Icon } from '../atoms'

interface CodeBlockProps {
  code: string
  language?: 'python' | 'bash' | 'html' | 'css'
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
  onRun,
  runnable = false
}: CodeBlockProps) {
  const [displayedCode, setDisplayedCode] = useState(animate ? '' : code)
  const [isTyping, setIsTyping] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSkip = () => {
    setDisplayedCode(code)
    setIsTyping(false)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)]">
      {title && (
        <div className="px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{title}</span>
          <div className="flex items-center gap-2">
            {animate && isTyping && (
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Saltar
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Icon name="copy" size={14} />
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            {runnable && onRun && (
              <Button variant="primary" size="sm" onClick={onRun}>
                Ejecutar
              </Button>
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
