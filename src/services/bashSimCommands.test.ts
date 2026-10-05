import { describe, it, expect } from 'vitest'
import BashSim from './bashSim'

describe('BashSim.getCommandNames', () => {
  it('incluye comandos básicos implementados', () => {
    const cmds = new BashSim().getCommandNames()
    for (const c of ['echo', 'ls', 'cd', 'cat', 'mkdir']) {
      expect(cmds).toContain(c)
    }
  })
})
