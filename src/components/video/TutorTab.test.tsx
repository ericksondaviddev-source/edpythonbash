import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '../../i18n'

vi.mock('../../lib/tutorRecorder', () => ({
  recordTutorVideo: vi.fn(async () => new Blob(['fake-webm'], { type: 'video/webm' })),
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

import { recordTutorVideo } from '../../lib/tutorRecorder'
import TutorTab from './TutorTab'

const STEPS = [
  { code: 'x = 1', narration: 'Creamos equis.' },
  { code: 'print(x)', narration: 'Mostramos.' },
]

describe('TutorTab', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('muestra el reproductor y los dos botones de descarga', () => {
    render(<TutorTab steps={STEPS} title="T" fileBase="L-1" lang="es" />)
    expect(screen.getByText(/paso 1 de 2/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /descargar html/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /descargar video/i })).toBeTruthy()
  })

  it('descargar HTML crea un blob .html', () => {
    render(<TutorTab steps={STEPS} title="T" fileBase="L-1" lang="es" />)
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: /descargar html/i }))
    expect(URL.createObjectURL).toHaveBeenCalled()
    const a = clickSpy.mock.instances[0] as HTMLAnchorElement
    expect(a.download).toBe('L-1-tutor.html')
    clickSpy.mockRestore()
  })

  it('descargar video graba y descarga .webm mostrando estado', async () => {
    render(<TutorTab steps={STEPS} title="T" fileBase="L-1" lang="es" />)
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    let resolveRec!: (b: Blob) => void
    vi.mocked(recordTutorVideo).mockImplementationOnce(
      () => new Promise<Blob>(res => { resolveRec = res })
    )
    fireEvent.click(screen.getByRole('button', { name: /descargar video/i }))
    await waitFor(() => expect(recordTutorVideo).toHaveBeenCalled())
    expect(screen.getByText(/grabando/i)).toBeTruthy()
    resolveRec(new Blob(['fake-webm'], { type: 'video/webm' }))
    await waitFor(() => {
      const a = clickSpy.mock.instances[0] as HTMLAnchorElement
      expect(a.download).toBe('L-1-tutor.webm')
    })
    clickSpy.mockRestore()
  })
})
