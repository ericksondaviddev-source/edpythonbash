import { describe, it, expect, afterEach, vi } from 'vitest'
import { PyodideRunner } from './pyodide'

function makeFakePyodide() {
  return {
    setStdout() {},
    setStderr() {},
    setStdin() {},
    async runPythonAsync() {
      return 'done'
    },
    globals: { get: () => () => ({}) }
  }
}

function scripts(): HTMLScriptElement[] {
  return Array.from(document.head.querySelectorAll('script[src*="pyodide.js"]'))
}

describe('PyodideRunner loader', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    scripts().forEach(s => s.remove())
  })

  it('inyecta pyodide.js del CDN cuando loadPyodide no está disponible', async () => {
    const g = globalThis as unknown as Record<string, unknown>
    const prev = g.loadPyodide
    delete g.loadPyodide
    try {
      const r = new PyodideRunner()
      const p = r.init()
      const [script] = scripts()
      expect(script).toBeDefined()
      expect(script.src).toContain('cdn.jsdelivr.net/pyodide')
      g.loadPyodide = async () => makeFakePyodide()
      script.dispatchEvent(new Event('load'))
      await p
      expect(await r.run('print("x")')).toBeTypeOf('string')
    } finally {
      if (prev !== undefined) g.loadPyodide = prev
    }
  })

  it('llamadas concurrentes comparten una sola inyección', async () => {
    const g = globalThis as unknown as Record<string, unknown>
    const prev = g.loadPyodide
    delete g.loadPyodide
    try {
      const r = new PyodideRunner()
      const p1 = r.init()
      const p2 = r.init()
      expect(scripts()).toHaveLength(1)
      g.loadPyodide = async () => makeFakePyodide()
      scripts()[0].dispatchEvent(new Event('load'))
      await Promise.all([p1, p2])
    } finally {
      if (prev !== undefined) g.loadPyodide = prev
    }
  })

  it('si el script falla, rechaza con mensaje amigable y permite reintentar', async () => {
    const g = globalThis as unknown as Record<string, unknown>
    const prev = g.loadPyodide
    delete g.loadPyodide
    try {
      const r = new PyodideRunner()
      const p1 = r.init()
      scripts()[0].dispatchEvent(new Event('error'))
      await expect(p1).rejects.toThrow('No se pudo cargar Pyodide')
      // reintento: se inyecta un script nuevo tras limpiar el roto
      const p2 = r.init()
      p2.catch(() => {})
      expect(scripts()).toHaveLength(1)
      scripts()[0].dispatchEvent(new Event('error'))
      await expect(p2).rejects.toThrow('No se pudo cargar Pyodide')
    } finally {
      if (prev !== undefined) g.loadPyodide = prev
    }
  })
})
