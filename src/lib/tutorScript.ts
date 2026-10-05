/** Un paso del tutor: fragmento de código que se teclea + narración que lo explica. */
export interface TutorStep {
  code: string
  narration: string
}

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

function splitNarrations(script: string): string[] {
  const trimmed = script.trim()
  if (!trimmed) return []
  return trimmed
    .split(/\n\s*\n/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 0)
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
  const narrations = splitNarrations(input.audio_script || '')
  return chunks.map((code, i) => ({
    code,
    narration:
      narrations.length === 0
        ? ''
        : narrations[Math.min(narrations.length - 1, Math.floor((i * narrations.length) / chunks.length))],
  }))
}
