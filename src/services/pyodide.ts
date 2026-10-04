class PyodideRunner {
  private pyodide: any = null
  private isLoading = false

  async init() {
    if (this.pyodide) return
    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return
    }

    this.isLoading = true

    try {
      // @ts-ignore
      this.pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      })
    } catch (error) {
      console.error('Failed to load Pyodide:', error)
      throw new Error('No se pudo cargar Pyodide. Verifica tu conexión.')
    } finally {
      this.isLoading = false
    }
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
