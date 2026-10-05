import type { Quiz, Lesson } from '../types/lesson'
import { generateQuestionsFromLesson, generateCodeQuestions } from './questionGenerator'

export interface BankQuestion {
  pregunta: string
  opciones: string[]
  correcta: string
  explicacion: string
  tipo: 'concepto' | 'codigo' | 'debugging'
}

export function hashSeed(s: string): number {
  let seed = 0
  for (const ch of s) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647
  return seed || 1
}

export function mulberry(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Baraja las opciones con seed determinista, remapeando la letra correcta. */
export function shuffleOptions(
  q: BankQuestion,
  rand: () => number
): BankQuestion {
  const idx = q.opciones.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  const origCorrect = q.correcta.charCodeAt(0) - 65
  return {
    ...q,
    opciones: idx.map(i => q.opciones[i]),
    correcta: String.fromCharCode(65 + idx.indexOf(origCorrect))
  }
}

/**
 * Banco de preguntas: 1 del JSON + quiz_ia (IA, hasta 4) + relleno con
 * generadas de plantilla/código hasta un máximo de 8.
 * Orden de preguntas y de opciones barajados con seed de la lección (estable
 * entre montajes, distribuye las respuestas correctas entre A/B/C/D).
 */
export function buildQuestionBank(quiz: Quiz, lesson: Lesson, max = 8): BankQuestion[] {
  const base: BankQuestion = {
    pregunta: quiz.pregunta,
    opciones: quiz.opciones,
    correcta: quiz.correcta,
    explicacion: quiz.explicacion,
    tipo: 'concepto'
  }
  const ia = (lesson.quiz_ia ?? []).map(q => ({ ...q })).slice(0, 4)
  const rest = [...generateQuestionsFromLesson(lesson), ...generateCodeQuestions(lesson)]
  const all: BankQuestion[] = [base, ...ia, ...rest].slice(0, max)
  const withShuffledOptions = all.map(q =>
    shuffleOptions(q, mulberry(hashSeed(lesson.id + '|' + q.pregunta)))
  )
  const orderRand = mulberry(hashSeed(lesson.id))
  const ordered = [...withShuffledOptions]
  for (let i = ordered.length - 1; i > 0; i--) {
    const j = Math.floor(orderRand() * (i + 1))
    ;[ordered[i], ordered[j]] = [ordered[j], ordered[i]]
  }
  return ordered.slice(0, max)
}
