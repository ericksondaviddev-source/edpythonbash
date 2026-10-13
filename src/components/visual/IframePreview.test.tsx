import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '../../i18n'
import IframePreview from './IframePreview'

function getIframe(container: HTMLElement): HTMLIFrameElement {
  const iframe = container.querySelector('iframe')
  if (!iframe) throw new Error('no se renderizó iframe')
  return iframe as HTMLIFrameElement
}

describe('IframePreview', () => {
  it('renderiza un iframe sandboxed con el HTML completo', () => {
    const html = '<html><body><h1>Hola</h1></body></html>'
    const { container } = render(<IframePreview code={html} />)
    const iframe = getIframe(container)
    expect(iframe.getAttribute('sandbox')).toBe('')
    expect(iframe.getAttribute('srcdoc')).toContain('<h1>Hola</h1>')
  })

  it('envuelve fragmentos sueltos en un documento HTML5', () => {
    const { container } = render(<IframePreview code={'<p>Hola</p>'} />)
    const iframe = getIframe(container)
    const srcdoc = iframe.getAttribute('srcdoc') ?? ''
    expect(srcdoc).toContain('<body>')
    expect(srcdoc).toContain('<p>Hola</p>')
    expect(srcdoc).toContain('<!DOCTYPE html>')
  })

  it('usa el título pasado como prop', () => {
    const { container } = render(
      <IframePreview code={'<p>Hola</p>'} title="Mi preview" />
    )
    const iframe = getIframe(container)
    expect(iframe.getAttribute('title')).toBe('Mi preview')
  })

  it('no envuelve documentos que ya tienen <html>', () => {
    const html = '<html><body><p>X</p></body></html>'
    const { container } = render(<IframePreview code={html} />)
    const iframe = getIframe(container)
    expect(iframe.getAttribute('srcdoc')).toBe(html)
  })
})
