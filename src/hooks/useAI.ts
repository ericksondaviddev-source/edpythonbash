import { useState, useCallback } from 'react'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const MODEL_CHAIN = [
  'openrouter/free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3.8-27b:free'
]

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterError {
  error?: { message?: string; code?: number }
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chat = useCallback(async (messages: Message[]): Promise<string | null> => {
    const apiKey = localStorage.getItem('openrouter_api_key')
    if (!apiKey) {
      setError('OpenRouter API key no configurada. Ve a Configuración (menú en el header).')
      return null
    }

    setIsLoading(true)
    setError(null)

    let lastError = ''

    for (const model of MODEL_CHAIN) {
      try {
        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ model, messages })
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content
          if (content) {
            setIsLoading(false)
            return content
          }
          lastError = 'Respuesta vacía del modelo'
          continue
        }

        const errData: OpenRouterError = await response.json().catch(() => ({}))
        lastError = errData.error?.message || `Error ${response.status}`
      } catch (err: any) {
        lastError = err?.message || 'Error de red'
      }
    }

    setIsLoading(false)
    setError(`No se pudo completar la solicitud: ${lastError}`)
    return null
  }, [])

  return { chat, isLoading, error }
}
