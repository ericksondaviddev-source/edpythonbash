import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../../services/sessionStore', () => ({
  getBashSession: () => ({
    cwd: '/home/user',
    filesystem: new Map([['/home/user', ''], ['/home/user/a.txt', 'hola']]),
    getCommandNames: () => ['echo', 'ls', 'cd'],
    run: (cmd: string) => ({ stdout: `out:${cmd}`, stderr: '', exitCode: 0 })
  }),
  resetBashSession: vi.fn()
}))

import TerminalPanel from './TerminalPanel'

describe('TerminalPanel (bash)', () => {
  it('muestra el prompt y ejecuta un comando con Enter', async () => {
    render(<TerminalPanel lessonId="L-1" engine="bash_sim" externalCode="" />)
    const input = screen.getByRole('textbox', { name: /terminal/i })
    fireEvent.change(input, { target: { value: 'echo hola' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => screen.getByText('out:echo hola'))
  })

  it('↑ recupera el comando anterior', async () => {
    render(<TerminalPanel lessonId="L-2" engine="bash_sim" externalCode="" />)
    const input = screen.getByRole('textbox', { name: /terminal/i }) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'ls' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.value).toBe('ls')
  })
})
