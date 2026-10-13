import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { flowchartToCode } from '../../../lib/flowchartToPseudo'
import type { FlowchartData } from '../../../types/lesson'

const DEFAULT_BUTTON =
  'px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] text-sm font-semibold hover:opacity-90 transition-opacity'

interface FlowchartCodePanelProps {
  data?: FlowchartData
  open: boolean
  onToggle: () => void
  /** Estilos del botón; el constructor lo estira para compartir fila con «Limpiar». */
  buttonClassName?: string
}

/**
 * Botón «Ver código» + traducción del diagrama a pseudocódigo y Python.
 * Compartido por el visor y el constructor para que ambas vistas prometan
 * exactamente la misma salida (el estado vive en el padre: «Limpiar» lo cierra).
 */
export default function FlowchartCodePanel({
  data,
  open,
  onToggle,
  buttonClassName,
}: FlowchartCodePanelProps) {
  const { t } = useTranslation()
  const code = useMemo(() => flowchartToCode(data ?? { nodes: [], edges: [] }), [data])

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={buttonClassName ?? DEFAULT_BUTTON}
      >
        {t('flowchart.convert')}
      </button>

      {open && (
        <div className="p-4 rounded-xl glass shadow-lg basis-full">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            {t('flowchart.codeTitle')}
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] mb-2">{t('flowchart.codeNote')}</p>

          <h4 className="text-xs font-semibold text-[var(--accent)] mb-1">
            {t('flowchart.pseudocodigo')}
          </h4>
          <pre className="bg-[var(--code-bg)] text-[var(--code-text)] p-3 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap mb-3">
            {code.pseudo || t('flowchart.sin_diagrama')}
          </pre>

          <h4 className="text-xs font-semibold text-[var(--accent)] mb-1">
            {t('flowchart.codigo_python')}
          </h4>
          <pre className="bg-[var(--code-bg)] text-[var(--code-text)] p-3 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap">
            {code.python || t('flowchart.sin_diagrama')}
          </pre>
        </div>
      )}
    </>
  )
}
