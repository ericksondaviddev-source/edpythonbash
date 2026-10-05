import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '../i18n'
import { useProgressStore } from '../store/useProgressStore'
import type { Lesson, Module } from '../types/lesson'

vi.mock('../components/organisms/MindMap', () => ({
  default: () => <div data-testid="mock-mindmap">mindmap</div>,
}))

vi.stubGlobal('speechSynthesis', {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  get paused() { return false },
})
vi.stubGlobal('SpeechSynthesisUtterance', class {
  text: string
  constructor(text: string) { this.text = text }
})

import Dashboard from './Dashboard'

function makeLesson(id: string, competencia: string): Lesson {
  return {
    id,
    modulo: 'M1',
    competencia,
    nivel: 'principiante',
    fase: 1,
    microproyecto: 'P',
    modelo_mental: 'M',
    codigo_roto: 'roto',
    diagnostico: 'd',
    codigo_corregido: 'ok',
    codigo_optimizado: 'opt',
    disenso_experto: 'x',
    pregunta_transferencia: 'q',
    quiz: { pregunta: 'Q?', opciones: ['a', 'b'], correcta: 'a', explicacion: 'e' },
    audio_script: 'a',
    video_prompt: 'v',
    trazabilidad: { libros_fuente: [], conceptos_clave: [] },
    tags_rag: [],
  }
}

const LESSONS = [makeLesson('L-1', 'Competencia uno'), makeLesson('L-2', 'Competencia dos')]
const MODULES: Module[] = [{ id: 'M1', nombre: 'Módulo uno', fase: 1, lecciones: LESSONS }]

describe('Dashboard bento', () => {
  beforeEach(() => {
    useProgressStore.getState().resetProgress()
    localStorage.removeItem('openrouter_api_key')
  })

  it('muestra el hero con titulo y continuar llama onLessonSelect con la primera pendiente', () => {
    const onSelect = vi.fn()
    render(<Dashboard modules={MODULES} lessons={LESSONS} onLessonSelect={onSelect} />)
    expect(screen.getByText(/panel de aprendizaje/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /continuar aprendiendo/i }))
    expect(onSelect).toHaveBeenCalledWith(LESSONS[0])
  })

  it('el toggle cambia a la vista de mapa mental', () => {
    render(<Dashboard modules={MODULES} lessons={LESSONS} onLessonSelect={() => {}} />)
    // El toggle es el primer botón "mapa mental" en orden DOM (el segundo abre el preview)
    fireEvent.click(screen.getAllByRole('button', { name: /mapa mental/i })[0])
    expect(screen.getByTestId('mock-mindmap')).toBeTruthy()
  })

  it('muestra los 3 videos de instruccion y abrir uno muestra el reproductor', () => {
    render(<Dashboard modules={MODULES} lessons={LESSONS} onLessonSelect={() => {}} />)
    expect(screen.getByText(/empieza aquí/i)).toBeTruthy()
    expect(screen.getByText(/código real/i)).toBeTruthy()
    expect(screen.getByText(/tu tutor ia con tu propia clave/i)).toBeTruthy()
    fireEvent.click(screen.getByText(/tu tutor ia con tu propia clave/i))
    expect(screen.getByText(/paso 1 de 4/i)).toBeTruthy()
  })

  it('sin API key muestra aviso y el boton llama onOpenSettings', () => {
    const onSettings = vi.fn()
    render(<Dashboard modules={MODULES} lessons={LESSONS} onLessonSelect={() => {}} onOpenSettings={onSettings} />)
    expect(screen.getByText(/conecta tu api key/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /configurar clave/i }))
    expect(onSettings).toHaveBeenCalled()
  })

  it('con API key guardada muestra estado conectada', () => {
    localStorage.setItem('openrouter_api_key', 'sk-or-test')
    render(<Dashboard modules={MODULES} lessons={LESSONS} onLessonSelect={() => {}} />)
    expect(screen.getByText(/clave conectada/i)).toBeTruthy()
  })
})
