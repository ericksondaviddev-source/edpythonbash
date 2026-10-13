import type { Lesson, LessonSummary, Module } from '../types/lesson'
import catalogJson from '../data/catalog.json'

/**
 * Catálogo estático ligero de lecciones (~48 KB) cargado en el arranque.
 * Permite que el Dashboard y Sidebar muestren el roadmap completo y progreso
 * sin necesidad de descargar ni parsear los 3.5 MB de contenido completo de lecciones.
 */
const catalog: LessonSummary[] = catalogJson as LessonSummary[]

/**
 * Diccionario de cargadores dinámicos por ruta de archivo JSON.
 * Vite convertirá cada módulo JSON en un chunk separado bajo demanda.
 */
const moduleLoaders = import.meta.glob('../data/modulos/*.json') as Record<
  string,
  () => Promise<{ default: unknown }>
>

/** Caché en memoria para almacenar lecciones ya cargadas y parseadas */
const lessonCache = new Map<string, Lesson>()
const moduleLoadedSet = new Set<string>()

function extractModuleNumber(modulo: string): number {
  const match = modulo.match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 999
}

/**
 * Devuelve la lista completa de metadatos de lecciones.
 */
export function getLessonCatalog(): LessonSummary[] {
  return catalog
}

/**
 * Agrupa los metadatos del catálogo en módulos ordenados para el Dashboard y Sidebar.
 */
export function getModulesFromCatalog(): Module<LessonSummary>[] {
  const moduleMap = new Map<string, LessonSummary[]>()

  for (const item of catalog) {
    if (!moduleMap.has(item.modulo)) {
      moduleMap.set(item.modulo, [])
    }
    moduleMap.get(item.modulo)!.push(item)
  }

  const modules: Module<LessonSummary>[] = []
  for (const [modulo, lecciones] of moduleMap) {
    const sorted = [...lecciones].sort((a, b) =>
      a.id.localeCompare(b.id, 'en', { numeric: true })
    )
    modules.push({
      id: modulo,
      nombre: modulo,
      fase: sorted[0]?.fase ?? 0,
      lecciones: sorted
    })
  }

  return modules.sort(
    (a, b) => a.fase - b.fase || extractModuleNumber(a.id) - extractModuleNumber(b.id)
  )
}

/**
 * Carga dinámicamente un archivo de módulo JSON y almacena sus lecciones en la caché.
 */
export async function loadModuleByFileName(fileName: string): Promise<Lesson[]> {
  const normalizedKey = `../data/modulos/${fileName}`
  const loader = moduleLoaders[normalizedKey]

  if (!loader) {
    console.warn(`[lessonService] No loader found for module file: ${normalizedKey}`)
    return []
  }

  if (moduleLoadedSet.has(fileName)) {
    return Array.from(lessonCache.values()).filter(l => {
      const summary = catalog.find(c => c.id === l.id)
      return summary?.file === fileName
    })
  }

  try {
    const moduleData = await loader()
    const rawLessons = (moduleData.default || moduleData) as Lesson[]

    if (Array.isArray(rawLessons)) {
      for (const item of rawLessons) {
        if (item && item.id) {
          lessonCache.set(item.id, item)
        }
      }
    }

    moduleLoadedSet.add(fileName)
    return rawLessons
  } catch (error) {
    console.error(`[lessonService] Error loading module ${fileName}:`, error)
    return []
  }
}

/**
 * Obtiene una lección completa por su ID.
 * Si ya está en memoria, la devuelve al instante.
 * Si no, descarga el módulo JSON correspondiente en segundo plano.
 */
export async function fetchLessonById(id: string): Promise<Lesson | null> {
  const cached = lessonCache.get(id)
  if (cached) return cached

  const summary = catalog.find(item => item.id === id)
  if (!summary || !summary.file) {
    return null
  }

  await loadModuleByFileName(summary.file)
  return lessonCache.get(id) ?? null
}

/**
 * Busca lecciones en el catálogo por competencia o tags.
 */
export function searchCatalog(query: string): LessonSummary[] {
  const q = query.toLowerCase().trim()
  if (!q) return catalog

  return catalog.filter(
    l =>
      l.competencia.toLowerCase().includes(q) ||
      l.modulo.toLowerCase().includes(q) ||
      l.tags_rag.some(t => t.toLowerCase().includes(q))
  )
}
