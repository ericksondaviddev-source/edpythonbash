import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '../../i18n'

import BlockEditor from './BlockEditor'

describe('BlockEditor pro', () => {
  it('muestra pestañas de categoría en la paleta', () => {
    render(<BlockEditor language="python" onCodeChange={() => {}} />)
    expect(screen.getByRole('tab', { name: /todos/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /control/i })).toBeTruthy()
  })

  it('filtrar por categoría oculta los bloques de otras categorías', () => {
    render(<BlockEditor language="python" onCodeChange={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: /control/i }))
    expect(screen.queryByText('Variable')).toBeNull()
    expect(screen.getByText('Si')).toBeTruthy()
  })

  it('clic en un bloque genera su código', () => {
    const onCodeChange = vi.fn()
    render(<BlockEditor language="python" onCodeChange={onCodeChange} />)
    fireEvent.click(screen.getByText('Variable'))
    expect(onCodeChange).toHaveBeenLastCalledWith('x = 10')
  })

  it('la vista previa muestra el código completo multilínea', () => {
    const { getByTestId } = render(<BlockEditor language="python" onCodeChange={() => {}} />)
    fireEvent.click(screen.getByText('Función'))
    const preview = getByTestId('code-preview').textContent ?? ''
    expect(preview).toContain('def nombre():')
    expect(preview).toContain('pass')
  })

  it('indentar un bloque indenta el código generado', () => {
    const onCodeChange = vi.fn()
    render(<BlockEditor language="python" onCodeChange={onCodeChange} />)
    fireEvent.click(screen.getByText('Variable'))
    fireEvent.click(screen.getByLabelText(/aumentar indentación/i))
    expect(onCodeChange).toHaveBeenLastCalledWith('    x = 10')
  })

  it('eliminar un bloque limpia el código', () => {
    const onCodeChange = vi.fn()
    render(<BlockEditor language="python" onCodeChange={onCodeChange} />)
    fireEvent.click(screen.getByText('Variable'))
    fireEvent.click(screen.getByLabelText(/eliminar bloque/i))
    expect(onCodeChange).toHaveBeenLastCalledWith('')
  })
})
