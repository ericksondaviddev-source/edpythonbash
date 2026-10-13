import { useTranslation } from 'react-i18next'

interface IframePreviewProps {
  code: string
  title?: string
}

/**
 * Renderiza código HTML/CSS en vivo dentro de un iframe sandboxed
 * (sin scripts) para que el alumno vea el resultado real de su
 * código tal como se vería en un navegador.
 */
export default function IframePreview({ code, title }: IframePreviewProps) {
  const { t } = useTranslation()
  const html = normalizeHtml(code)

  return (
    <div className="rounded-xl glass overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {title ?? t('visual.preview')}
        </span>
      </div>
      <iframe
        title={title ?? t('visual.preview')}
        sandbox=""
        srcDoc={html}
        className="h-64 w-full bg-white"
      />
    </div>
  )
}

/** Envuelve fragmentos sueltos en un documento HTML5 mínimo. */
function normalizeHtml(code: string): string {
  const trimmed = code.trim()
  if (/<html[\s>]/i.test(trimmed)) return trimmed
  const isFragment =
    /^<(?:!DOCTYPE|div|span|p|h[1-6]|ul|ol|li|section|article|header|footer|nav|main|table|form|button|a|img|input|label|br|hr)\b/i.test(
      trimmed
    )
  if (!isFragment) return trimmed
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body>${trimmed}</body>
</html>`
}
