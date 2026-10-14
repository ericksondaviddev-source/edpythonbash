import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '../../i18n'

const { verifyMock } = vi.hoisted(() => ({
  verifyMock: vi.fn(async (): Promise<{ name: string; passed: boolean }[]> => [])
}))

vi.mock('../../services/pyodide', () => ({
  getPyodideRunner: () => ({
    run: async () => 'hola-mundo',
    verify: verifyMock
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

describe('SimulatorPanel reto de bloques', () => {
  it('verify falla si faltan bloques requeridos y abre el editor', async () => {
    verifyMock.mockResolvedValueOnce([{ name: 'tests', passed: true }])
    const sim: Simulator = {
      ...baseSimulator('pyodide'),
      bloques_requeridos: ['py-var'],
      test_code: 'assert True',
    }
    render(<SimulatorPanel simulator={sim} lessonId="L1" />)
    fireEvent.click(screen.getByRole('button', { name: /verificar/i }))
    await waitFor(() =>
      expect(screen.getByText(/faltan bloques requeridos/i)).toBeDefined()
    )
    expect(screen.queryByText(/¡reto superado!/i)).toBeNull()
    expect(screen.getByTestId('required-blocks')).toBeDefined()
  })

  it('verify supera el reto cuando los bloques requeridos están colocados', async () => {
    verifyMock.mockResolvedValueOnce([{ name: 'tests', passed: true }])
    const sim: Simulator = {
      ...baseSimulator('pyodide'),
      bloques_requeridos: ['py-var'],
      test_code: 'assert True',
    }
    render(<SimulatorPanel simulator={sim} lessonId="L1" />)
    fireEvent.click(screen.getByRole('button', { name: /editor de bloques/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Variable/ }))
    fireEvent.click(screen.getByRole('button', { name: /verificar/i }))
    await waitFor(() =>
      expect(screen.getByText(/¡reto superado!/i)).toBeDefined()
    )
    const retoMentions = screen.getAllByText(/reto: usa estos bloques/i)
    expect(retoMentions.length).toBeGreaterThanOrEqual(2)
  })

  it('sin bloques requeridos la verify no añade el resultado del reto', async () => {
    verifyMock.mockResolvedValueOnce([{ name: 'tests', passed: true }])
    const sim: Simulator = { ...baseSimulator('pyodide'), test_code: 'assert True' }
    render(<SimulatorPanel simulator={sim} lessonId="L1" />)
    fireEvent.click(screen.getByRole('button', { name: /verificar/i }))
    await waitFor(() =>
      expect(screen.getByText(/¡reto superado!/i)).toBeDefined()
    )
    expect(screen.queryByText(/faltan bloques requeridos/i)).toBeNull()
  })
})
