import { useState } from 'react'
import type { Simulator } from '../../types'
import { Button, Card } from '../atoms'

interface SimulatorPanelProps {
  simulator: Simulator
}

export default function SimulatorPanel({ simulator }: SimulatorPanelProps) {
  const [code, setCode] = useState(simulator.codigo_inicial)
  const [output, setOutput] = useState('')
  const [showSolution, setShowSolution] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

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
    <Card title="Simulador">
      <div className="mb-4">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
          Instrucción
        </p>
        <p className="text-sm text-[var(--text-secondary)]">{simulator.instruccion}</p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
          Código Inicial
        </p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-48 p-4 bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          spellCheck={false}
        />
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={handleRun} disabled={isRunning}>
          {isRunning ? 'Ejecutando...' : 'Ejecutar'}
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          Reiniciar
        </Button>
        <Button variant="ghost" onClick={() => setShowSolution(!showSolution)}>
          {showSolution ? 'Ocultar solución' : 'Mostrar solución'}
        </Button>
      </div>

      {output && (
        <div className="mb-4">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
            Salida
          </p>
          <pre className="p-4 bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}

      {showSolution && (
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
            Solución
          </p>
          <pre className="p-4 bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap">
            {simulator.solucion}
          </pre>
        </div>
      )}
    </Card>
  )
}
