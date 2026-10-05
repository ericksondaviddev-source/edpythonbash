import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '../../i18n'

vi.mock('../../services/pyodide', () => ({
  getPyodideRunner: () => ({
    run: async () => 'hola-mundo',
    verify: async () => []
  })
}))

vi.mock('../../services/sessionStore', () => ({
  getBashSession: () => ({
    cwd: '/home/user',
    filesystem: new Map(),
    getCommandNames: () => [],
    run: (cmd: string) => ({ stdout: `out:${cmd}`, stderr: '', exitCode: 0 })
  }),
  resetBashSession: vi.fn()
}))

import SimulatorPanel from './SimulatorPanel'
import type { Simulator } from '../../types'

const baseSimulator = (engine: Simulator['engine']): Simulator => ({
  tipo: 'fix_bug',
  engine,
  instruccion: 'Arregla el bug',
  codigo_inicial: 'print("x")',
  solucion: 'print("ok")'
})

describe('SimulatorPanel', () => {
  it('muestra Ejecutar siempre, incluso con engine no soportado, y avisa al pulsar', async () => {
    render(<SimulatorPanel simulator={baseSimulator('pytest_sim')} />)
    const runBtn = screen.getByRole('button', { name: /ejecutar/i })
    expect(runBtn).toBeDefined()
    fireEvent.click(runBtn)
    await waitFor(() =>
      expect(screen.getByText(/no implementado para este engine/i)).toBeDefined()
    )
    expect(screen.getByText(/salida/i)).toBeDefined()
  })

  it('ejecuta con pyodide y muestra la salida en el panel', async () => {
    render(<SimulatorPanel simulator={baseSimulator('pyodide')} />)
    const runBtn = screen.getAllByRole('button', { name: /ejecutar/i })[0]
    fireEvent.click(runBtn)
    await waitFor(() => expect(screen.getByText('hola-mundo')).toBeDefined())
  })

  it('la terminal arranca con mensaje de bienvenida, no vacía', () => {
    render(<SimulatorPanel simulator={baseSimulator('pyodide')} />)
    expect(screen.getByText(/terminal lista/i)).toBeDefined()
  })

  it('Reiniciar oculta el panel de salida', async () => {
    render(<SimulatorPanel simulator={baseSimulator('pytest_sim')} />)
    fireEvent.click(screen.getByRole('button', { name: /ejecutar/i }))
    await waitFor(() =>
      expect(screen.getByText(/no implementado para este engine/i)).toBeDefined()
    )
    fireEvent.click(screen.getByRole('button', { name: /reiniciar/i }))
    expect(screen.queryByText(/no implementado para este engine/i)).toBeNull()
  })
})
