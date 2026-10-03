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

export { PyodideRunner }
