import { useState, useRef, useEffect } from 'react'
import type { Lesson } from '../../types'
import { useAI } from '../../hooks/useAI'
import { useTranslation } from 'react-i18next'
import { Button, Icon } from '../atoms'

interface AIPanelProps {
  lesson: Lesson | null
  isOpen: boolean
  onClose: () => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AIPanel({ lesson, isOpen, onClose }: AIPanelProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const { chat, isLoading, error } = useAI()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const suggestedQuestions = t('ai.suggestionsList', { returnObjects: true }) as string[]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && lesson) {
      setMessages([{
        role: 'assistant',
        content: t('ai.greeting', { lesson: lesson.competencia })
      }])
    }
  }, [isOpen, lesson, t])

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || !lesson) return

    const userMessage: Message = { role: 'user', content: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    const context = `${t('ai.ctxLesson')}: ${lesson.competencia}
${t('ai.ctxModule')}: ${lesson.modulo}
${t('ai.ctxContent')}: ${lesson.modelo_mental}
${t('ai.ctxBrokenCode')}: ${lesson.codigo_roto}
${t('ai.ctxFixedCode')}: ${lesson.codigo_corregido}

${t('ai.ctxUserQuestion')}: ${messageText}`

    const response = await chat([
      { role: 'system', content: t('ai.systemPrompt') },
      { role: 'user', content: context }
    ])

    if (response) {
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-x-0 bottom-0 h-[75vh] w-full rounded-t-2xl md:rounded-none md:inset-x-auto md:inset-y-0 md:right-0 md:h-full md:w-96 bg-[var(--bg-secondary)] border-t md:border-t-0 md:border-l border-[var(--border)] shadow-xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text-primary)]">{t('ai.title')}</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8 md:pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg">
              <p className="text-sm text-[var(--text-secondary)]">{t('ai.typing')}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="bg-[var(--error)]/20 p-3 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {lesson && (
        <div className="p-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)] mb-2">{t('ai.suggestions')}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-xs px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('ai.inputPlaceholder')}
              className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <Button onClick={() => handleSend()} disabled={isLoading}>
              {t('ai.send')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
