import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Icon } from '../atoms'
import TutorVideo from './TutorVideo'
import { buildTutorHtml } from '../../lib/tutorExport'
import type { TutorStep } from '../../lib/tutorScript'

interface TutorTabProps {
  steps: TutorStep[]
  title: string
  fileBase: string
  lang: 'es' | 'en'
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function TutorTab({ steps, title, fileBase, lang }: TutorTabProps) {
  const { t } = useTranslation()
  const [recording, setRecording] = useState(false)
  const [recordError, setRecordError] = useState(false)

  const handleDownloadHtml = () => {
    const html = buildTutorHtml(steps, { title, lang })
    downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${fileBase}-tutor.html`)
  }

  const handleDownloadVideo = async () => {
    setRecording(true)
    setRecordError(false)
    try {
      const { recordTutorVideo } = await import('../../lib/tutorRecorder')
      const blob = await recordTutorVideo(steps, { title })
      downloadBlob(blob, `${fileBase}-tutor.webm`)
    } catch {
      setRecordError(true)
    } finally {
      setRecording(false)
    }
  }

  return (
    <div className="space-y-3">
      <TutorVideo steps={steps} title={title} speed={30} voiceLang={lang} />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleDownloadHtml}>
          <Icon name="download" size={14} />
          {t('tutor.downloadHtml')}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDownloadVideo} disabled={recording}>
          <Icon name="download" size={14} />
          {recording ? t('tutor.recording') : t('tutor.downloadVideo')}
        </Button>
        {recordError && (
          <span className="text-sm text-[var(--error)]">{t('tutor.recordError')}</span>
        )}
      </div>
    </div>
  )
}
