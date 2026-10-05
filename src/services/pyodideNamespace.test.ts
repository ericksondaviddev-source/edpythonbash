import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PyodideRunner } from './pyodide'

function makeFakePyodide() {
  return {
    _ns: [] as Record<string, unknown>[],
    _calls: 0,
    setStdout(_: unknown) {},
    setStderr(_: unknown) {},
    setStdin(_: unknown) {},
    async runPythonAsync(code: string, ns?: unknown) {
      if (code === '__make_ns__') {
        const d: Record<string, unknown> = {}
        this._ns.push(d)
        return d
      }
      void ns
      this._calls++
      if (this._calls <= 2) {
        const e = new Error('__NEED_INPUT__')
        e.name = 'NeedInput'
        throw e
      }
      return 'done'
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
      if (asked.length >= 2) return null
      return `valor${asked.length}`
    })
    expect(asked.length).toBe(2)
    expect(out.output).toContain('EOF')
    expect(out.askedInputs).toBe(2)
  })
})
