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

const fakeLesson = (id: string, modulo: string, fase: number) =>
  ({
    id,
    modulo,
    competencia: `C ${id}`,
    nivel: 'principiante',
    fase,
    microproyecto: '',
    modelo_mental: 'm',
    codigo_roto: 'c',
    diagnostico: 'd',
    codigo_corregido: 'cc',
    codigo_optimizado: 'co',
    disenso_experto: 'de',
    pregunta_transferencia: 'pt',
    quiz: { pregunta: 'p', opciones: ['a', 'b'], correcta: 'A', explicacion: 'e' },
    audio_script: 'a',
    video_prompt: 'v',
    trazabilidad: { libros_fuente: [], conceptos_clave: [] },
    tags_rag: []
  }) as Lesson

describe('orden de secuencia', () => {
  it('ordena lecciones por id numérico dentro del módulo', () => {
    const lessons = [
      fakeLesson('M3.4-006', 'Módulo 3.4', 3),
      fakeLesson('M3.4-003', 'Módulo 3.4', 3),
      fakeLesson('M3.4-010', 'Módulo 3.4', 3)
    ]
    const modules = groupLessonsByModule(lessons)
    expect(modules[0].lecciones.map(l => l.id)).toEqual([
      'M3.4-003',
      'M3.4-006',
      'M3.4-010'
    ])
  })

  it('ordena módulos por fase y número (3.1 antes que 3.4)', () => {
    const lessons = [
      fakeLesson('M3.4-001', 'Módulo 3.4', 3),
      fakeLesson('M3.1-001', 'Módulo 3.1', 3),
      fakeLesson('F0.1-001', 'F0.1', 0),
      fakeLesson('M1.1-001', 'Módulo 1.1', 1)
    ]
    const modules = groupLessonsByModule(lessons)
    expect(modules.map(m => m.id)).toEqual(['F0.1', 'Módulo 1.1', 'Módulo 3.1', 'Módulo 3.4'])
  })

  it('extrae el número de módulos con nombre descriptivo', () => {
    const lessons = [
      fakeLesson('M3.5-001', '3.5 - Rendimiento y Optimización', 3),
      fakeLesson('M3.2-001', 'Módulo 3.2', 3)
    ]
    const modules = groupLessonsByModule(lessons)
    expect(modules.map(m => m.id)).toEqual(['Módulo 3.2', '3.5 - Rendimiento y Optimización'])
  })
})
