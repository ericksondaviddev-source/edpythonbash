import { describe, it, expect } from 'vitest'
import { getInstructionVideos } from './instructionVideos'

describe('getInstructionVideos', () => {
  it('devuelve 3 videos con ids estables', () => {
    const videos = getInstructionVideos('es')
    expect(videos.map(v => v.id)).toEqual(['empezar', 'codigo-real', 'tutor-ia'])
  })

  it('cada video tiene titulo, descripcion y al menos 3 escenas con codigo y narracion', () => {
    for (const lang of ['es', 'en'] as const) {
      const videos = getInstructionVideos(lang)
      for (const v of videos) {
        expect(v.title.trim().length).toBeGreaterThan(0)
        expect(v.description.trim().length).toBeGreaterThan(0)
        expect(v.scenes.length).toBeGreaterThanOrEqual(3)
        for (const s of v.scenes) {
          expect(s.code.trim().length).toBeGreaterThan(0)
          expect(s.narration.trim().length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('las escenas son compatibles con TutorStep (code + narration)', () => {
    const videos = getInstructionVideos('en')
    for (const v of videos) {
      for (const s of v.scenes) {
        expect(Object.keys(s).sort()).toEqual(['code', 'narration'])
      }
    }
  })
})
