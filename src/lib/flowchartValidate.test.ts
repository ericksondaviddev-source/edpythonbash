import { describe, it, expect } from 'vitest'
import { validateFlowchart, isYesLabel } from './flowchartValidate'
import type { FlowchartData, FlowchartNode, FlowchartEdge } from '../types/lesson'

const n = (id: string, type: FlowchartNode['type'], label = id): FlowchartNode => ({
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

const codes = (d: FlowchartData) => validateFlowchart(d).map(i => i.code)

describe('validateFlowchart', () => {
  it('rechaza un diagrama vacío', () => {
    expect(codes({ nodes: [], edges: [] })).toEqual(['empty'])
  })

  it('exige un nodo de inicio', () => {
    const d = { nodes: [n('a', 'process'), n('z', 'end')], edges: [e('a', 'z')] }
    expect(codes(d)).toContain('no_start')
  })

  it('exige un nodo de fin', () => {
    const d = { nodes: [n('s', 'start'), n('a', 'process')], edges: [e('s', 'a')] }
    expect(codes(d)).toContain('no_end')
  })

  it('acepta un flujo secuencial completo', () => {
    const d = {
      nodes: [n('s', 'start'), n('a', 'process'), n('z', 'end')],
      edges: [e('s', 'a'), e('a', 'z')],
    }
    expect(validateFlowchart(d)).toEqual([])
  })

  it('detecta decisión sin dos ramas etiquetadas', () => {
    const d = {
      nodes: [n('s', 'start'), n('d', 'decision'), n('a', 'process'), n('z', 'end')],
      edges: [e('s', 'd'), e('d', 'a'), e('a', 'z')],
    }
    expect(codes(d)).toContain('decision_branches')
  })

  it('acepta una decisión con ramas Sí y No etiquetadas', () => {
    const d = {
      nodes: [n('s', 'start'), n('d', 'decision'), n('y', 'process'), n('z', 'end')],
      edges: [e('s', 'd'), e('d', 'y', 'Sí'), e('y', 'z'), e('d', 'z', 'No')],
    }
    expect(validateFlowchart(d)).toEqual([])
  })

  it('detecta un callejón sin salida y nodos sin alcanzar', () => {
    const d = {
      nodes: [n('s', 'start'), n('a', 'process'), n('z', 'end')],
      edges: [e('s', 'a')],
    }
    const found = codes(d)
    expect(found).toContain('dead_end')
    expect(found).toContain('unreachable')
  })

  it('detecta nodos inalcanzables desde el inicio', () => {
    const d = {
      nodes: [n('s', 'start'), n('a', 'process'), n('z', 'end'), n('h', 'process')],
      edges: [e('s', 'a'), e('a', 'z')],
    }
    expect(codes(d)).toContain('unreachable')
  })

  it('detecta fin con flechas de salida', () => {
    const d = {
      nodes: [n('s', 'start'), n('z', 'end'), n('a', 'process')],
      edges: [e('s', 'z'), e('z', 'a')],
    }
    expect(codes(d)).toContain('end_outgoing')
  })

  it('detecta más de un inicio', () => {
    const d = {
      nodes: [n('s', 'start'), n('s2', 'start'), n('z', 'end')],
      edges: [e('s', 'z')],
    }
    const issue = validateFlowchart(d).find(i => i.code === 'multiple_starts')
    expect(issue?.params).toEqual({ total: 2 })
  })
})

describe('isYesLabel', () => {
  it('reconoce variantes de "sí"', () => {
    expect(isYesLabel('sí')).toBe(true)
    expect(isYesLabel('Sí')).toBe(true)
    expect(isYesLabel('yes')).toBe(true)
    expect(isYesLabel('No')).toBe(false)
    expect(isYesLabel(undefined)).toBe(false)
  })
})
