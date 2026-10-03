import type { Lesson } from '../types'

export interface GeneratedQuestion {
  pregunta: string
  opciones: string[]
  correcta: string
  explicacion: string
  tipo: 'concepto' | 'codigo' | 'debugging'
}

export function generateQuestionsFromLesson(lesson: Lesson): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = []

  questions.push({
    pregunta: `¿Cuál es el concepto principal de "${lesson.competencia}"?`,
    opciones: [
      lesson.modelo_mental.split('.')[0] + '.',
      'No tiene un concepto principal.',
      'Es solo teoría sin aplicación práctica.',
      'Ninguna de las anteriores.'
    ],
    correcta: 'A',
    explicacion: lesson.modelo_mental.substring(0, 200) + '...',
    tipo: 'concepto'
  })

  questions.push({
    pregunta: '¿Qué error presenta el código roto?',
    opciones: [
      lesson.diagnostico.split('.')[0] + '.',
      'No tiene errores.',
      'Solo tiene errores de estilo.',
      'Ninguna de las anteriores.'
    ],
    correcta: 'A',
    explicacion: lesson.diagnostico.substring(0, 200) + '...',
    tipo: 'debugging'
  })

  questions.push({
    pregunta: '¿Qué mejora el código optimizado respecto al corregido?',
    opciones: [
      'Usa type hints y validación en boundaries.',
      'Es más largo pero más lento.',
      'No hay diferencia significativa.',
      'Ninguna de las anteriores.'
    ],
    correcta: 'A',
    explicacion: 'El código optimizado usa type hints, validación en boundaries y sigue mejores prácticas.',
    tipo: 'codigo'
  })

  questions.push({
    pregunta: '¿Cuál es la diferencia principal entre el código roto y el corregido?',
    opciones: [
      lesson.diagnostico.split('.')[0] + '.',
      'No hay diferencia.',
      'El corregido es más largo.',
      'Ninguna de las anteriores.'
    ],
    correcta: 'A',
    explicacion: lesson.diagnostico.substring(0, 200) + '...',
    tipo: 'debugging'
  })

  questions.push({
    pregunta: '¿Qué herramienta o concepto se enseña en esta lección?',
    opciones: [
      lesson.competencia,
      'No se enseña nada específico.',
      'Solo se repite contenido anterior.',
      'Ninguna de las anteriores.'
    ],
    correcta: 'A',
    explicacion: `Esta lección se enfoca en: ${lesson.competencia}`,
    tipo: 'concepto'
  })

  return questions
}

export function generateCodeQuestions(lesson: Lesson): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = []

  questions.push({
    pregunta: '¿Qué hace el siguiente código?\n```\n' + lesson.codigo_corregido.split('\n').slice(0, 3).join('\n') + '\n```',
    opciones: [
      'Procesa y valida datos correctamente.',
      'Tiene errores de sintaxis.',
      'No hace nada útil.',
      'Ninguna de las anteriores.'
    ],
    correcta: 'A',
    explicacion: 'El código corregido procesa datos de forma correcta y segura.',
    tipo: 'codigo'
  })

  questions.push({
    pregunta: '¿Por qué falla el código roto?',
    opciones: [
      lesson.diagnostico.split('.')[0] + '.',
      'Porque está bien escrito.',
      'Porque es demasiado corto.',
      'Ninguna de las anteriores.'
    ],
    correcta: 'A',
    explicacion: lesson.diagnostico.substring(0, 200) + '...',
    tipo: 'debugging'
  })

  return questions
}
