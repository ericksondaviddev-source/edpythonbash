import { describe, it, expect } from 'vitest'
import { buildTutorHtml } from './tutorExport'
import type { TutorStep } from './tutorScript'

const STEPS: TutorStep[] = [
  { code: 'x = 1\nif x < 2:\n    print(x)', narration: 'Comparamos con < y mostramos.' },
  { code: 'print("fin")', narration: 'Terminamos.' },
]

describe('buildTutorHtml', () => {
  it('genera un HTML autocontenido válido', () => {
    const html = buildTutorHtml(STEPS, { title: 'Mi lección', lang: 'es' })
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('</html>')
    // sin dependencias externas: sin http:// ni https://
    expect(html).not.toContain('http://')
    expect(html).not.toContain('https://')
  })

  it('escapa el código y la narración (sin XSS, sin romper el script)', () => {
    const html = buildTutorHtml(STEPS, { title: 'T', lang: 'es' })
    // el código va embebido como JSON con < escapado: nunca aparece crudo
    expect(html).toContain('\\u003c')
    expect(html).not.toContain('if x < 2:')
    expect(html).not.toContain('Comparamos con < y mostramos.')
    // el JSON embebido no puede cerrar el tag script
    const scriptBodies = html.split('<script>').slice(1).map(s => s.split('</script>')[0])
    for (const body of scriptBodies) {
      expect(body).not.toContain('</script')
    }
  })

  it('incluye título, voz speechSynthesis y controles', () => {
    const html = buildTutorHtml(STEPS, { title: 'Mi lección', lang: 'es' })
    expect(html).toContain('Mi lección')
    expect(html).toContain('speechSynthesis')
    expect(html).toContain('LANG="es"')
  })

  it('con lista vacía genera HTML con mensaje', () => {
    const html = buildTutorHtml([], { title: 'T', lang: 'es' })
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
  })
})
