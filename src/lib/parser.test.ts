import { describe, it, expect } from 'vitest'
import { parseLessonsFromJSON, groupLessonsByModule, getLessonById, searchLessons } from './parser'

const mockFiles: Record<string, any[]> = {
  'test1.json': [
    {
      id: 'TEST-001',
      modulo: 'Test Module',
      competencia: 'Test Competencia',
      nivel: 'principiante',
      fase: 1,
      microproyecto: 'Test Project',
      modelo_mental: 'Test mental model',
      codigo_roto: 'broken code',
      diagnostico: 'diagnosis',
      codigo_corregido: 'fixed code',
      codigo_optimizado: 'optimized code',
      disenso_experto: 'debate',
      pregunta_transferencia: 'question',
      quiz: {
        pregunta: 'Test question?',
        opciones: ['A', 'B', 'C', 'D'],
        correcta: 'A',
        explicacion: 'explanation'
      },
      audio_script: 'audio',
      video_prompt: 'video',
      trazabilidad: { libros_fuente: [], conceptos_clave: [] },
      tags_rag: ['test']
    }
  ],
  'test2.json': [
    {
      id: 'TEST-002',
      modulo: 'Test Module',
      competencia: 'Another Test',
      nivel: 'intermedio',
      fase: 1,
      microproyecto: 'Test Project',
      modelo_mental: 'Test mental model 2',
      codigo_roto: 'broken code 2',
      diagnostico: 'diagnosis 2',
      codigo_corregido: 'fixed code 2',
      codigo_optimizado: 'optimized code 2',
      disenso_experto: 'debate 2',
      pregunta_transferencia: 'question 2',
      quiz: {
        pregunta: 'Test question 2?',
        opciones: ['A', 'B', 'C', 'D'],
        correcta: 'B',
        explicacion: 'explanation 2'
      },
      audio_script: 'audio 2',
      video_prompt: 'video 2',
      trazabilidad: { libros_fuente: [], conceptos_clave: [] },
      tags_rag: ['test', 'another']
    }
  ]
}

describe('parser.ts', () => {
  it('should parse lessons from JSON files', () => {
    const lessons = parseLessonsFromJSON(mockFiles)
    expect(lessons).toHaveLength(2)
    expect(lessons[0].id).toBe('TEST-001')
    expect(lessons[1].id).toBe('TEST-002')
  })

  it('should group lessons by module', () => {
    const lessons = parseLessonsFromJSON(mockFiles)
    const modules = groupLessonsByModule(lessons)
    expect(modules).toHaveLength(1)
    expect(modules[0].nombre).toBe('Test Module')
    expect(modules[0].lecciones).toHaveLength(2)
  })

  it('should get lesson by id', () => {
    const lessons = parseLessonsFromJSON(mockFiles)
    const lesson = getLessonById(lessons, 'TEST-001')
    expect(lesson).toBeDefined()
    expect(lesson?.competencia).toBe('Test Competencia')
  })

  it('should return undefined for non-existent lesson', () => {
    const lessons = parseLessonsFromJSON(mockFiles)
    const lesson = getLessonById(lessons, 'NON-EXISTENT')
    expect(lesson).toBeUndefined()
  })

  it('should search lessons by tag', () => {
    const lessons = parseLessonsFromJSON(mockFiles)
    const results = searchLessons(lessons, 'test')
    expect(results).toHaveLength(2)
  })

  it('should search lessons by competencia', () => {
    const lessons = parseLessonsFromJSON(mockFiles)
    const results = searchLessons(lessons, 'Another')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('TEST-002')
  })

  it('should handle empty files', () => {
    const lessons = parseLessonsFromJSON({})
    expect(lessons).toHaveLength(0)
  })

  it('should skip invalid lessons', () => {
    const invalidFiles: Record<string, any[]> = {
      'invalid.json': [{ invalid: 'data' }]
    }
    const lessons = parseLessonsFromJSON(invalidFiles)
    expect(lessons).toHaveLength(0)
  })
})
