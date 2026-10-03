import { useState } from 'react'
import type { Simulator } from '../../types'
import { useTranslation } from 'react-i18next'
import { Button, Card } from '../atoms'
import BlockEditor from '../organisms/BlockEditor'
import StepByStepGuide from '../organisms/StepByStepGuide'

interface SimulatorPanelProps {
  simulator: Simulator
}

const GUIDE_STEPS = [
  {
    title: 'Analiza el problema',
    description: 'Lee cuidadosamente el código inicial y entiende qué está mal.',
    hint: 'Identifica el error antes de intentar arreglarlo.'
  },
  {
    title: 'Planifica la solución',
    description: 'Piensa en los pasos necesarios para corregir el código.',
    hint: 'Divide el problema en pasos pequeños.'
  },
  {
    title: 'Implementa la solución',
    description: 'Escribe el código corregido paso a paso.',
    hint: 'Prueba cada cambio antes de continuar.'
  },
  {
    title: 'Verifica el resultado',
    description: 'Ejecuta el código y verifica que funcione correctamente.',
    hint: 'Si no funciona, revisa tus cambios anteriores.'
  }
]

export default function SimulatorPanel({ simulator }: SimulatorPanelProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState(simulator.codigo_inicial)
  const [output, setOutput] = useState('')
  const [showSolution, setShowSolution] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [showBlockEditor, setShowBlockEditor] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const handleRun = async () => {
    setIsRunning(true)
    setOutput('')

    try {
      if (simulator.engine === 'pyodide') {
        const { PyodideRunner } = await import('../../services/pyodide')
        const runner = new PyodideRunner()
        await runner.init()
        if (simulator.setup_code) {
          await runner.run(simulator.setup_code)
        }
        const result = await runner.run(code)
        setOutput(result)
      } else if (simulator.engine === 'bash_sim') {
        const { default: BashSim } = await import('../../services/bashSim')
        const sim = new BashSim()
        const result = sim.run(code)
        setOutput(result.stdout + (result.stderr ? `\n${result.stderr}` : ''))
      } else {
        setOutput('Simulador no implementado para este engine')
      }
    } catch (error: any) {
      setOutput(`Error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    setCode(simulator.codigo_inicial)
    setOutput('')
  }

  return (
    <Card title={t('simulator.title')}>
      <div className="mb-4">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
          {t('simulator.instruction')}
        </p>
        <p className="text-sm text-[var(--text-secondary)]">{simulator.instruccion}</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Button onClick={handleRun} disabled={isRunning}>
          {isRunning ? t('common.loading') : t('common.run')}
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          {t('common.reset')}
        </Button>
        <Button variant="ghost" onClick={() => setShowSolution(!showSolution)}>
          {showSolution ? t('simulator.hideSolution') : t('simulator.showSolution')}
        </Button>
        <Button variant="ghost" onClick={() => setShowBlockEditor(!showBlockEditor)}>
          {showBlockEditor ? 'Ocultar Bloques' : 'Editor de Bloques'}
        </Button>
        <Button variant="ghost" onClick={() => setShowGuide(!showGuide)}>
          {showGuide ? 'Ocultar Guía' : 'Guía Paso a Paso'}
        </Button>
      </div>

      {showGuide && (
        <div className="mb-4">
          <StepByStepGuide
            steps={GUIDE_STEPS}
            onComplete={() => setShowGuide(false)}
          />
        </div>
      )}

      {showBlockEditor && (
        <div className="mb-4">
          <BlockEditor
            language={simulator.engine === 'bash_sim' ? 'bash' : 'python'}
            onCodeChange={setCode}
          />
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
          {t('simulator.initialCode')}
        </p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-48 p-4 bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          spellCheck={false}
        />
      </div>

      {output && (
        <div className="mb-4">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
            {t('simulator.output')}
          </p>
          <pre className="p-4 bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}

      {showSolution && (
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
            {t('simulator.solution')}
          </p>
          <pre className="p-4 bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap">
            {simulator.solucion}
          </pre>
        </div>
      )}
    </Card>
  )
}
