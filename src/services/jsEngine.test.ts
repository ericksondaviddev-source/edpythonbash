import { describe, it, expect } from 'vitest'
import { buildHarness, getJsEngine, JsEngine } from './jsEngine'
import type { JsRunResult } from './jsEngine'
import { MAX_LOOP_ITERATIONS } from '../lib/jsLoopGuard'

describe('buildHarness', () => {
  it('incluye el DOM de prueba que las lecciones F0.3 buscan', () => {
    const html = buildHarness('console.log(1)', 'run-1')
    expect(html).toContain('class="menu-toggle"')
    expect(html).toContain('class="course-list"')
    expect(html).toContain('class="course-item"')
    expect(html).toContain('id="email"')
    expect(html).toContain('id="btn"')
    expect(html).toContain('class="header"')
  })

  it('inyecta el runId en el puente de mensajes', () => {
    const html = buildHarness('console.log(1)', 'run-abc')
    expect(html).toContain("var RUN_ID = 'run-abc'")
  })

  it('aplica el guard de bucles al codigo del alumno', () => {
    const html = buildHarness('while (true) { }', 'run-1')
    expect(html).toContain('while ((true) && __tick())')
    expect(html).toContain(String(MAX_LOOP_ITERATIONS))
  })

  it('escapa los cierres de script del codigo del alumno', () => {
    const html = buildHarness('document.body.innerHTML = "</script><script>alert(1)</script>"', 'run-1')
    // El </script> del código no debe cerrar el tag del harness
    expect(html).not.toMatch(/<\/script><script>alert/)
  })

  it('instala el puente de console hacia el padre', () => {
    const html = buildHarness('console.log(1)', 'run-1')
    expect(html).toContain("parent.postMessage")
    expect(html).toContain("type: 'console'")
    expect(html).toContain("type: 'done'")
  })

  it('instala stubs de fetch y localStorage', () => {
    const html = buildHarness('fetch("/api/courses")', 'run-1')
    expect(html).toContain('window.fetch = function')
    expect(html).toContain('/api/courses')
    expect(html).toContain('localStorage')
  })

  it('expone cursos de ejemplo para lecciones que los referencian', () => {
    const html = buildHarness('courses.filter(c => c.active)', 'run-1')
    expect(html).toContain('window.courses =')
    expect(html).toContain('window.fetchUser =')
  })
})

describe('JsEngine.run (timeout en jsdom)', () => {
  it('resuelve con error de timeout cuando el iframe nunca responde', async () => {
    // En jsdom los scripts del iframe no se ejecutan, así que nunca llega
    // el mensaje "done": esto ejercita la red de seguridad del padre.
    const engine = getJsEngine()
    const result = await engine.run('console.log("hola")', { timeoutMs: 40 })
    expect(result.output).toBe('')
    expect(result.error).toMatch(/tiempo límite/i)
  })

  it('elimina el iframe tras finalizar', async () => {
    const engine = new JsEngine()
    const before = document.querySelectorAll('iframe[title="js-engine"]').length
    await engine.run('const a = 1', { timeoutMs: 40 })
    const after = document.querySelectorAll('iframe[title="js-engine"]').length
    expect(after).toBe(before)
  })
})

/** Motor falso: inyecta resultados sin usar iframes (jsdom no ejecuta scripts). */
class FakeEngine extends JsEngine {
  private script: (code: string) => JsRunResult

  constructor(script: (code: string) => JsRunResult) {
    super()
    this.script = script
  }

  async run(code: string): Promise<JsRunResult> {
    return this.script(code)
  }
}

describe('JsEngine.verify', () => {
  it('falla temprano si el codigo tiene un error', async () => {
    const engine = new FakeEngine(() => ({ output: '', error: 'ReferenceError: x is not defined' }))
    const results = await engine.verify({ asserts_stdout: ['hola'] }, 'x')
    expect(results).toHaveLength(1)
    expect(results[0].passed).toBe(false)
    expect(results[0].name).toMatch(/sin errores/)
    expect(results[0].detail).toMatch(/ReferenceError/)
  })

  it('evalua asserts_stdout contra la salida', async () => {
    const engine = new FakeEngine(() => ({ output: 'Hola Erickson\nlisto' }))
    const results = await engine.verify({ asserts_stdout: ['Hola Erickson'] }, 'console.log("Hola Erickson")')
    expect(results).toEqual([{ name: 'Salida contiene: Hola Erickson', passed: true }])
  })

  it('evalua asserts_return comparando la ultima linea JSON', async () => {
    const engine = new FakeEngine((code) => {
      if (code.includes('JSON.stringify')) return { output: '3' }
      return { output: '' }
    })
    const results = await engine.verify({ asserts_return: [{ caso: '2 + 1', esperado: 3 }] }, 'const r = 3')
    expect(results[0].passed).toBe(true)
    expect(results[0].name).toBe('2 + 1 == 3')
  })

  it('detecta asserts_exception que lanzan el tipo esperado', async () => {
    const engine = new FakeEngine(() => ({ output: 'PASS' }))
    const results = await engine.verify(
      { asserts_exception: [{ caso: 'null.x', esperada: 'TypeError' }] },
      'const a = 1'
    )
    expect(results[0].passed).toBe(true)
    expect(results[0].name).toBe('null.x lanza TypeError')
  })

  it('marca asserts_exception como fallido si lanza otro tipo', async () => {
    const engine = new FakeEngine(() => ({ output: 'FAIL: esperaba TypeError, obtuvo RangeError' }))
    const results = await engine.verify(
      { asserts_exception: [{ caso: 'null.x', esperada: 'TypeError' }] },
      'const a = 1'
    )
    expect(results[0].passed).toBe(false)
    expect(results[0].detail).toContain('RangeError')
  })

  it('evalua asserts_forbidden sin ejecutar nada', async () => {
    const engine = new FakeEngine(() => ({ output: 'ok' }))
    const results = await engine.verify({ asserts_forbidden: ['eval('] }, 'console.log("x")')
    expect(results).toEqual([{ name: 'No usa: eval(', passed: true }])
  })

  it('marca test_code como aprobado cuando imprime PASS sin FAIL', async () => {
    const engine = new FakeEngine((code) => {
      // El test_code inyectado es exactamente console.log("PASS")
      if (code.includes('console.log("PASS")')) return { output: 'PASS' }
      return { output: '' }
    })
    const results = await engine.verify({ test_code: 'console.log("PASS")' }, 'const a = 1')
    expect(results[0]).toMatchObject({ name: 'Tests del ejercicio (test_code)', passed: true })
  })
})
