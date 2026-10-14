import { describe, it, expect } from 'vitest'
import { validateFlowchart } from './flowchartValidate'
import { flowchartToCode } from './flowchartToPseudo'
import rawF03 from '../data/modulos/F0.3.json'
import type { Lesson } from '../types/lesson'

const lessons = rawF03 as unknown as Lesson[]
const withFlowchart = lessons.filter(l => l.flowchart_mode === 'view')

describe('F0.3 · diagramas de flujo de las lecciones JS', () => {
  it('las tres lecciones con diagrama declaran modo y datos', () => {
    expect(withFlowchart.map(l => l.id).sort()).toEqual(['F0.3-011', 'F0.3-012', 'F0.3-014'])
    for (const l of withFlowchart) {
      expect(l.flowchart_data, `${l.id} sin flowchart_data`).toBeTruthy()
      expect(l.flowchart_mode).toBe('view')
    }
  })

  it('los diagramas son estructuralmente válidos', () => {
    for (const l of withFlowchart) {
      const issues = validateFlowchart(l.flowchart_data!)
      expect(issues, `${l.id}: ${JSON.stringify(issues)}`).toEqual([])
    }
  })

  it('el pseudocódigo generado está completo (INICIO … FIN, sin ciclos huérfanos)', () => {
    for (const l of withFlowchart) {
      const out = flowchartToCode(l.flowchart_data!)
      expect(out.pseudo.startsWith('INICIO'), `${l.id} no empieza en INICIO`).toBe(true)
      expect(out.pseudo.endsWith('FIN'), `${l.id} no termina en FIN`).toBe(true)
      expect(out.complete, `${l.id} incompleto`).toBe(true)
      expect(out.pseudo.split('\n').filter(x => x === 'FIN')).toHaveLength(1)
    }
  })

  it('el código JavaScript generado cierra bloques if/else correctamente', () => {
    for (const l of withFlowchart) {
      const out = flowchartToCode(l.flowchart_data!)
      expect(out.javascript.startsWith('// INICIO'), `${l.id} JS no empieza en // INICIO`).toBe(true)
      expect(out.javascript.endsWith('// FIN'), `${l.id} JS no termina en // FIN`).toBe(true)
      // Los bloques de decisión deben cerrar con llave antes del // FIN
      if (out.javascript.includes('} else {') || out.javascript.includes('if (')) {
        expect(out.javascript).toMatch(/\}\s*\n\/\/ FIN$/)
      }
    }
  })

  it('la rama «Sí» se emite antes que la «No» en los diagramas con decisión', () => {
    for (const l of withFlowchart) {
      const out = flowchartToCode(l.flowchart_data!)
      if (!out.pseudo.includes('SI ')) continue
      const si = out.pseudo.indexOf('SI ')
      const sino = out.pseudo.indexOf('\nSINO\n')
      expect(sino, `${l.id}: sin rama SINO`).toBeGreaterThan(si)
    }
  })

  it('cada diagrama tiene exactamente un nodo de inicio', () => {
    for (const l of withFlowchart) {
      const starts = l.flowchart_data!.nodes.filter(n => n.type === 'start')
      expect(starts, `${l.id}: inicios`).toHaveLength(1)
    }
  })

  it('los nodos de decisión tienen al menos dos ramas etiquetadas', () => {
    for (const l of withFlowchart) {
      const edges = l.flowchart_data!.edges
      for (const d of l.flowchart_data!.nodes.filter(n => n.type === 'decision')) {
        const outs = edges.filter(e => e.source === d.id)
        expect(outs.filter(e => e.label).length, `${l.id} ramas sin etiqueta`).toBeGreaterThanOrEqual(2)
      }
    }
  })
})
