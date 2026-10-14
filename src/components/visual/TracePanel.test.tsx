import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '../../i18n'
import TracePanel from './TracePanel'
import type { TraceStep } from '../../types/trace'

const STEPS: TraceStep[] = [
  { lineno: 1, variables: { x: '5' }, output: [] },
  { lineno: 2, variables: { x: '5', name: "'hola'" }, output: ['el total es 10'] },
  { lineno: -1, variables: {}, output: [], error: 'TypeError: bad' }
]

describe('TracePanel', () => {
  it('muestra el indicador de paso y la memoria del primer paso', () => {
    render(<TracePanel code={'x = 5'} steps={STEPS} />)
    expect(screen.getByText(/paso 1 de 3/i)).toBeTruthy()
    expect(screen.getByText(/memoria/i)).toBeTruthy()
    expect(screen.getByText('x')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('avanza y retrocede entre pasos', () => {
    render(<TracePanel code={'x = 5'} steps={STEPS} />)
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText(/paso 2 de 3/i)).toBeTruthy()
    expect(screen.getByText('el total es 10')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /anterior/i }))
    expect(screen.getByText(/paso 1 de 3/i)).toBeTruthy()
  })

  it('muestra el error al llegar al paso con fallo', () => {
    render(<TracePanel code={'x = 5'} steps={STEPS} />)
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText(/TypeError: bad/i)).toBeTruthy()
  })

  it('muestra mensaje vacío si no hay pasos', () => {
    render(<TracePanel code={'x = 5'} steps={[]} />)
    expect(screen.getByText(/la traza no produjo pasos/i)).toBeTruthy()
  })

  it('reiniciar vuelve al primer paso', () => {
    render(<TracePanel code={'x = 5'} steps={STEPS} />)
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    fireEvent.click(screen.getByRole('button', { name: /reiniciar/i }))
    expect(screen.getByText(/paso 1 de 3/i)).toBeTruthy()
  })

  it('resalta solo las variables nuevas o modificadas respecto al paso anterior', () => {
    render(<TracePanel code={'x = 5'} steps={STEPS} />)
    // Paso 1 (estado inicial): sin resaltado
    expect(screen.queryAllByLabelText(/modificado/i)).toHaveLength(0)
    // Paso 2: 'name' es nueva (resaltada); 'x' sigue en '5' (sin resalto)
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getAllByLabelText(/modificado/i)).toHaveLength(1)
  })
})
