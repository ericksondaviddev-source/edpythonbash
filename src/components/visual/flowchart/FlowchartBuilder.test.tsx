import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '../../../i18n'
import FlowchartBuilder from './FlowchartBuilder'

const SECUENCIAL = {
  nodes: [
    { id: 's', type: 'start' as const, position: { x: 0, y: 0 }, data: { label: 'Inicio' } },
    { id: 'p', type: 'process' as const, position: { x: 0, y: 120 }, data: { label: 'leer entrada' } },
    { id: 'z', type: 'end' as const, position: { x: 0, y: 240 }, data: { label: 'Fin' } },
  ],
  edges: [
    { id: 'e1', source: 's', target: 'p' },
    { id: 'e2', source: 'p', target: 'z' },
  ],
}

describe('FlowchartBuilder', () => {
  it('muestra la paleta con los cuatro símbolos', () => {
    render(<FlowchartBuilder />)
    expect(screen.getByRole('button', { name: 'Inicio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Proceso' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Decisión' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fin' })).toBeInTheDocument()
  })

  it('añade un símbolo al lienzo desde la paleta', () => {
    render(<FlowchartBuilder />)
    expect(screen.queryByText('Acción')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Proceso' }))
    expect(screen.getByText('Acción')).toBeInTheDocument()
  })

  it('arranca inválido y explica qué falta', () => {
    render(<FlowchartBuilder />)
    expect(screen.getByTestId('fc-status')).toHaveTextContent('Revisar')
    expect(screen.getByText(/el lienzo está vacío/i)).toBeInTheDocument()
  })

  it('marca válido cuando el flujo es secuencial completo', () => {
    render(<FlowchartBuilder starter={SECUENCIAL} />)
    expect(screen.getByTestId('fc-status')).toHaveTextContent('Válido')
    expect(screen.getByText(/cumple todas las reglas/i)).toBeInTheDocument()
  })

  it('traduce el diagrama a pseudocódigo al pulsar «Ver código»', () => {
    render(<FlowchartBuilder starter={SECUENCIAL} />)
    expect(screen.queryByText('Traducción del diagrama')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Ver código' }))
    expect(screen.getByText('Traducción del diagrama')).toBeInTheDocument()
    const blocks = screen.getAllByText(/INICIO/).map(el => el.textContent ?? '')
    expect(blocks.some(b => b.includes('leer entrada') && b.includes('FIN'))).toBe(true)
  })

  it('muestra los requisitos de la lección cuando existen', () => {
    render(<FlowchartBuilder rules={['Debe existir un símbolo de inicio.', 'Cierra con un fin.']} />)
    expect(screen.getByText('Requisitos')).toBeInTheDocument()
    expect(screen.getByText('Debe existir un símbolo de inicio.')).toBeInTheDocument()
  })
})
