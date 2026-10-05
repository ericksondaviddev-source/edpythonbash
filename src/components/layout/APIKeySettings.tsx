import { useState, useEffect } from 'react'
import { Button, Input, Modal } from '../atoms'

interface APIKeySettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function APIKeySettings({ isOpen, onClose }: APIKeySettingsProps) {
  const [apiKey, setApiKey] = useState('')
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const savedKey = localStorage.getItem('openrouter_api_key')
    if (savedKey) {
      setApiKey(savedKey)
      setIsSaved(true)
    }
  }, [])

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openrouter_api_key', apiKey.trim())
      setIsSaved(true)
      setTimeout(() => onClose(), 1000)
    }
  }

  const handleClear = () => {
    localStorage.removeItem('openrouter_api_key')
    setApiKey('')
    setIsSaved(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuración de API">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            Ingresa tu API key de OpenRouter para usar el Tutor IA.
          </p>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Obtén una API key gratuita en{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-2)] hover:underline"
            >
              openrouter.ai/keys
            </a>
          </p>
          <Input
            type="password"
            label="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-..."
          />
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-sm ${isSaved ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]'}`}>
            {isSaved ? '✓ API key guardada' : 'No configurada'}
          </span>
          {isSaved && (
            <Button variant="danger" size="sm" onClick={handleClear}>
              Eliminar
            </Button>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={!apiKey.trim()}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
