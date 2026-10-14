import { describe, it, expect } from 'vitest'
import { flowchartToCode } from './flowchartToPseudo'
import type { FlowchartData, FlowchartNode, FlowchartEdge } from '../types/lesson'

const n = (id: string, type: FlowchartNode['type'], label: string): FlowchartNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { label },
})

const e = (source: string, target: string, label?: string): FlowchartEdge => ({
  id: `${source}->${target}`,
  source,
  target,
  label,
})

describe('flowchartToCode', () => {
  it('traduce un flujo secuencial', () => {
    const d: FlowchartData = {
      nodes: [n('s', 'start', 'Inicio'), n('p', 'process', 'leer entrada'), n('z', 'end', 'Fin')],
      edges: [e('s', 'p'), e('p', 'z')],
    }
    const out = flowchartToCode(d)
    expect(out.pseudo).toBe('INICIO\nleer entrada\nFIN')
    expect(out.python).toBe('# INICIO\n# leer entrada\n# FIN')
    expect(out.javascript).toBe('// INICIO\n// leer entrada\n// FIN')
    expect(out.complete).toBe(true)
  })

  it('traduce una decisión con ramas Sí y No', () => {
    const d: FlowchartData = {
      nodes: [
        n('s', 'start', 'Inicio'),
        n('d', 'decision', '¿llueve?'),
        n('a', 'process', 'llevar paraguas'),
        n('b', 'process', 'salir con gafas de sol'),
        n('z', 'end', 'Fin'),
      ],
      edges: [e('s', 'd'), e('d', 'a', 'Sí'), e('d', 'b', 'No'), e('a', 'z'), e('b', 'z')],
    }
    const out = flowchartToCode(d)
    expect(out.pseudo).toBe(
      [
        'INICIO',
        'SI ¿llueve? (Sí) ENTONCES',
        '    llevar paraguas',
        'SINO',
        '    salir con gafas de sol',
        'FIN SI',
        'FIN',
      ].join('\n')
    )
    expect(out.python).toContain('if ¿llueve? (Sí):')
    expect(out.python).toContain('else:')
    expect(out.javascript).toContain('if (¿llueve? (Sí)) {')
    expect(out.javascript).toContain('} else {')
    expect(out.javascript).toMatch(/\}\s*\n\/\/ FIN$/)
    expect(out.complete).toBe(true)
  })

  it('pone la rama «Sí» primero aunque el JSON la traiga al final', () => {
    const d: FlowchartData = {
      nodes: [
        n('s', 'start', 'Inicio'),
        n('d', 'decision', '¿terminó?'),
        n('b', 'process', 'cuerpo'),
        n('z', 'end', 'Fin'),
      ],
      edges: [e('s', 'd'), e('d', 'b', 'No'), e('d', 'z', 'Sí')],
    }
    const out = flowchartToCode(d)
    const lines = out.pseudo.split('\n')
    expect(lines[1]).toBe('SI ¿terminó? (Sí) ENTONCES')
    expect(lines[2]).toBe('SINO')
    expect(lines[3]).toBe('    cuerpo')
  })

  it('marca el arco de vuelta de un bucle en lugar de iterar infinitamente', () => {
    const d: FlowchartData = {
      nodes: [
        n('s', 'start', 'Inicio'),
        n('d', 'decision', '¿jugamos otra vez?'),
        n('b', 'process', 'pedir otro número'),
        n('t', 'process', 'mostrar total'),
        n('z', 'end', 'Fin'),
      ],
      edges: [
        e('s', 'd'),
        e('d', 'b', 'Sí'),
        e('d', 't', 'No'),
        e('b', 'd'),
        e('t', 'z'),
      ],
    }
    const out = flowchartToCode(d)
    expect(out.pseudo).toContain('⤴ volver a "¿jugamos otra vez?"')
    expect(out.pseudo.split('\n').filter(l => l === 'FIN').length).toBe(1)
    expect(out.pseudo.trimEnd().endsWith('FIN')).toBe(true)
    expect(out.complete).toBe(true)
  })

  it('devuelve vacío si no hay nodo de inicio', () => {
    const d: FlowchartData = { nodes: [n('p', 'process', 'x')], edges: [] }
    const out = flowchartToCode(d)
    expect(out.pseudo).toBe('')
    expect(out.python).toBe('')
    expect(out.javascript).toBe('')
    expect(out.complete).toBe(false)
  })

  it('marca incompleto si un proceso no tiene salida', () => {
    const d: FlowchartData = {
      nodes: [n('s', 'start', 'Inicio'), n('p', 'process', 'x')],
      edges: [e('s', 'p')],
    }
    expect(flowchartToCode(d).complete).toBe(false)
  })
})
