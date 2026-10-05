import type { TutorStep } from './tutorScript'
import { narrationMs } from './tutorScript'

export interface RecordOptions {
  title: string
  width?: number
  height?: number
  fps?: number
  /** ms por carácter al teclear (grabación acelerada respecto al reproductor) */
  charMs?: number
  /** escala aplicada a la pausa de narración (1 = igual que el reproductor) */
  narrationScale?: number
  mimeType?: string
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

/** Corta un texto en líneas que quepan en maxWidth (por palabras). */
export function wrapLines(
  ctx: Pick<CanvasRenderingContext2D, 'measureText'>,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = []
  for (const raw of text.split('\n')) {
    let current = ''
    for (const word of raw.split(' ')) {
      const probe = current === '' ? word : `${current} ${word}`
      if (ctx.measureText(probe).width <= maxWidth || current === '') {
        current = probe
      } else {
        lines.push(current)
        current = word
      }
    }
    lines.push(current)
  }
  return lines
}

function pickMime(): string {
  const cands = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
    for (const c of cands) {
      try {
        if (MediaRecorder.isTypeSupported(c)) return c
      } catch {
        continue
      }
    }
  }
  return 'video/webm'
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  title: string,
  counter: string,
  codeShown: string,
  narration: string
): void {
  const s = w / 1280
  ctx.fillStyle = '#11111B'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#181825'
  ctx.fillRect(0, 0, w, 64 * s)
  ctx.fillStyle = '#CDD6F4'
  ctx.font = `${24 * s}px system-ui, sans-serif`
  ctx.fillText(title, 24 * s, 42 * s)
  const counterW = ctx.measureText(counter).width
  ctx.fillText(counter, w - 24 * s - counterW, 42 * s)

  ctx.font = `${27 * s}px ui-monospace, monospace`
  const codeLines = wrapLines(ctx, codeShown, w - 96 * s)
  codeLines.slice(0, 12).forEach((line, i) => {
    ctx.fillText(line, 48 * s, (130 + i * 38) * s)
  })

  if (narration.trim() !== '') {
    const boxY = h - 190 * s
    ctx.fillStyle = '#181825'
    ctx.fillRect(32 * s, boxY, w - 64 * s, 158 * s)
    ctx.strokeStyle = '#45475A'
    ctx.strokeRect(32 * s, boxY, w - 64 * s, 158 * s)
    ctx.fillStyle = '#CDD6F4'
    ctx.font = `${22 * s}px system-ui, sans-serif`
    wrapLines(ctx, narration, w - 128 * s)
      .slice(0, 4)
      .forEach((line, i) => {
        ctx.fillText(line, 64 * s, boxY + (44 + i * 32) * s)
      })
  }
}

/**
 * Renderiza los pasos del tutor en un canvas oculto y lo graba a WebM
 * con MediaRecorder (100% en el navegador, sin red).
 * Limitación conocida: la voz (speechSynthesis) no expone su audio al
 * navegador, así que el WebM sale mudo; la voz vive en el reproductor
 * de la app y en el HTML exportado.
 */
export async function recordTutorVideo(steps: TutorStep[], opts: RecordOptions): Promise<Blob> {
  if (steps.length === 0) throw new Error('no steps')
  const w = opts.width ?? 1280
  const h = opts.height ?? 720
  const fps = opts.fps ?? 30
  const charMs = opts.charMs ?? 12
  const narrationScale = opts.narrationScale ?? 1

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  const stream = canvas.captureStream(fps)
  const mime = opts.mimeType ?? pickMime()
  const rec = new MediaRecorder(stream, { mimeType: mime })
  const chunks: Blob[] = []
  const finished = new Promise<Blob>(resolve => {
    rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
  })
  rec.ondataavailable = e => {
    if (e.data && e.data.size > 0) chunks.push(e.data)
  }
  rec.start(250)

  try {
    for (let sIdx = 0; sIdx < steps.length; sIdx++) {
      const step = steps[sIdx]
      const counter = `${sIdx + 1} / ${steps.length}`
      for (let i = 1; i <= step.code.length; i++) {
        drawFrame(ctx, w, h, opts.title, counter, step.code.slice(0, i) + '|', '')
        await sleep(charMs)
      }
      drawFrame(ctx, w, h, opts.title, counter, step.code, step.narration)
      const hold = narrationMs(step.narration) * narrationScale
      const frames = Math.max(1, Math.round(hold / 200))
      for (let f = 0; f < frames; f++) {
        drawFrame(ctx, w, h, opts.title, counter, step.code, step.narration)
        await sleep(hold / frames)
      }
    }
  } finally {
    rec.stop()
  }
  return finished
}
