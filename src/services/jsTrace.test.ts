import { describe, it, expect } from 'vitest'
import {
  extractTraceVars,
  instrumentForTrace,
  buildTraceHarness,
  MAX_TRACE_STEPS,
} from './jsEngine'

describe('extractTraceVars', () => {
  it('extrae const, let y var', () => {
    const code = 'const a = 1;\nlet b = 2;\nvar c = 3;'
    expect(extractTraceVars(code)).toEqual(['a', 'b', 'c'])
  })

  it('omite repetidos y comentarios', () => {
    const code = '// const fake = 0;\nconst x = 1;\nconst x = 2;'
    expect(extractTraceVars(code)).toEqual(['x'])
  })

  it('captura variables indentadas dentro de bloques', () => {
    const code = 'function f() {\n  const inner = 5;\n}\n'
    expect(extractTraceVars(code)).toContain('inner')
  })

  it('devuelve vacío si no hay declaraciones', () => {
    expect(extractTraceVars('console.log(1);')).toEqual([])
  })
})

describe('instrumentForTrace', () => {
  it('inyecta __snap__ tras sentencias que terminan en ;', () => {
    const out = instrumentForTrace('const x = 1;')
    expect(out).toBe('const x = 1; __snap__(1);')
  })

  it('usa el número de línea original', () => {
    const out = instrumentForTrace('const a = 1;\nconst b = 2;')
    const lines = out.split('\n')
    expect(lines[0]).toContain('__snap__(1)')
    expect(lines[1]).toContain('__snap__(2)')
  })

  it('no instrumenta líneas vacías ni comentarios', () => {
    const out = instrumentForTrace('\n// hola\nconst x = 1;')
    expect(out.split('\n')[0]).not.toContain('__snap__')
    expect(out.split('\n')[1]).not.toContain('__snap__')
    expect(out.split('\n')[2]).toContain('__snap__(3)')
  })

  it('instrumenta un } suelto (cierre de bloque)', () => {
    const out = instrumentForTrace('if (a) {\n  b();\n}')
    expect(out.split('\n')[2]).toBe('} __snap__(3);')
  })

  it('inserta el snapshot antes del comentario final (no dentro del //)', () => {
    const out = instrumentForTrace('const x = 1; // fin')
    expect(out).toBe('const x = 1; __snap__(1); // fin')
  })

  it('no instrumenta cabeceras de if/else que abren con {', () => {
    const out = instrumentForTrace('if (a) {')
    expect(out).toBe('if (a) {')
  })

  it('no trata // dentro de una cadena como comentario', () => {
    const out = instrumentForTrace("const u = 'a//b';")
    expect(out).toBe("const u = 'a//b'; __snap__(1);")
  })

  it('instrumenta un } indentado (cierre de bloque)', () => {
    const out = instrumentForTrace('function f() {\n  g();\n  }\n')
    expect(out.split('\n')[2]).toBe('  } __snap__(3);')
  })
})

describe('buildTraceHarness', () => {
  it('contiene las variables extraídas y el límite de pasos', () => {
    const html = buildTraceHarness('const total = 0;', 'run-1')
    expect(html).toContain('var __names = ["total"]')
    expect(html).toContain(String(MAX_TRACE_STEPS))
    expect(html).toContain("type: 'trace'")
  })

  it('define __snap__ en el mismo scope que el código del alumno', () => {
    const html = buildTraceHarness('const x = 1;', 'run-1')
    expect(html).toContain('function __snap__(lineno)')
    expect(html).toContain('const x = 1; __snap__(1);')
  })

  it('escapa cierres de script del alumno', () => {
    const html = buildTraceHarness('const s = "</script>";', 'run-1')
    expect(html).toContain('<\\/script')
  })
})
