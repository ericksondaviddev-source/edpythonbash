import { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../atoms'
import { getBashSession, resetBashSession } from '../../services/sessionStore'
import { getPyodideRunner } from '../../services/pyodide'

interface HistoryEntry {
  kind: 'cmd' | 'out' | 'err' | 'sys'
  text: string
  prompt?: string
}

interface TerminalPanelProps {
  lessonId: string
  engine: 'pyodide' | 'bash_sim'
  setupCode?: string
  externalCode: string
  onConsumeExternal?: () => void
}

const HOME = '/home/user'

function bashPrompt(cwd: string): string {
  const short = cwd === HOME ? '~' : cwd.replace(HOME, '~')
  return `user@ed-dev:${short}$`
}

export default function TerminalPanel({ lessonId, engine, setupCode, externalCode, onConsumeExternal }: TerminalPanelProps) {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const [line, setLine] = useState('')
  const [running, setRunning] = useState(false)
  const [awaitingInput, setAwaitingInput] = useState(false)
  const [inputLine, setInputLine] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingInput = useRef<((v: string | null) => void) | null>(null)
  const pyNs = useRef<{ ready: boolean; ns: unknown }>({ ready: false, ns: null })
  const bashSim = useMemo(
    () => (engine === 'bash_sim' ? getBashSession(lessonId) : null),
    [engine, lessonId]
  )

  useEffect(() => {
    const el = scrollRef.current
    if (el && typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight })
  }, [entries, awaitingInput])

  const push = (e: HistoryEntry | HistoryEntry[]) =>
    setEntries(prev => [...prev, ...(Array.isArray(e) ? e : [e])])

  const ensurePyNs = async (): Promise<unknown> => {
    if (!pyNs.current.ready) {
      const runner = getPyodideRunner()
      const ns = await runner.createNamespace()
      if (setupCode?.trim()) await runner.runInNamespace(setupCode, ns)
      pyNs.current = { ready: true, ns }
    }
    return pyNs.current.ns
  }

  const waitForInputLine = (): Promise<string | null> =>
    new Promise(resolve => {
      pendingInput.current = resolve
      setAwaitingInput(true)
      setInputLine('')
    })

  const submitInputLine = (value: string | null) => {
    pendingInput.current?.(value)
    pendingInput.current = null
    setAwaitingInput(false)
  }

  const runBashLine = (cmdLine: string) => {
    if (!bashSim) return
    const trimmed = cmdLine.trim()
    if (!trimmed) return
    if (trimmed === 'clear') {
      setEntries([])
      return
    }
    const prompt = bashPrompt(bashSim.cwd)
    try {
      const res = bashSim.run(trimmed)
      const out: HistoryEntry[] = [{ kind: 'cmd', text: trimmed, prompt }]
      if (res.stdout) out.push({ kind: 'out', text: res.stdout })
      if (res.stderr) out.push({ kind: 'err', text: res.stderr })
      push(out)
    } catch (error: any) {
      push([
        { kind: 'cmd', text: trimmed, prompt },
        { kind: 'err', text: `Error: ${error.message}` }
      ])
    }
  }

  const runPythonCode = async (code: string) => {
    const runner = getPyodideRunner()
    const ns = await ensurePyNs()
    push({ kind: 'cmd', text: code.split('\n')[0] + (code.includes('\n') ? ' …' : ''), prompt: '>>>' })
    try {
      if (/\binput\s*\(/.test(code)) {
        push({ kind: 'sys', text: t('terminal.waitingInput') })
        const { output } = await runner.runWithStdin(code, ns, waitForInputLine)
        if (output) push({ kind: 'out', text: output })
      } else {
        const output = await runner.runInNamespace(code, ns)
        if (output) push({ kind: 'out', text: output })
      }
    } catch (error: any) {
      push({ kind: 'err', text: `Error: ${error.message}` })
    }
  }

  const execute = async (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed || running) return
    setHistory(h => [...h, trimmed])
    setHistIdx(-1)
    setRunning(true)
    try {
      if (engine === 'bash_sim') {
        for (const ln of trimmed.split('\n')) {
          if (ln.trim()) runBashLine(ln)
        }
      } else {
        await runPythonCode(trimmed)
      }
    } finally {
      setRunning(false)
      inputRef.current?.focus()
    }
  }

  const handleReset = async () => {
    if (engine === 'bash_sim') {
      resetBashSession(lessonId)
    } else {
      pyNs.current = { ready: false, ns: null }
      await ensurePyNs()
    }
    setEntries([{ kind: 'sys', text: t('terminal.sessionReset') }])
    setHistory([])
  }

  const completeTab = () => {
    if (engine !== 'bash_sim' || !bashSim) return
    const m = line.match(/(?:^|.*\s)([^\s]*)$/)
    const frag = m ? m[1] : line
    const hasSpace = /\s/.test(line)
    const candidates: string[] = hasSpace
      ? Array.from(bashSim.filesystem.keys()).filter(p => p.startsWith(bashSim.cwd + '/' + frag) || p === bashSim.cwd + '/' + frag)
      : bashSim.getCommandNames().filter(c => c.startsWith(frag))
    if (candidates.length === 1) {
      const done = hasSpace
        ? line.slice(0, line.length - frag.length) + candidates[0].slice((bashSim.cwd + '/').length)
        : candidates[0] + ' '
      setLine(done)
    } else if (candidates.length > 1) {
      push({ kind: 'sys', text: candidates.join('  ') })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      execute(line)
      setLine('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length === 0) return
      const next = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1)
      setHistIdx(next)
      setLine(history[next])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx === -1) return
      const next = histIdx + 1
      if (next >= history.length) {
        setHistIdx(-1)
        setLine('')
      } else {
        setHistIdx(next)
        setLine(history[next])
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      completeTab()
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setEntries([])
    }
  }

  const prompt = engine === 'bash_sim' ? bashPrompt(bashSim?.cwd ?? HOME) : '>>>'

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-[var(--text-primary)]">{t('terminal.title')}</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => { execute(externalCode).finally(() => onConsumeExternal?.()) }} disabled={running || !externalCode.trim()}>
            {t('terminal.runInTerminal')}
          </Button>
          <Button variant="ghost" onClick={handleReset} disabled={running}>
            {t('terminal.resetSession')}
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        aria-live="polite"
        className="p-4 bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg font-mono text-sm h-64 overflow-y-auto"
        onClick={() => !awaitingInput && inputRef.current?.focus()}
      >
        {entries.map((e, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {e.kind === 'cmd' && (
              <div>
                <span className="text-[var(--success)]">{e.prompt} </span>
                <span>{e.text}</span>
              </div>
            )}
            {e.kind === 'out' && <pre className="whitespace-pre-wrap">{e.text}</pre>}
            {e.kind === 'err' && <pre className="whitespace-pre-wrap text-[var(--error)]">{e.text}</pre>}
            {e.kind === 'sys' && <div className="italic text-[var(--text-secondary)]">{e.text}</div>}
          </div>
        ))}
        {awaitingInput ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[var(--warning)]">&gt;</span>
            <input
              aria-label={t('terminal.inputPlaceholder')}
              value={inputLine}
              onChange={ev => setInputLine(ev.target.value)}
              onKeyDown={ev => {
                if (ev.key === 'Enter') submitInputLine(inputLine)
                else if (ev.key === 'Escape') submitInputLine('')
              }}
              autoFocus
              placeholder={t('terminal.inputPlaceholder')}
              className="flex-1 bg-transparent outline-none font-mono text-sm text-[var(--code-text)]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[var(--success)] whitespace-pre">{prompt}</span>
            <input
              ref={inputRef}
              aria-label={t('terminal.inputLabel')}
              value={line}
              onChange={ev => setLine(ev.target.value)}
              onKeyDown={handleKeyDown}
              disabled={running}
              spellCheck={false}
              autoComplete="off"
              className="flex-1 bg-transparent outline-none font-mono text-sm text-[var(--code-text)]"
            />
          </div>
        )}
      </div>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{t('terminal.clearHint')}</p>
    </div>
  )
}
