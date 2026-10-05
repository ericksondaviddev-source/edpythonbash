import type { TutorStep } from '../types/lesson'

export type { TutorStep }

/** Campos mínimos de Lesson que necesita la derivación offline. */
export interface TutorScriptInput {
  codigo_corregido: string
  audio_script: string
}

const MAX_LINES_PER_STEP = 6

/** Pausa tras cada narración: base + por palabra (voz ~150ppm en español). */
export const NARRATION_BASE_MS = 1500
export const NARRATION_PER_WORD_MS = 350

export function narrationMs(narration: string): number {
  const words = narration.trim() === '' ? 0 : narration.trim().split(/\s+/).length
  return NARRATION_BASE_MS + words * NARRATION_PER_WORD_MS
}

function splitCodeChunks(code: string): string[] {
  const chunks: string[][] = []
  let current: string[] = []
  const push = () => {
    if (current.length > 0) {
      chunks.push(current)
      current = []
    }
  }
  for (const line of code.split('\n')) {
    if (line.trim() === '') {
      push()
      continue
    }
    current.push(line)
    if (current.length >= MAX_LINES_PER_STEP) push()
  }
  push()
  return chunks.map(c => c.join('\n'))
}

function splitNarrations(script: string, minParts: number): string[] {
  const trimmed = script.trim()
  if (!trimmed) return []
  let parts = trimmed
    .split(/\n\s*\n/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 0)
  // Si hay menos párrafos que pasos y algún párrafo tiene varias frases,
  // se subdivide el más largo por frases hasta cubrir los pasos.
  while (parts.length < minParts) {
    const idx = parts.findIndex(p => splitSentences(p).length >= 2)
    if (idx < 0) break
    const sentences = splitSentences(parts[idx])
    const mid = Math.ceil(sentences.length / 2)
    parts = [...parts.slice(0, idx), sentences.slice(0, mid).join(' '), sentences.slice(mid).join(' '), ...parts.slice(idx + 1)]
  }
  return parts
}

function splitSentences(paragraph: string): string[] {
  return paragraph
    .split(/(?<=\.)\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

/**
 * Deriva los pasos del tutor 100% offline: divide `codigo_corregido` en
 * fragmentos lógicos (por líneas en blanco, máx 6 líneas) y reparte los
 * párrafos de `audio_script` proporcionalmente entre los pasos.
 * La IA puede refinar esto después guardando `tutor_steps` en el JSON.
 */
export function buildTutorSteps(input: TutorScriptInput): TutorStep[] {
  const chunks = splitCodeChunks(input.codigo_corregido || '')
  if (chunks.length === 0) return []
  const narrations = splitNarrations(input.audio_script || '', chunks.length)
  return chunks.map((code, i) => ({
    code,
    narration:
      narrations.length === 0
        ? ''
        : narrations[Math.min(narrations.length - 1, Math.floor((i * narrations.length) / chunks.length))],
  }))
}
