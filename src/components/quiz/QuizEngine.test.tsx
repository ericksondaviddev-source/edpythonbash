import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuizEngine from './QuizEngine'
import type { Quiz, Lesson } from '../../types/lesson'
import type { GeneratedQuestion } from '../../services/questionGenerator'

vi.mock('../../services/questionGenerator', () => {
  const q1: GeneratedQuestion = {
    pregunta: 'Generated Q1?',
    opciones: ['g1-a', 'g1-b', 'g1-c', 'g1-d'],
    correcta: 'A',
    explicacion: 'generated explanation 1',
    tipo: 'concepto'
  }
  const q2: GeneratedQuestion = {
    pregunta: 'Generated Q2?',
    opciones: ['g2-a', 'g2-b', 'g2-c', 'g2-d'],
    correcta: 'B',
    explicacion: 'generated explanation 2',
    tipo: 'codigo'
  }
  return {
    generateQuestionsFromLesson: vi.fn(() => [q1, q2]),
    generateCodeQuestions: vi.fn(() => [])
  }
})

const mockQuiz: Quiz = {
  pregunta: 'What is 2+2?',
  opciones: ['3', '4', '5', '6'],
  correcta: 'B',
  explicacion: '2+2 equals 4'
}

const mockLesson: Lesson = {
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
  quiz: mockQuiz,
  audio_script: 'audio',
  video_prompt: 'video',
  trazabilidad: { libros_fuente: [], conceptos_clave: [] },
  tags_rag: ['test']
}

describe('QuizEngine', () => {
  it('should render a question from the bank', () => {
    render(<QuizEngine quiz={mockQuiz} lesson={mockLesson} onComplete={() => {}} />)
    const allQuestions = ['What is 2+2?', 'Generated Q1?', 'Generated Q2?']
    const displayed = allQuestions.find(q => screen.queryByText(q) !== null)
    expect(displayed).toBeDefined()
  })

  it('should render 4 options for the displayed question', () => {
    render(<QuizEngine quiz={mockQuiz} lesson={mockLesson} onComplete={() => {}} />)
    const buttons = screen.getAllByRole('button')
    const optionButtons = buttons.filter(b => /^[A-D]\./.test(b.textContent?.trim() || ''))
    expect(optionButtons.length).toBe(4)
  })

  it('should show explanation after answering', () => {
    render(<QuizEngine quiz={mockQuiz} lesson={mockLesson} onComplete={() => {}} />)
    const optionButtons = screen.getAllByRole('button').filter(b => /^[A-D]\./.test(b.textContent?.trim() || ''))
    fireEvent.click(optionButtons[1])
    const allExplanations = ['2+2 equals 4', 'generated explanation 1', 'generated explanation 2']
    const displayed = allExplanations.find(e => screen.queryByText(e) !== null)
    expect(displayed).toBeDefined()
  })

  it('should advance to next question after answering', () => {
    render(<QuizEngine quiz={mockQuiz} lesson={mockLesson} onComplete={() => {}} />)
    const optionButtons = screen.getAllByRole('button').filter(b => /^[A-D]\./.test(b.textContent?.trim() || ''))
    fireEvent.click(optionButtons[1])
    fireEvent.click(screen.getByText(/Siguiente|Finalizar/))
    expect(screen.getByText(/Pregunta 2\/3/)).toBeDefined()
  })

  it('should show final score and retry option at the end', () => {
    render(<QuizEngine quiz={mockQuiz} lesson={mockLesson} onComplete={() => {}} />)
    for (let i = 0; i < 3; i++) {
      const optionButtons = screen.getAllByRole('button').filter(b => /^[A-D]\./.test(b.textContent?.trim() || ''))
      fireEvent.click(optionButtons[0])
      fireEvent.click(screen.getByText(/Siguiente|Finalizar/))
    }
    expect(screen.getByText(/Quiz Completado/i)).toBeDefined()
    expect(screen.getByText(/Repetir Quiz/i)).toBeDefined()
  })
})
