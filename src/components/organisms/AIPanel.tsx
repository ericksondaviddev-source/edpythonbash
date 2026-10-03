import { useState, useRef, useEffect } from 'react'
import type { Lesson } from '../../types'
import { useAI } from '../../hooks/useAI'
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

const SUGGESTED_QUESTIONS = [
  '¿Cuál es el concepto principal de esta lección?',
  '¿Por qué falla el código roto?',
  '¿Qué mejora el código optimizado?',
  'Explícame el código corregido paso a paso',
  '¿Qué errores comunes debo evitar?'
]

export default function AIPanel({ lesson, isOpen, onClose }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const { chat, isLoading, error } = useAI()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && lesson) {
      setMessages([{
        role: 'assistant',
        content: `¡Hola! Soy tu tutor de Python y Bash. Estoy aquí para ayudarte con la lección "${lesson.competencia}". ¿En qué puedo ayudarte?`
      }])
    }
  }, [isOpen, lesson])

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || !lesson) return

    const userMessage: Message = { role: 'user', content: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    const context = `Lección: ${lesson.competencia}
Módulo: ${lesson.modulo}
Contenido: ${lesson.modelo_mental}
Código roto: ${lesson.codigo_roto}
Código corregido: ${lesson.codigo_corregido}

Pregunta del usuario: ${messageText}`

    const response = await chat([
      { role: 'system', content: 'Eres un tutor de Python y Bash. Responde basándote en el contenido de la lección. Sé claro y conciso.' },
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
        <h3 className="font-semibold text-[var(--text-primary)]">Tutor IA</h3>
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
                  ? 'bg-[var(--accent)] text-white'
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
              <p className="text-sm text-[var(--text-secondary)]">Escribiendo...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="bg-[var(--error)] bg-opacity-20 p-3 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {lesson && (
        <div className="p-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)] mb-2">Sugerencias:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-xs px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-white transition-colors"
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
              placeholder="Pregunta algo..."
              className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <Button onClick={() => handleSend()} disabled={isLoading}>
              Enviar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
