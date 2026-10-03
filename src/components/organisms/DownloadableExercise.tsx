import { Button, Card } from '../atoms'

interface DownloadableExerciseProps {
  title: string
  description: string
  code: string
  language: 'python' | 'bash'
}

export default function DownloadableExercise({
  title,
  description,
  code,
  language
}: DownloadableExerciseProps) {
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.${language === 'python' ? 'py' : 'sh'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card title={title}>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{description}</p>
      <div className="flex gap-2">
        <Button onClick={handleDownload}>
          Descargar {language === 'python' ? 'Python' : 'Bash'}
        </Button>
      </div>
    </Card>
  )
}
