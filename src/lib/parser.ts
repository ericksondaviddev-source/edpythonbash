import type { Lesson, Module } from '../types/lesson'

export function parseLessonsFromJSON(files: Record<string, any[]>): Lesson[] {
  const lessons: Lesson[] = []

  for (const [filename, content] of Object.entries(files)) {
    if (filename.includes('profiling_sim') || filename.includes('EXTENSIÓN')) continue
    if (Array.isArray(content)) {
      for (const item of content) {
        if (isValidLesson(item)) {
          lessons.push(item as Lesson)
        }
      }
    }
  }

  return lessons
}

function isValidLesson(item: any): boolean {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.modulo === 'string' &&
    typeof item.competencia === 'string' &&
    typeof item.modelo_mental === 'string' &&
    typeof item.codigo_roto === 'string' &&
    typeof item.diagnostico === 'string' &&
    typeof item.codigo_corregido === 'string' &&
    typeof item.codigo_optimizado === 'string' &&
    item.quiz &&
    typeof item.quiz.pregunta === 'string' &&
    Array.isArray(item.quiz.opciones) &&
    typeof item.quiz.correcta === 'string' &&
    typeof item.quiz.explicacion === 'string'
  )
}

function extractModuleNumber(modulo: string): number {
  const match = modulo.match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 999
}

export function groupLessonsByModule(lessons: Lesson[]): Module[] {
  const moduleMap = new Map<string, Lesson[]>()

  for (const lesson of lessons) {
    if (!moduleMap.has(lesson.modulo)) {
      moduleMap.set(lesson.modulo, [])
    }
    moduleMap.get(lesson.modulo)!.push(lesson)
  }

  const modules: Module[] = []
  for (const [modulo, lecciones] of moduleMap) {
    const sorted = [...lecciones].sort((a, b) =>
      a.id.localeCompare(b.id, 'en', { numeric: true })
    )
    modules.push({
      id: modulo,
      nombre: modulo,
      fase: sorted[0].fase,
      lecciones: sorted
    })
  }

  return modules.sort(
    (a, b) => a.fase - b.fase || extractModuleNumber(a.id) - extractModuleNumber(b.id)
  )
}

export function flattenOrderedLessons(modules: Module[]): Lesson[] {
  return modules.flatMap(m => m.lecciones)
}

export function getLessonById(lessons: Lesson[], id: string): Lesson | undefined {
  return lessons.find(l => l.id === id)
}

export function getLessonsByTag(lessons: Lesson[], tag: string): Lesson[] {
  return lessons.filter(l => l.tags_rag.includes(tag))
}

export function searchLessons(lessons: Lesson[], query: string): Lesson[] {
  const q = query.toLowerCase()
  return lessons.filter(
    l =>
      l.competencia.toLowerCase().includes(q) ||
      l.modelo_mental.toLowerCase().includes(q) ||
      l.tags_rag.some(t => t.toLowerCase().includes(q))
  )
}
