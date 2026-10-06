const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
const PYODIDE_SCRIPT = `${PYODIDE_URL}pyodide.js`

type LoadPyodideFn = (opts: { indexURL: string }) => Promise<unknown>

function getLoadPyodide(): LoadPyodideFn | undefined {
  const g = globalThis as unknown as { loadPyodide?: LoadPyodideFn }
  return typeof g.loadPyodide === 'function' ? g.loadPyodide : undefined
}

let scriptPromise: Promise<void> | null = null
let scriptEl: HTMLScriptElement | null = null

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
}

let instance: PyodideRunner | null = null

export function getPyodideRunner(): PyodideRunner {
  if (!instance) instance = new PyodideRunner()
  return instance
}

export { PyodideRunner }
