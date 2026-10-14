import { describe, it, expect } from 'vitest'
import { ALL_BLOCKS } from './blockDefs'
import rawF03 from '../data/modulos/F0.3.json'
import rawM11 from '../data/modulos/Módulo 1.1.json'
import es from '../i18n/es.json'
import en from '../i18n/en.json'
import type { Lesson } from '../types/lesson'

const lessons = [...(rawF03 as unknown as Lesson[]), ...(rawM11 as unknown as Lesson[])]

describe('reto de bloques requeridos', () => {
  const withReto = lessons.filter(l => l.simulador?.bloques_requeridos?.length)

  it('hay lecciones sembradas con bloques requeridos', () => {
    expect(withReto.length).toBeGreaterThanOrEqual(3)
    const ids = withReto.map(l => l.id)
    expect(ids).toContain('M1.1-001')
    expect(ids).toContain('M1.1-007')
    expect(ids).toContain('F0.3-011')
  })

  it('cada bloque requerido existe en las paletas y tiene traducción', () => {
    const paletteIds = ALL_BLOCKS.map(b => b.id)
    for (const lesson of withReto) {
      for (const id of lesson.simulador!.bloques_requeridos!) {
        expect(paletteIds, `${lesson.id}: ${id}`).toContain(id)
        const esBlocks = (es as Record<string, Record<string, unknown>>).blocks
        const enBlocks = (en as Record<string, Record<string, unknown>>).blocks
        expect(esBlocks[id], `es.json: ${id}`).toBeTruthy()
        expect(enBlocks[id], `en.json: ${id}`).toBeTruthy()
      }
    }
  })
})
