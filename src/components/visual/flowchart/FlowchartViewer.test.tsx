import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '../../../i18n'
import FlowchartViewer from './FlowchartViewer'
import type { FlowchartData } from '../../../types/lesson'

const LINEAL: FlowchartData = {
  nodes: [
    { id: 's', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Inicio' } },
    { id: 'p', type: 'process', position: { x: 0, y: 120 }, data: { label: 'leer entrada' } },
    { id: 'z', type: 'end', position: { x: 0, y: 240 }, data: { label: 'Fin' } },
  ],
  edges: [
    { id: 'e1', source: 's', target: 'p' },
    { id: 'e2', source: 'p', target: 'z' },
  ],
}

describe('FlowchartViewer', () => {
  it('muestra el mensaje de vacío cuando no hay datos', () => {
    render(<FlowchartViewer data={undefined} emptyLabel="No hay diagrama de flujo" />)
    expect(screen.getByText('No hay diagrama de flujo')).toBeInTheDocument()
  })

  it('renderiza los símbolos del diagrama', () => {
    render(<FlowchartViewer data={LINEAL} />)
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('leer entrada')).toBeInTheDocument()
    expect(screen.getByText('Fin')).toBeInTheDocument()
  })

  it('monta el lienzo de React Flow con los nodos', () => {
    const { container } = render(<FlowchartViewer data={LINEAL} />)
    expect(container.querySelector('.react-flow')).not.toBeNull()
    expect(screen.getByText('leer entrada').closest('.react-flow__node')).not.toBeNull()
  })
})
