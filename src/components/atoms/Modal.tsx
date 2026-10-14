import { useEffect, useRef } from 'react'
import Icon from './Icon'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in"
      style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass rounded-[var(--radius-xl)] p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-apple-xl animate-scale-in"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-[20px] font-semibold tracking-[var(--tracking-tight)] text-[var(--text-primary)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 -m-1 rounded-[var(--radius-full)] text-[var(--text-secondary)] press hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
