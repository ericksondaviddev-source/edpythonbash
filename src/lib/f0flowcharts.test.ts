import { describe, it, expect } from 'vitest'
import { validateFlowchart } from './flowchartValidate'
import { flowchartToCode } from './flowchartToPseudo'
import { isFlowchartLesson, parseLessonsFromJSON } from './parser'
import type { Lesson } from '../types/lesson'
import rawF0 from '../data/modulos/F0.0.json'

const lessons = rawF0 as unknown as Lesson[]

describe('F0.0 · módulo de diagramas de flujo', () => {
  it('todas las lecciones superan el validador del parser', () => {
    const parsed = parseLessonsFromJSON({ 'F0.0.json': lessons })
    expect(parsed).toHaveLength(lessons.length)
    expect(lessons.every(l => isFlowchartLesson(l))).toBe(true)
  })

  it('cada lección declara modo y objetivo', () => {
    for (const l of lessons) {
      expect(['view', 'build']).toContain(l.flowchart_mode)
      expect(l.flowchart_objetivo).toBeTruthy()
    }
  })

  it('los diagramas de las lecciones «view» son estructuralmente válidos', () => {
    for (const l of lessons.filter(x => x.flowchart_mode === 'view')) {
      expect(l.flowchart_data, `${l.id} sin flowchart_data`).toBeTruthy()
      const issues = validateFlowchart(l.flowchart_data!)
      expect(issues, `${l.id}: ${JSON.stringify(issues)}`).toEqual([])
    }
  })

  it('los lienzos iniciales de las lecciones «build» se pueden partir de cero o parcial', () => {
    for (const l of lessons.filter(x => x.flowchart_mode === 'build')) {
      expect(l.flowchart_starter, `${l.id} sin flowchart_starter`).toBeTruthy()
      expect(l.flowchart_rules?.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('el lienzo inicial de una lección «build» nunca es ya válido (debe haber trabajo)', () => {
    for (const l of lessons.filter(x => x.flowchart_mode === 'build')) {
      const issues = validateFlowchart(l.flowchart_starter!)
      expect(issues.length, `${l.id} empezaría ya resuelta`).toBeGreaterThan(0)
    }
  })

  it('el pseudocódigo generado de los diagramas «view» está completo', () => {
    for (const l of lessons.filter(x => x.flowchart_mode === 'view')) {
      const out = flowchartToCode(l.flowchart_data!)
      expect(out.pseudo.startsWith('INICIO'), `${l.id} no empieza en INICIO`).toBe(true)
      expect(out.pseudo.endsWith('FIN'), `${l.id} no termina en FIN`).toBe(true)
      expect(out.complete, `${l.id} incompleto`).toBe(true)
      expect(out.pseudo.split('\n').filter(x => x === 'FIN')).toHaveLength(1)
    }
  })

  it('la rama «Sí» se emite antes que la «No» en todos los diagramas con decisión', () => {
    for (const l of lessons.filter(x => x.flowchart_mode === 'view')) {
      const out = flowchartToCode(l.flowchart_data!)
      if (!out.pseudo.includes('SI ')) continue
      const si = out.pseudo.indexOf('SI ')
      const sino = out.pseudo.indexOf('\nSINO\n')
      expect(sino, `${l.id}: sin rama SINO`).toBeGreaterThan(si)
    }
  })

  it('el código que teclea el Tutor coincide con el pseudocódigo generado', () => {
    for (const l of lessons) {
      const src = l.flowchart_data!
      expect(src, `${l.id} sin diagrama de solución`).toBeTruthy()
      expect(l.codigo_corregido, `${l.id} desincronizado del diagrama`).toBe(flowchartToCode(src).pseudo)
    }
  })

  it('la solución de cada ejercicio «build» es válida y alcanzable', () => {
    for (const l of lessons.filter(x => x.flowchart_mode === 'build')) {
      const issues = validateFlowchart(l.flowchart_data!)
      expect(issues, `${l.id} solución inválida: ${JSON.stringify(issues)}`).toEqual([])
    }
  })

  it('la solución respeta las reglas que se muestran al alumno', () => {
    for (const l of lessons.filter(x => x.flowchart_mode === 'build')) {
      const nodes = l.flowchart_data!.nodes
      const edges = l.flowchart_data!.edges
      const starts = nodes.filter(n => n.type === 'start')
      const ends = nodes.filter(n => n.type === 'end')
      expect(starts, `${l.id}: inicios`).toHaveLength(1)
      expect(ends.length, `${l.id}: finales`).toBeGreaterThan(0)
      for (const d of nodes.filter(n => n.type === 'decision')) {
        const out = edges.filter(e => e.source === d.id)
        expect(out.filter(e => e.label).length, `${l.id} ramas sin etiqueta`).toBeGreaterThanOrEqual(2)
      }
    }
  })
})
