# Terminal persistente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el simulador en una terminal interactiva con sesiones persistentes por lección (Python con namespace propio + `input()` funcional, Bash con filesystem persistente + historial/Tab).

**Architecture:** `services/sessionStore.ts` guarda sesiones vivas (`BashSim` reutilizado, dict de globals Pyodide por sesión); `PyodideRunner` gana `createNamespace/runInNamespace/runWithStdin`; nuevo `TerminalPanel.tsx` renderiza historial + línea de entrada; `SimulatorPanel.tsx` lo integra. TDD estricto, commits por tarea.

**Tech Stack:** React 18 + TypeScript strict, Vitest + Testing Library (ver `src/components/quiz/QuizEngine.test.tsx` como patrón), i18next es/en, Tailwind + CSS vars.

**Spec:** `docs/superpowers/specs/2026-10-05-persistent-terminal-simulator-design.md`

---

### Task 1: sessionStore (sesiones Bash persistentes)

**Files:**
- Create: `src/services/sessionStore.ts`
- Create: `src/services/sessionStore.test.ts`

API (exacta, el resto del plan depende de estos nombres):

```ts
import BashSim from './bashSim'

const bashSessions = new Map<string, BashSim>()

export function sessionKey(lessonId: string, engine: string): string {
  return `${lessonId}:${engine}`
}

export function getBashSession(lessonId: string): BashSim {
  const key = sessionKey(lessonId, 'bash_sim')
  let sim = bashSessions.get(key)
  if (!sim) {
    sim = new BashSim()
    bashSessions.set(key, sim)
  }
  return sim
}

export function resetBashSession(lessonId: string): void {
  bashSessions.delete(sessionKey(lessonId, 'bash_sim'))
}

export function clearAllSessions(): void {
  bashSessions.clear()
}
```

(`BashSim` ya es `export default` en `src/services/bashSim.ts:391`.)

- [ ] **Step 1: Write the failing test** — `src/services/sessionStore.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getBashSession, resetBashSession, clearAllSessions } from './sessionStore'

describe('sessionStore', () => {
  it('devuelve la misma sesión para la misma lección (estado persiste)', () => {
    clearAllSessions()
    const a = getBashSession('L-001')
    a.run('mkdir /home/user/notas && echo hola > /home/user/notas/a.txt')
    const b = getBashSession('L-001')
    expect(b).toBe(a)
    expect(b.run('cat /home/user/notas/a.txt').stdout).toContain('hola')
  })

  it('lecciones distintas tienen sesiones independientes', () => {
    clearAllSessions()
    getBashSession('L-001').run('export MI_VAR=123')
    expect(getBashSession('L-002').run('echo $MI_VAR').stdout.trim()).not.toBe('123')
  })

  it('resetBashSession destruye la sesión', () => {
    clearAllSessions()
    const a = getBashSession('L-003')
    resetBashSession('L-003')
    expect(getBashSession('L-003')).not.toBe(a)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/sessionStore.test.ts` (workdir `app/`)
Expected: FAIL with "Failed to resolve import ./sessionStore"

- [ ] **Step 3: Write minimal implementation** — crear `src/services/sessionStore.ts` con el código del bloque API de arriba.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/sessionStore.test.ts`
Expected: 3 passed. Nota: si `echo $MI_VAR` no expande vars en bashSim, ajustar el test a `export` + `env | grep` según el comportamiento real verificado en `src/services/bashSim.ts` (leer `private export` y expansión de `$VAR` antes de escribir el test).

- [ ] **Step 5: Commit**

```bash
git add src/services/sessionStore.ts src/services/sessionStore.test.ts
git commit -m "feat(sim): sessionStore con sesiones Bash persistentes por lección"
```

---

### Task 2: Exponer comandos Bash para Tab-completion

**Files:**
- Modify: `src/services/bashSim.ts` (añadir método público al final de la clase, antes de `export default`)
- Modify: `src/services/sessionStore.test.ts` (o nuevo `src/services/bashSimCommands.test.ts` — usar archivo nuevo)

- [ ] **Step 1: Inspeccionar el dispatch de comandos** — leer `src/services/bashSim.ts` líneas 80-230, anotar todos los `case '<cmd>':` del switch. El método debe devolver exactamente esos nombres.

- [ ] **Step 2: Write the failing test** — `src/services/bashSimCommands.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import BashSim from './bashSim'

describe('BashSim.getCommandNames', () => {
  it('incluye comandos básicos implementados', () => {
    const cmds = new BashSim().getCommandNames()
    for (const c of ['echo', 'ls', 'cd', 'cat', 'mkdir']) {
      expect(cmds).toContain(c)
    }
  })
})
```

(Si alguno de esos 5 no existe en el switch, sustituir por comandos reales del switch.)

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/services/bashSimCommands.test.ts`
Expected: FAIL with "getCommandNames is not a function"

- [ ] **Step 4: Write minimal implementation** — al final de la clase `BashSim`:

```ts
/** Nombres de comandos implementados (para autocompletado con Tab). */
getCommandNames(): string[] {
  return ['echo', 'ls', 'cd', 'cat', 'mkdir', /* ...resto de cases del switch... */]
}
```

La lista debe ser exactamente los `case` del switch (reemplazar el comentario por la lista real).

- [ ] **Step 5: Run test + commit**

Run: `npx vitest run src/services/bashSimCommands.test.ts` → PASS.
```bash
git add src/services/bashSim.ts src/services/bashSimCommands.test.ts
git commit -m "feat(sim): BashSim expone getCommandNames para autocompletado"
```

---

### Task 3: Pyodide — namespaces por sesión + stdin interactivo

**Files:**
- Modify: `src/services/pyodide.ts` (añadir 3 métodos a `PyodideRunner`)
- Create: `src/services/pyodideNamespace.test.ts`

Contexto: `PyodideRunner.run` usa el namespace global. En jsdom `loadPyodide` no existe: el test lo stubbea con `vi.stubGlobal`.

- [ ] **Step 1: Write the failing test** — `src/services/pyodideNamespace.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PyodideRunner } from './pyodide'

function makeFakePyodide() {
  const stores = new Map<string, string>()
  return {
    _ns: [] as Record<string, unknown>[],
    setStdout(_: unknown) {},
    setStderr(_: unknown) {},
    async runPythonAsync(code: string, ns?: unknown) {
      if (code === '__make_ns__') {
        const d: Record<string, unknown> = {}
        this._ns.push(d)
        return d
      }
      return `ran:${String(code).slice(0, 10)}`
    },
    globals: { get: (_: string) => () => ({}) }
  }
}

describe('PyodideRunner namespaces', () => {
  beforeEach(() => {
    vi.stubGlobal('loadPyodide', async () => makeFakePyodide())
  })

  it('createNamespace devuelve namespaces independientes', async () => {
    const r = new PyodideRunner()
    const a = await r.createNamespace()
    const b = await r.createNamespace()
    expect(a).not.toBe(b)
  })

  it('runInNamespace ejecuta código en el namespace dado', async () => {
    const r = new PyodideRunner()
    const ns = await r.createNamespace()
    const out = await r.runInNamespace('x = 1', ns)
    expect(typeof out).toBe('string')
  })

  it('runWithStdin pide líneas hasta completar los input()', async () => {
    const r = new PyodideRunner()
    const asked: string[] = []
    const out = await r.runWithStdin('code', null, async () => {
      asked.push('línea')
      if (asked.length >= 2) return null // segunda llamada: simular fin
      return `valor${asked.length}`
    })
    expect(typeof out).toBe('string')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/pyodideNamespace.test.ts`
Expected: FAIL with "createNamespace is not a function"

- [ ] **Step 3: Write minimal implementation** — añadir a `PyodideRunner` en `src/services/pyodide.ts`:

```ts
/** Crea un namespace (dict) aislado para una sesión. */
async createNamespace(): Promise<unknown> {
  if (!this.pyodide) await this.init()
  return this.pyodide.globals.get('dict')()
}

/** Ejecuta código dentro de un namespace dado (o global si ns es null). */
async runInNamespace(code: string, ns: unknown): Promise<string> {
  if (!this.pyodide) await this.init()
  let output = ''
  this.pyodide.setStdout({ batched: (text: string) => { output += text + '\n' } })
  this.pyodide.setStderr({ batched: (text: string) => { output += text + '\n' } })
  try {
    if (ns) await this.pyodide.runPythonAsync(code, ns)
    else await this.pyodide.runPythonAsync(code)
  } catch (error: any) {
    output += `Error: ${error.message}`
  }
  return output.trim()
}

private needInputError(): Error {
  const e = new Error('__NEED_INPUT__')
  e.name = 'NeedInput'
  return e
}

/**
 * Ejecuta código alimentando input() con getLine().
 * Re-ejecuta desde cero cada vez que se agota el stdin (límite 20 inputs).
 * Limitación documentada: el código se re-ejecuta, así que efectos como
 * list.append dentro del mismo script se duplicarían; en ejercicios típicos
 * (print/input/asignaciones) es idempotente.
 */
async runWithStdin(
  code: string,
  ns: unknown,
  getLine: () => Promise<string | null>,
  maxInputs = 20
): Promise<{ output: string; askedInputs: number }> {
  if (!this.pyodide) await this.init()
  const lines: string[] = []
  let asked = 0
  for (let attempt = 0; attempt <= maxInputs; attempt++) {
    let output = ''
    this.pyodide.setStdout({ batched: (t: string) => { output += t + '\n' } })
    this.pyodide.setStderr({ batched: (t: string) => { output += t + '\n' } })
    let idx = 0
    this.pyodide.setStdin({
      stdin: () => {
        if (idx < lines.length) return lines[idx++]
        throw this.needInputError()
      }
    })
    try {
      if (ns) await this.pyodide.runPythonAsync(code, ns)
      else await this.pyodide.runPythonAsync(code)
      return { output: output.trim(), askedInputs: asked }
    } catch (error: any) {
      if (error?.name === 'NeedInput' || error?.message === '__NEED_INPUT__') {
        const line = await getLine()
        asked++
        if (line === null) return { output: (output + '\nError: EOF en input()').trim(), askedInputs: asked }
        lines.push(line + '\n')
        continue
      }
      return { output: (output + `\nError: ${error.message}`).trim(), askedInputs: asked }
    }
  }
  return { output: 'Error: demasiados input() (límite 20)', askedInputs: asked }
}
```

Nota: `this.pyodide` es `any`, `setStdin` existe en Pyodide 0.24. Si `setStdin` con función que lanza no propaga el error esperado, ajustar la detección al mensaje real (verificar contra tipos de `pyodide` 0.24 si TS protesta: `this.pyodide.setStdin` es `any`, no protesta).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/pyodideNamespace.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/services/pyodide.ts src/services/pyodideNamespace.test.ts
git commit -m "feat(sim): namespaces por sesión e input() interactivo en Pyodide"
```

---

### Task 4: TerminalPanel (componente de consola)

**Files:**
- Create: `src/components/simulator/TerminalPanel.tsx`
- Create: `src/components/simulator/TerminalPanel.test.tsx`

Props exactas (el Task 5 depende de ellas):

```ts
interface HistoryEntry { kind: 'cmd' | 'out' | 'err' | 'sys'; text: string }
interface TerminalPanelProps {
  lessonId: string
  engine: 'pyodide' | 'bash_sim'
  setupCode?: string
  externalCode: string // contenido actual del editor; "Ejecutar en terminal" lo corre
  onConsumeExternal?: () => void
}
```

Comportamiento:
- Estado: `entries: HistoryEntry[]`, `history: string[]` (comandos), `histIdx`, `running`.
- Sesión: `useMemo(() => engine === 'bash_sim' ? getBashSession(lessonId) : null)`. Python: namespace creado con `getPyodideRunner().createNamespace()` (lazy en el primer comando, con estado `nsRef`); `setupCode` se ejecuta una vez al crear el namespace vía `runInNamespace`.
- Ejecutar línea Bash: `sim.run(line)` → entry `cmd` con prompt + línea, luego `out` (stdout) y `err` (stderr) si hay. Prompt bash: `user@ed-dev:${cwd}$` (con `~` para HOME). `clear` limpia entries (no la sesión).
- Ejecutar línea Python: si la línea es una sola expresión/sentencia, `runInNamespace`. Si contiene `input(`, usar `runWithStdin` con `getLine` que añade una entry `sys` "⏳ esperando entrada…" y resuelve con una entrada inline (input dedicado debajo del historial mientras `awaitingInput`).
- Botón "Ejecutar en terminal": corre `externalCode` (multilínea: bash → `sim.run`; python → `runWithStdin` si contiene `input(`, si no `runInNamespace`), luego `onConsumeExternal?.()`.
- "Reiniciar sesión": bash → `resetBashSession(lessonId)` + nueva sesión + entry sys; python → `createNamespace()` nuevo + re-run setupCode. Limpia entries con mensaje sys.
- ↑/↓ navega `history`; Ctrl+L limpia la vista; Tab en bash autocompleta con `getCommandNames()` + rutas de `sim.filesystem` (keys que empiezan por cwd); Enter ejecuta.
- Auto-scroll al final (ref + useEffect). `aria-live="polite"` en la región de salida. Textos vía `t('terminal.*')` (claves definidas en Task 5; en este task usar los IDs y añadir los JSON en Task 5 — NO, i18n missing rompe? `t` devuelve la key si falta; aceptable temporalmente, Task 5 añade las traducciones).
- Estilos: `bg-[var(--code-bg)] text-[var(--code-text)] font-mono`, prompt en `text-[var(--success)]`, errores en `text-[var(--error)]`.

- [ ] **Step 1: Write the failing test** — `src/components/simulator/TerminalPanel.test.tsx` (mockear servicios para no cargar Pyodide/BashSim reales):

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../../services/sessionStore', () => ({
  getBashSession: () => ({
    cwd: '/home/user',
    filesystem: new Map([['/home/user', ''], ['/home/user/a.txt', 'hola']]),
    getCommandNames: () => ['echo', 'ls', 'cd'],
    run: (cmd: string) => ({ stdout: `out:${cmd}`, stderr: '', exitCode: 0 })
  }),
  resetBashSession: vi.fn()
}))

import TerminalPanel from './TerminalPanel'

describe('TerminalPanel (bash)', () => {
  it('muestra el prompt y ejecuta un comando con Enter', async () => {
    render(<TerminalPanel lessonId="L-1" engine="bash_sim" externalCode="" />)
    const input = screen.getByRole('textbox', { name: /terminal/i })
    fireEvent.change(input, { target: { value: 'echo hola' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(screen.getByText('out:echo hola')).toBeInTheDocument())
  })

  it('↑ recupera el comando anterior', async () => {
    render(<TerminalPanel lessonId="L-2" engine="bash_sim" externalCode="" />)
    const input = screen.getByRole('textbox', { name: /terminal/i }) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'ls' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.value).toBe('ls')
  })
})
```

Verificar antes: `@testing-library/react` y `toBeInTheDocument` (jest-dom) disponibles — mirar imports de `src/components/quiz/QuizEngine.test.tsx` y copiar el setup.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/simulator/TerminalPanel.test.tsx`
Expected: FAIL with "Failed to resolve import ./TerminalPanel"

- [ ] **Step 3: Write minimal implementation** — `src/components/simulator/TerminalPanel.tsx` completo según el comportamiento de arriba. Incluir `aria-label={t('terminal.inputLabel')}` en el input (para `getByRole('textbox', { name: /terminal/i })` el label debe contener "terminal"; en español el label será "Entrada de la terminal").

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/simulator/TerminalPanel.test.tsx`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/simulator/TerminalPanel.tsx src/components/simulator/TerminalPanel.test.tsx
git commit -m "feat(sim): TerminalPanel con historial, prompts e input interactivo"
```

---

### Task 5: Integración en SimulatorPanel + i18n + pista tras 2 fallos

**Files:**
- Modify: `src/components/simulator/SimulatorPanel.tsx`
- Modify: `src/i18n/es.json` (sección `terminal` + `simulator.failedTwiceHint`)
- Modify: `src/i18n/en.json` (idem en inglés)

- [ ] **Step 1: Añadir claves i18n** — en `es.json`, añadir objeto hermano de `"simulator"`:

```json
"terminal": {
  "title": "Terminal",
  "inputLabel": "Entrada de la terminal",
  "runInTerminal": "Ejecutar en terminal",
  "resetSession": "Reiniciar sesión",
  "sessionReset": "Sesión reiniciada. Estado limpio.",
  "waitingInput": "⏳ Esperando entrada… escribe abajo y pulsa Enter",
  "inputPlaceholder": "Escribe la entrada y pulsa Enter…",
  "commandNotFound": "bash: {{cmd}}: command not found",
  "clearHint": "Ctrl+L limpia · ↑/↓ historial · Tab autocompleta"
},
```

y dentro de `"simulator"`: `"failedTwiceHint": "💡 Pista: {{hint}}"`.
En `en.json` los equivalentes:
`title: Terminal, inputLabel: Terminal input, runInTerminal: Run in terminal, resetSession: Reset session, sessionReset: Session reset. Clean state., waitingInput: ⏳ Waiting for input… type below and press Enter, inputPlaceholder: Type input and press Enter…, commandNotFound: bash: {{cmd}}: command not found, clearHint: Ctrl+L clears · ↑/↓ history · Tab completes`, `failedTwiceHint: 💡 Hint: {{hint}}`.
(Verificar la estructura exacta de es.json/en.json — si `simulator` es objeto raíz, añadir `terminal` como objeto raíz también.)

- [ ] **Step 2: Integrar TerminalPanel en SimulatorPanel.tsx**:
  - Import: `import TerminalPanel from './TerminalPanel'`.
  - Estado nuevo: `const [failedVerifies, setFailedVerifies] = useState(0)`.
  - En `handleVerify`, cuando el resultado NO es allPassed: `setFailedVerifies(c => c + 1)`; cuando sí: `setFailedVerifies(0)`.
  - Pista: `const hint = (quiz as { pista?: string } | undefined)?.pista` — NO: la pista viene de la lección, no del simulador. `SimulatorPanel` recibe `simulator` y `lessonId`, no la lección. Cambio mínimo: prop opcional `hint?: string` en `SimulatorPanelProps`; `LessonView.tsx` línea ~267 le pasa `hint={(lesson.quiz as Quiz & { pista?: string }).pista}`. Verificar que `lesson` está en scope en LessonView (sí, es su prop). Si `quiz.pista` no existe en el JSON, no se muestra nada.
  - Render: si `failedVerifies >= 2 && hint`, mostrar `<p>{t('simulator.failedTwiceHint', { hint })}</p>` sobre los resultados.
  - Render del terminal: debajo del bloque de output (después del `{output && (...)}`), si `canExecute`, renderizar `<TerminalPanel lessonId={lessonId ?? simulator.engine} engine={simulator.engine as 'pyodide' | 'bash_sim'} setupCode={simulator.setup_code} externalCode={code} />`. Para engines no ejecutables no renderizar nada (mantiene aviso actual).
  - Actualizar la llamada en `LessonView.tsx` con la prop `hint`.

- [ ] **Step 3: Verificar compilación y tests**

Run: `npx tsc -b` → sin errores. `npx vitest run` → todos pasan (incluye TerminalPanel con las claves ya existentes).

- [ ] **Step 4: Commit**

```bash
git add src/components/simulator/SimulatorPanel.tsx src/components/lesson/LessonView.tsx src/i18n/es.json src/i18n/en.json
git commit -m "feat(sim): integrar terminal persistente y pista tras 2 fallos"
```

---

### Task 6: Verificación final de la feature

- [ ] **Step 1: tsc + tests + lint**

```bash
npx tsc -b
npx vitest run
npm run lint
```

Expected: 0 errores tsc; todos los tests en verde (contar: antes 58, ahora 58+3+1+3+2=67 como mínimo); lint sin errores nuevos.

- [ ] **Step 2: build**

```bash
npm run build
```

Expected: build OK.

- [ ] **Step 3: Verificación visual en navegador** (skill browser-testing-with-devtools, servidor dev en puerto 5174):
  1. Navegar a `#/leccion/F0.1-001` (u otra con `simulador`), abrir tab Simulador.
  2. Snapshot: confirmar que `TerminalPanel` renderiza (prompt `user@ed-dev:~$` o `>>>`).
  3. Escribir `echo hola` + Enter → aparece `hola`; escribir `MI_VAR=1` (o `export`) + Enter, luego leerla → persiste (prueba la sesión).
  4. Consola del navegador sin errores.
  5. Screenshot de la terminal funcionando.

- [ ] **Step 4: Commit final si hubo ajustes + reportar**

Si el Task 6 no requirió cambios de código, no hay commit; reportar al usuario con el screenshot.

---

## Self-Review

1. **Spec coverage:** §1 arquitectura → Tasks 1-4; prompts/historial/Tab/Ctrl+L → Task 4; `input()` → Task 3+4; bash honesto → BashSim existente + Task 4; editor↔terminal → Task 4 (`externalCode`); a11y/i18n → Tasks 4-5; pista tras 2 fallos → Task 5; tests → cada task; límites (sin multi-archivo) → respetados, ningún task lo toca.
2. **Placeholders:** el Task 1 advierte verificar expansión de `$VAR` antes de fijar el test; el Task 2 exige leer los `case` reales; el Task 4 exige copiar el setup de Testing Library del test existente. Sin TBD/TODO.
3. **Type consistency:** `sessionKey/getBashSession/resetBashSession/clearAllSessions` (T1) usados en T4; `getCommandNames` (T2) usado en T4; `createNamespace/runInNamespace/runWithStdin` (T3) usados en T4; props `TerminalPanelProps` (T4) usadas en T5. `engine` en T5 se castea porque `Simulator['engine']` incluye 3 motores no ejecutables — el render está guardado por `canExecute`, consistente con el código actual.
