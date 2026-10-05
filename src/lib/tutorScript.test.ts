import { describe, it, expect } from 'vitest'
import { buildTutorSteps } from './tutorScript'

describe('buildTutorSteps (offline derivation)', () => {
  it('divide un código de 8 líneas en 2 pasos (máx 6 por paso)', () => {
    const code = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8'].join('\n')
    const steps = buildTutorSteps({ codigo_corregido: code, audio_script: 'Párrafo uno.\n\nPárrafo dos.' })
    expect(steps).toHaveLength(2)
    expect(steps[0].code.split('\n')).toHaveLength(6)
    expect(steps[1].code.split('\n')).toHaveLength(2)
    // narración repartida proporcionalmente
    expect(steps[0].narration).toContain('Párrafo uno')
    expect(steps[1].narration).toContain('Párrafo dos')
  })

  it('separa pasos por líneas en blanco y no deja atrás el cuerpo indentado', () => {
    const code = 'def f():\n    return 1\n\nx = f()'
    const steps = buildTutorSteps({ codigo_corregido: code, audio_script: 'A.\n\nB.' })
    expect(steps).toHaveLength(2)
    expect(steps[0].code).toContain('def f():')
    expect(steps[0].code).toContain('return 1')
    expect(steps[1].code).toContain('x = f()')
  })

  it('código vacío devuelve lista vacía', () => {
    expect(buildTutorSteps({ codigo_corregido: '   \n ', audio_script: 'Algo.' })).toEqual([])
  })

  it('sin audio_script devuelve pasos con narración vacía', () => {
    const steps = buildTutorSteps({ codigo_corregido: 'x = 1\nprint(x)', audio_script: '' })
    expect(steps).toHaveLength(1)
    expect(steps[0].narration).toBe('')
    expect(steps[0].code).toBe('x = 1\nprint(x)')
  })

  it('una sola línea genera un solo paso', () => {
    const steps = buildTutorSteps({ codigo_corregido: 'print("hola")', audio_script: 'Saluda.' })
    expect(steps).toHaveLength(1)
    expect(steps[0].code).toBe('print("hola")')
    expect(steps[0].narration).toBe('Saluda.')
  })
})
