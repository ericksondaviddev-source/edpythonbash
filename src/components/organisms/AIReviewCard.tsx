import { useState } from 'react'
import { useAI } from '../../hooks/useAI'
import { Button } from '../atoms'

interface AIReviewCardProps {
  code: string
  language: 'python' | 'bash'
}

export default function AIReviewCard({ code, language }: AIReviewCardProps) {
  const [review, setReview] = useState<string | null>(null)
  const [needsCode, setNeedsCode] = useState(false)
  const { chat, isLoading, error } = useAI()

  const handleReview = async () => {
    if (!code.trim()) {
      setNeedsCode(true)
      setTimeout(() => setNeedsCode(false), 3000)
      return
    }
    setNeedsCode(false)
    setReview(null)

    const response = await chat([
      {
        role: 'system',
        content:
          'Eres un tutor experto de Python y Bash. El estudiante construyó código con bloques visuales. ' +
          'Sigue el flujo pedagógico: (1) CREAR: valida que el código construido sea sintácticamente correcto. ' +
          '(2) LEER: explica qué hace el código paso a paso. ' +
          '(3) CORREGIR: señala errores o mejoras concretas con el código corregido. ' +
          '(4) OPTIMIZAR: muestra la versión optimizada siguiendo mejores prácticas. ' +
          'Responde en español, formato claro con secciones numeradas 1-4. Sé conciso.'
      },
      {
        role: 'user',
        content: `Revisa este código ${language === 'bash' ? 'Bash' : 'Python'} que construí con bloques:\n\n\`\`\`${language}\n${code}\n\`\`\``
      }
    ])

    setReview(response)
  }

  return (
    <div className="mt-4 border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-[var(--bg-secondary)] flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Revisión IA</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Flujo: crear → leer → corregir → optimizar
          </p>
        </div>
        <Button onClick={handleReview} disabled={isLoading} size="sm">
          {isLoading ? 'Revisando...' : 'Revisar con IA'}
        </Button>
      </div>

      {needsCode && (
        <div className="px-4 py-2 bg-[var(--warning)]/10">
          <p className="text-xs text-[var(--warning)]">
            Agrega bloques primero para poder revisar el código.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="px-4 py-4">
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-3/4" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-2/3" />
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-[var(--error)]/10">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      {review && !isLoading && (
        <div className="px-4 py-4 bg-[var(--bg-primary)]">
          <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">
            {review}
          </pre>
        </div>
      )}
    </div>
  )
}
