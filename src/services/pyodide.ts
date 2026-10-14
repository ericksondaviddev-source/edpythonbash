import type { TraceStep, TraceResult } from '../types/trace'

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
const PYODIDE_SCRIPT = `${PYODIDE_URL}pyodide.js`

/** Máximo de pasos de traza Python antes de abortar (evita congelar). */
export const MAX_TRACE_STEPS = 500

type LoadPyodideFn = (opts: { indexURL: string }) => Promise<unknown>

function getLoadPyodide(): LoadPyodideFn | undefined {
  const g = globalThis as unknown as { loadPyodide?: LoadPyodideFn }
  return typeof g.loadPyodide === 'function' ? g.loadPyodide : undefined
}

let scriptPromise: Promise<void> | null = null
let scriptEl: HTMLScriptElement | null = null

/**
 * Prefacio del tracer: define __snap__, __STEPS, __OUT, __safe_repr y
 * sobreescribe print() para acumular en __OUT. Se ejecuta en globals.
 */
const TRACE_PREAMBLE = `
import ast, json
__STEPS = []
__OUT = []
def __safe_repr(v):
    try:
        return repr(v)
    except Exception:
        return '<unrepresentable>'
def __snap__(lineno, variables, out):
    if len(__STEPS) >= ${MAX_TRACE_STEPS}:
        raise RuntimeError('Traza detenida: se superaron ${MAX_TRACE_STEPS} pasos.')
    _filtered = {}
    for _k, _v in variables.items():
        _base = __BASELINE.get(_k)
        if _base is None or _base != _v:
            _filtered[_k] = _v
    __STEPS.append(json.dumps({'lineno': lineno, 'variables': _filtered, 'output': list(out)}))
__orig_print = print
def print(*args, **kwargs):
    __OUT.append(' '.join(str(a) for a in args))
    __orig_print(*args, **kwargs)
`

/**
 * Transformer AST: inserta __snap__(st.lineno, ...) después de cada
 * sentencia del módulo, y al final del cuerpo de for/while/if/def
 * (así los bucles generan un snapshot por iteración).
 */
const TRACE_TRANSFORMER = `
class _Tracer(ast.NodeTransformer):
    def _snap(self, lineno):
        return ast.parse("__snap__(" + str(lineno) + ", dict((k, __safe_repr(v)) for k, v in list(locals().items()) if not k.startswith('_')), __OUT)").body[0]
    def _instrument(self, body):
        _new = []
        for _st in body:
            _new.append(_st)
            _new.append(self._snap(_st.lineno))
        return _new
    def visit_Module(self, node):
        self.generic_visit(node)
        node.body = self._instrument(node.body)
        return node
    def visit_FunctionDef(self, node):
        self.generic_visit(node)
        node.body = self._instrument(node.body)
        return node
    def visit_For(self, node):
        self.generic_visit(node)
        node.body = self._instrument(node.body)
        return node
    def visit_While(self, node):
        self.generic_visit(node)
        node.body = self._instrument(node.body)
        return node
    def visit_If(self, node):
        self.generic_visit(node)
        node.body = self._instrument(node.body)
        if node.orelse:
            node.orelse = self._instrument(node.orelse)
        return node
`

const TRACE_TRANSFORM = `
try:
    _tree = ast.parse(_user_code)
    _tree = _Tracer().visit(_tree)
    ast.fix_missing_locations(_tree)
    _transformed = compile(_tree, '<trace>', 'exec')
    _parse_error = ''
except SyntaxError as _se:
    _parse_error = 'SyntaxError: ' + str(_se)
`

const TRACE_EXEC = `
__BASELINE = {k: __safe_repr(v) for k, v in globals().items()}
if not _parse_error:
    try:
        exec(_transformed)
    except Exception as _e:
        _ln = -1
        try:
            _ln = _e.__traceback__.tb_lineno
        except Exception:
            pass
        __STEPS.append(json.dumps({'lineno': _ln, 'error': type(_e).__name__ + ': ' + str(_e), 'variables': {}, 'output': list(__OUT)}))
_result = json.dumps({'parse_error': _parse_error, 'steps': __STEPS})
`

/** Claves temporales que el tracer deja en globals y limpia al terminar. */
const TRACE_CLEANUP_KEYS = [
  '_user_code', '__STEPS', '__OUT', '__BASELINE', '_transformed', '_tree',
  '_Tracer', '_parse_error', '_result', '__orig_print', '__safe_repr', '__snap__'
]

/** Inyecta pyodide.js del CDN si aún no está cargado (primera ejecución). */
function ensurePyodideScript(): Promise<void> {
  if (getLoadPyodide()) return Promise.resolve()
  if (!scriptPromise || !scriptEl?.isConnected) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = PYODIDE_SCRIPT
      script.async = true
      scriptEl = script
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        scriptEl = null
        script.remove()
        reject(new Error(`No se pudo descargar ${PYODIDE_SCRIPT}`))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

class PyodideRunner {
  private pyodide: any = null
  private initPromise: Promise<void> | null = null

  async init() {
    if (this.pyodide) return
    if (!this.initPromise) {
      this.initPromise = (async () => {
        await ensurePyodideScript()
        const loadPyodide = getLoadPyodide()
        if (!loadPyodide) {
          throw new Error('pyodide.js cargó pero no expuso loadPyodide')
        }
        this.pyodide = await loadPyodide({ indexURL: PYODIDE_URL })
      })().catch((error) => {
        this.initPromise = null
        console.error('Failed to load Pyodide:', error)
        throw new Error('No se pudo cargar Pyodide. Verifica tu conexión.')
      })
    }
    await this.initPromise
  }

  async run(code: string): Promise<string> {
    if (!this.pyodide) {
      await this.init()
    }

    let output = ''

    this.pyodide.setStdout({
      batched: (text: string) => {
        output += text + '\n'
      }
    })

    this.pyodide.setStderr({
      batched: (text: string) => {
        output += text + '\n'
      }
    })

    try {
      await this.pyodide.runPythonAsync(code)
    } catch (error: any) {
      output += `Error: ${error.message}`
    }

    return output.trim()
  }

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

  async verify(
    simulator: {
      setup_code?: string
      test_code?: string
      asserts_stdout?: string[]
      asserts_return?: { caso: string; esperado: number | string | boolean }[]
      asserts_exception?: { caso: string; esperada: string }[]
      asserts_forbidden?: string[]
    },
    userCode: string
  ): Promise<{ name: string; passed: boolean; detail?: string }[]> {
    if (!this.pyodide) await this.init()

    const results: { name: string; passed: boolean; detail?: string }[] = []

    // 1. cargar setup + código del usuario en el namespace
    const setup = (simulator.setup_code || '') + '\n' + userCode
    try {
      await this.pyodide.runPythonAsync(setup)
    } catch (error: any) {
      return [{ name: 'El código se ejecuta sin errores', passed: false, detail: error.message }]
    }

    // 2. test_code completo (si existe)
    if (simulator.test_code) {
      const out = await this.runTestCode(simulator.test_code)
      results.push({ name: 'Tests del ejercicio (test_code)', passed: out.passed, detail: out.detail })
    }

    // 3. asserts_stdout
    for (const expected of simulator.asserts_stdout || []) {
      const out = await this.run(userCode)
      results.push({ name: `Salida contiene: ${expected}`, passed: out.includes(expected) })
    }

    // 4. asserts_return
    for (const { caso, esperado } of simulator.asserts_return || []) {
      const expectedRepr = typeof esperado === 'string' ? JSON.stringify(esperado) : String(esperado)
      const code = `
try:
    _r = ${caso}
    assert _r == (${expectedRepr}), f"obtuvo {_r!r}, esperado ${expectedRepr}"
    print("PASS")
except AssertionError as _e:
    print(f"FAIL: {_e}")
except Exception as _e:
    print(f"FAIL: {type(_e).__name__}: {_e}")`
      const out = await this.runTestCode(code)
      results.push({ name: `${caso} == ${expectedRepr}`, passed: out.passed, detail: out.detail })
    }

    // 5. asserts_exception
    for (const { caso, esperada } of simulator.asserts_exception || []) {
      const code = `
try:
    ${caso}
    print("FAIL: no lanzó excepción")
except ${esperada}:
    print("PASS")
except Exception as _e:
    print(f"FAIL: esperaba ${esperada}, obtuvo {type(_e).__name__}")`
      const out = await this.runTestCode(code)
      results.push({ name: `${caso} lanza ${esperada}`, passed: out.passed, detail: out.detail })
    }

    // 6. asserts_forbidden
    for (const forbidden of simulator.asserts_forbidden || []) {
      results.push({
        name: `No usa: ${forbidden}`,
        passed: !userCode.includes(forbidden)
      })
    }

    return results
  }

  private async runTestCode(code: string): Promise<{ passed: boolean; detail?: string }> {
    if (!this.pyodide) await this.init()
    try {
      const out = await this.run(code)
      return { passed: out.includes('PASS') && !out.includes('FAIL'), detail: out || undefined }
    } catch (error: any) {
      return { passed: false, detail: error.message }
    }
  }

  async installPackage(packageName: string) {
    if (!this.pyodide) {
      await this.init()
    }

    try {
      await this.pyodide.loadPackage('micropip')
      const micropip = this.pyodide.pyimport('micropip')
      await micropip.install(packageName)
    } catch (error: any) {
      throw new Error(`No se pudo instalar ${packageName}: ${error.message}`)
    }
  }

  /**
   * Ejecuta `code` línea por línea y devuelve un snapshot por paso con
   * las variables visibles (filtradas por diff contra una línea base) y
   * la salida acumulada. Usa instrumentación AST (sys.settrace no emite
   * eventos en Pyodide 0.24). Los internos del tracer quedan ocultos
   * gracias al filtro __BASELINE.
   */
  async trace(code: string): Promise<TraceStep[]> {
    if (!this.pyodide) await this.init()
    const pyodide = this.pyodide

    try {
      await pyodide.runPythonAsync(TRACE_PREAMBLE)
      pyodide.globals.set('_user_code', code)
      await pyodide.runPythonAsync(TRACE_TRANSFORMER + TRACE_TRANSFORM)
      await pyodide.runPythonAsync(TRACE_EXEC)

      const raw = pyodide.globals.get('_result')
      const resultJson = typeof raw === 'string' ? raw : String((raw as any)?.toJs?.() ?? '')
      const result = JSON.parse(resultJson) as TraceResult

      if (result.parse_error) {
        return [{ lineno: -1, variables: {}, output: [], error: result.parse_error }]
      }
      return result.steps.map(s => JSON.parse(s) as TraceStep)
    } finally {
      try {
        await pyodide.runPythonAsync('print = __orig_print')
      } catch {
        /* __orig_print aún no definido: ignorar */
      }
      for (const key of TRACE_CLEANUP_KEYS) {
        try {
          pyodide.globals.delete(key)
        } catch {
          /* no existe: ignorar */
        }
      }
    }
  }
}

let instance: PyodideRunner | null = null

export function getPyodideRunner(): PyodideRunner {
  if (!instance) instance = new PyodideRunner()
  return instance
}

export { PyodideRunner }
