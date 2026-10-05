import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { wrapLines, recordTutorVideo } from './tutorRecorder'

const fakeCtx = (w = 7) => ({ measureText: (s: string) => ({ width: s.length * w }) }) as unknown as CanvasRenderingContext2D

const fake2d = () =>
  ({
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    measureText: (s: string) => ({ width: s.length * 7 }),
    fillStyle: '',
    font: '',
    strokeStyle: '',
  }) as unknown as CanvasRenderingContext2D

describe('wrapLines', () => {
  it('corta líneas largas por palabras', () => {
    const lines = wrapLines(fakeCtx(), 'hola mundo cruel', 7 * 10)
    expect(lines).toEqual(['hola mundo', 'cruel'])
  })

  it('línea corta queda intacta', () => {
    expect(wrapLines(fakeCtx(), 'x = 1', 500)).toEqual(['x = 1'])
  })
})

describe('recordTutorVideo', () => {
  beforeEach(() => {
    const realCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = realCreate(tag as 'div')
      if (tag === 'canvas') {
        const c = el as unknown as HTMLCanvasElement
        c.captureStream = vi.fn(() => ({ getTracks: () => [] }) as unknown as MediaStream)
        c.getContext = (() => fake2d()) as unknown as typeof c.getContext
      }
      return el
    }) as typeof document.createElement)

    vi.stubGlobal('MediaRecorder', class {
      ondataavailable: ((e: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      static isTypeSupported = () => false
      start() {
        queueMicrotask(() => this.ondataavailable?.({ data: new Blob(['x']) }))
      }
      stop() {
        queueMicrotask(() => this.onstop?.())
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('devuelve un Blob webm y usa fallback de mimeType', async () => {
    const blob = await recordTutorVideo(
      [{ code: 'x = 1', narration: 'Hola.' }],
      { title: 'T', width: 320, height: 180, charMs: 1, fps: 10, narrationScale: 0.01 }
    )
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('video/webm')
    expect(blob.size).toBeGreaterThan(0)
  })

  it('sin pasos lanza error', async () => {
    await expect(recordTutorVideo([], { title: 'T' })).rejects.toThrow('no steps')
  })
})
