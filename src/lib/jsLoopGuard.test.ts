import { describe, it, expect } from 'vitest'
import { injectLoopGuard, MAX_LOOP_ITERATIONS, TICK_FN } from './jsLoopGuard'

describe('injectLoopGuard', () => {
  it('inyecta el guard en un while simple', () => {
    const out = injectLoopGuard('let i = 0;\nwhile (i < 10) {\n  i++;\n}')
    expect(out).toContain(`while ((i < 10) && ${TICK_FN}())`)
  })

  it('inyecta el guard en un for con las tres partes', () => {
    const out = injectLoopGuard('for (let i = 0; i < 3; i++) {\n  console.log(i);\n}')
    expect(out).toContain(`for (let i = 0; (i < 3) && ${TICK_FN}(); i++)`)
  })

  it('convierte un for(;;) sin condicion en un tick', () => {
    const out = injectLoopGuard('for (;;) {\n  break;\n}')
    expect(out).toContain(`for (; ${TICK_FN}();)`)
  })

  it('no toca for...of ni for...in', () => {
    const src = 'for (const x of arr) {\n  console.log(x);\n}\nfor (const k in obj) {\n  console.log(k);\n}'
    const out = injectLoopGuard(src)
    expect(out).not.toContain(TICK_FN)
  })

  it('ignora "while" dentro de un string', () => {
    const src = 'const s = "while (true) { }";\nconsole.log(s);'
    const out = injectLoopGuard(src)
    expect(out).toBe(src)
  })

  it('ignora "while" dentro de un comentario', () => {
    const src = '// while (true) {}\nconst a = 1;'
    const out = injectLoopGuard(src)
    expect(out).toBe(src)
  })

  it('ignora "while" dentro de un bloque de comentario', () => {
    const src = '/* while (true) {} */\nconst a = 1;'
    const out = injectLoopGuard(src)
    expect(out).toBe(src)
  })

  it('respeta parentesis anidados en la condicion', () => {
    const out = injectLoopGuard('while ((a && (b || c)) || d) {\n  x();\n}')
    expect(out).toContain(`while (((a && (b || c)) || d) && ${TICK_FN}())`)
  })

  it('no modifica codigo sin bucles', () => {
    const src = 'const a = 1;\nconsole.log(a);'
    expect(injectLoopGuard(src)).toBe(src)
  })

  it('incluye el preambulo con el limite de iteraciones', () => {
    const out = injectLoopGuard('while (true) {}')
    expect(out).toContain(String(MAX_LOOP_ITERATIONS))
    expect(out).toContain(`function ${TICK_FN}(`)
  })

  it('maneja while sin llaves (una sola sentencia)', () => {
    const out = injectLoopGuard('while (i < 5) i++;')
    expect(out).toContain(`while ((i < 5) && ${TICK_FN}())`)
  })

  it('ignora un identificador que empieza como while (whileX)', () => {
    const src = 'const whileX = 1;\nconsole.log(whileX);'
    expect(injectLoopGuard(src)).toBe(src)
  })

  it('ignora forX por el mismo motivo', () => {
    const src = 'const forEach = [1, 2];\nconsole.log(forEach);'
    expect(injectLoopGuard(src)).toBe(src)
  })
})
