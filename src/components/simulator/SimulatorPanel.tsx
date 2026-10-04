import { useState } from 'react'
import type { Simulator } from '../../types'
import { useTranslation } from 'react-i18next'
import { Button, Card, Icon } from '../atoms'
import BlockEditor from '../organisms/BlockEditor'
import { useProgressStore } from '../../store/useProgressStore'

interface SimulatorPanelProps {
  simulator: Simulator
  lessonId?: string
  nextLessonId?: string
  onNavigate?: (lessonId: string) => void
}

type VerifyResult = { name: string; passed: boolean; detail?: string }

export default function SimulatorPanel({ simulator, lessonId, nextLessonId, onNavigate }: SimulatorPanelProps) {
  const { t } = useTranslation()
  const { addXP, completeLesson } = useProgressStore()
  const [code, setCode] = useState(() => simulator.codigo_inicial ?? simulator.solucion ?? '')
  const [output, setOutput] = useState('')
  const [showSolution, setShowSolution] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showBlockEditor, setShowBlockEditor] = useState(false)
  const [verifyResults, setVerifyResults] = useState<VerifyResult[] | null>(null)
  const [challengePassed, setChallengePassed] = useState(false)

  const hasTests = Boolean(
    simulator.test_code ||
      simulator.asserts_stdout?.length ||
      simulator.asserts_return?.length ||
      simulator.asserts_exception?.length ||
      simulator.asserts_forbidden?.length
  )
  const canExecute = simulator.engine === 'pyodide' || simulator.engine === 'bash_sim'

  const handleRun = async () => {
    setIsRunning(true)
    setOutput('')

    try {
      if (simulator.engine === 'pyodide') {
        const { getPyodideRunner } = await import('../../services/pyodide')
        const runner = getPyodideRunner()
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
        setOutput(t('simulator.notImplemented'))
      }
    } catch (error: any) {
      setOutput(`Error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleVerify = async () => {
    if (!hasTests || simulator.engine !== 'pyodide') return
    setIsVerifying(true)
    setVerifyResults(null)

    try {
      const { getPyodideRunner } = await import('../../services/pyodide')
      const runner = getPyodideRunner()
      const results = await runner.verify(simulator, code)
      setVerifyResults(results)
      const allPassed = results.length > 0 && results.every(r => r.passed)
      if (allPassed && !challengePassed && lessonId) {
        setChallengePassed(true)
        completeLesson(lessonId)
        addXP(25)
      }
    } catch (error: any) {
      setVerifyResults([{ name: t('simulator.verifyError'), passed: false, detail: error.message }])
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReset = () => {
    setCode(simulator.codigo_inicial ?? '')
    setOutput('')
    setVerifyResults(null)
  }

  const allPassed = verifyResults ? verifyResults.length > 0 && verifyResults.every(r => r.passed) : false

  return (
    <Card title={t('simulator.title')}>
      <div className="mb-4 p-4 rounded-lg bg-[var(--bg-tertiary)]/60 border-l-4 border-[var(--accent)]">
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
          <Icon name="check" size={14} className="text-[var(--accent)]" />
          {t('simulator.instruction')}
        </p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{simulator.instruccion}</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {canExecute && (
          <Button onClick={handleRun} disabled={isRunning}>
            {isRunning ? t('common.loading') : t('common.run')}
          </Button>
        )}
        {canExecute && hasTests && simulator.engine === 'pyodide' && (
          <Button onClick={handleVerify} disabled={isVerifying} className="bg-[var(--success)] hover:opacity-90">
            {isVerifying ? t('common.loading') : t('simulator.verify')}
          </Button>
        )}
        <Button variant="secondary" onClick={handleReset}>
          {t('common.reset')}
        </Button>
        <Button variant="ghost" onClick={() => setShowSolution(!showSolution)}>
          {showSolution ? t('simulator.hideSolution') : t('simulator.showSolution')}
        </Button>
        <Button variant="ghost" onClick={() => setShowBlockEditor(!showBlockEditor)}>
          {showBlockEditor ? t('simulator.hideBlocks') : t('simulator.showBlocks')}
        </Button>
      </div>

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

      {verifyResults && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            {t('simulator.tests')}
          </p>
          <div className="space-y-2">
            {verifyResults.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  r.passed ? 'bg-[var(--success)]/15' : 'bg-[var(--error)]/15'
                }`}
              >
                <span className={`mt-0.5 ${r.passed ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                  <Icon name={r.passed ? 'check' : 'close'} size={14} />
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${r.passed ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                    {r.name}
                  </p>
                  {r.detail && (
                    <pre className="text-xs text-[var(--text-secondary)] font-mono mt-1 whitespace-pre-wrap">
                      {r.detail}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>

          {allPassed && (
            <div className="mt-4 p-4 rounded-lg bg-[var(--success)]/20 text-center">
              <p className="font-semibold text-[var(--success)]">
                🎉 {t('simulator.challengePassed')} (+25 XP)
              </p>
              {nextLessonId && onNavigate && (
                <Button onClick={() => onNavigate(nextLessonId)} className="mt-3 w-full">
                  {t('lesson.goToNextLesson')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {!canExecute && !hasTests && (
        <div className="mb-4 p-4 rounded-lg bg-[var(--warning)]/10">
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            {t('simulator.fallbackHint')}
          </p>
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
