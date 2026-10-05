import { describe, it, expect } from 'vitest'
import { buildQuestionBank, shuffleOptions, mulberry } from './questionBank'
import type { Lesson, Quiz } from '../types/lesson'

const mockQuiz: Quiz = {
  pregunta: 'Pregunta base del JSON',
  opciones: ['op A', 'op B', 'op C', 'op D'],
  correcta: 'B',
  explicacion: 'Explicación base'
}

function mockLesson(id: string, quizIaCount = 0): Lesson {
  return {
    id,
    modulo: 'M-test',
    competencia: 'Test',
    nivel: 'principiante',
    fase: 1,
    microproyecto: '',
    modelo_mental: 'x'.repeat(50),
    codigo_roto: 'print("hola")',
    diagnostico: 'd'.repeat(50),
    codigo_corregido: 'print("hola")',
    codigo_optimizado: 'print("hola")',
    disenso_experto: '',
    pregunta_transferencia: 't'.repeat(50),
    quiz: mockQuiz,
    quiz_ia: Array.from({ length: quizIaCount }, (_, i) => ({
      pregunta: `Pregunta IA ${i} con texto suficiente`,
      opciones: [`ia${i}a`, `ia${i}b`, `ia${i}c`, `ia${i}d`],
      correcta: ['A', 'B', 'C', 'D'][i % 4],
      explicacion: `Explicación IA ${i} suficientemente larga`,
      tipo: 'concepto' as const
    })),
    audio_script: '',
    video_prompt: '',
    trazabilidad: { libros_fuente: [], conceptos_clave: [] },
    tags_rag: []
  } as Lesson
}

describe('questionBank', () => {
  it('incluye quiz_ia justo después de la pregunta del JSON', () => {
    const bank = buildQuestionBank(mockQuiz, mockLesson('M-t-001', 3))
    const ia = bank.filter(q => q.pregunta.startsWith('Pregunta IA'))
    expect(ia.length).toBe(3)
  })

  it('limita el banco a 8 preguntas', () => {
    const bank = buildQuestionBank(mockQuiz, mockLesson('M-t-002', 4))
    expect(bank.length).toBeLessThanOrEqual(8)
  })

  it('es determinista: mismo seed, mismo banco', () => {
    const a = buildQuestionBank(mockQuiz, mockLesson('M-t-003', 2))
    const b = buildQuestionBank(mockQuiz, mockLesson('M-t-003', 2))
    expect(a).toEqual(b)
  })

  it('remapea la correcta al barajar opciones (el texto correcto se conserva)', () => {
    const q = {
      pregunta: 'P',
      opciones: ['primera', 'segunda', 'tercera', 'cuarta'],
      correcta: 'C',
      explicacion: 'E',
      tipo: 'concepto' as const
    }
    const shuffled = shuffleOptions(q, mulberry(42))
    const idx = shuffled.correcta.charCodeAt(0) - 65
    expect(shuffled.opciones[idx]).toBe('tercera')
    expect([...shuffled.opciones].sort()).toEqual(['cuarta', 'primera', 'segunda', 'tercera'])
  })

  it('distribuye las correctas (no todo A) en un banco real', () => {
    const bank = buildQuestionBank(mockQuiz, mockLesson('M-t-004', 3))
    const letters = new Set(bank.map(q => q.correcta))
    expect(letters.size).toBeGreaterThan(1)
  })
})
