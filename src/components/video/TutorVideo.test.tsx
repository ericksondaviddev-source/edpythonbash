import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '../../i18n'

vi.stubGlobal('speechSynthesis', {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  get paused() { return false },
})
vi.stubGlobal('SpeechSynthesisUtterance', class {
  text: string
  lang = ''
  rate = 1
  pitch = 1
  onend: (() => void) | null = null
  constructor(text: string) { this.text = text }
})

import TutorVideo from './TutorVideo'
import type { TutorStep } from '../../lib/tutorScript'

const STEPS: TutorStep[] = [
  { code: 'x = 1', narration: 'Creamos la variable equis.' },
  { code: 'print(x)', narration: 'La mostramos por pantalla.' },
]

describe('TutorVideo', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

  it('teclea el primer paso y muestra la narración en la burbuja', () => {
    render(<TutorVideo steps={STEPS} speed={1} />)
    expect(screen.getByText(/paso 1 de 2/i)).toBeTruthy()
    act(() => { vi.advanceTimersByTime(1000) })
    // código completo del paso 1 tecleado
    expect(screen.getByText('x = 1', { exact: false })).toBeTruthy()
    // burbuja con la narración
    expect(screen.getByText('Creamos la variable equis.')).toBeTruthy()
  })

  it('habla la narración con voz si está activada', () => {
    render(<TutorVideo steps={STEPS} speed={1} />)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(vi.mocked(speechSynthesis.speak)).toHaveBeenCalled()
  })

  it('con voz desactivada no habla', () => {
    render(<TutorVideo steps={STEPS} speed={1} />)
    fireEvent.click(screen.getByRole('button', { name: /voz/i }))
    act(() => { vi.advanceTimersByTime(1000) })
    expect(vi.mocked(speechSynthesis.speak)).not.toHaveBeenCalled()
  })

  it('botón siguiente avanza al paso 2', () => {
    render(<TutorVideo steps={STEPS} speed={1} />)
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText(/paso 2 de 2/i)).toBeTruthy()
  })

  it('avanza solo al siguiente paso tras la narración', () => {
    render(<TutorVideo steps={STEPS} speed={1} />)
    act(() => { vi.advanceTimersByTime(1000) }) // teclea
    act(() => { vi.advanceTimersByTime(15000) }) // narración + pausa
    expect(screen.getByText(/paso 2 de 2/i)).toBeTruthy()
  })

  it('sin pasos muestra mensaje vacío', () => {
    render(<TutorVideo steps={[]} speed={1} />)
    expect(screen.getByText(/no tiene pasos/i)).toBeTruthy()
  })
})
