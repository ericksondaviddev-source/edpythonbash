import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Icon } from '../atoms'
import TutorTab from '../video/TutorTab'
import { getInstructionVideos, type InstructionVideo } from '../../lib/instructionVideos'

interface VideosCardProps {
  lang: 'es' | 'en'
}

export default function VideosCard({ lang }: VideosCardProps) {
  const { t } = useTranslation()
  const videos = getInstructionVideos(lang)
  const [selected, setSelected] = useState<InstructionVideo | null>(null)

  return (
    <div className="glass rounded-xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        {t('dashboard.videos')}
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{t('dashboard.videosSub')}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {videos.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelected(v)}
            className="text-left p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors group"
          >
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] mb-3 group-hover:scale-110 transition-transform">
              <Icon name="play" size={18} />
            </span>
            <span className="block font-semibold text-[var(--text-primary)] text-sm mb-1">
              {v.title}
            </span>
            <span className="block text-xs text-[var(--text-secondary)]">
              {v.description}
            </span>
            <span className="block text-xs text-[var(--text-secondary)] mt-2">
              {t('dashboard.steps', { count: v.scenes.length })}
            </span>
          </button>
        ))}
      </div>
      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
      >
        {selected && (
          <TutorTab
            steps={selected.scenes}
            title={selected.title}
            fileBase={`instruccion-${selected.id}`}
            lang={lang}
          />
        )}
      </Modal>
    </div>
  )
}
