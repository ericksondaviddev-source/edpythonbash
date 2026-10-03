import { describe, it, expect } from 'vitest'
import BashSim from './BashSim'

describe('BashSim', () => {
  it('should execute echo command', () => {
    const sim = new BashSim()
    const result = sim.run('echo hello world')
    expect(result.stdout).toBe('hello world')
    expect(result.exitCode).toBe(0)
  })

  it('should handle pwd command', () => {
    const sim = new BashSim()
    const result = sim.run('pwd')
    expect(result.stdout).toBe('/home/user')
    expect(result.exitCode).toBe(0)
  })

  it('should handle ls command', () => {
    const sim = new BashSim()
    const result = sim.run('ls /home/user')
    expect(result.exitCode).toBe(0)
  })

  it('should handle mkdir command', () => {
    const sim = new BashSim()
    const result = sim.run('mkdir /home/user/testdir')
    expect(result.exitCode).toBe(0)
  })

  it('should handle cat command', () => {
    const sim = new BashSim()
    sim.filesystem.set('/home/user/testfile.txt', 'test content')
    const result = sim.run('cat /home/user/testfile.txt')
    expect(result.stdout).toBe('test content')
    expect(result.exitCode).toBe(0)
  })

  it('should handle rm command', () => {
    const sim = new BashSim()
    sim.filesystem.set('/home/user/testfile.txt', 'test content')
    const result = sim.run('rm /home/user/testfile.txt')
    expect(result.exitCode).toBe(0)
    expect(sim.filesystem.has('/home/user/testfile.txt')).toBe(false)
  })

  it('should handle cp command', () => {
    const sim = new BashSim()
    sim.filesystem.set('/home/user/source.txt', 'source content')
    const result = sim.run('cp /home/user/source.txt /home/user/dest.txt')
    expect(result.exitCode).toBe(0)
    expect(sim.filesystem.get('/home/user/dest.txt')).toBe('source content')
  })

  it('should handle mv command', () => {
    const sim = new BashSim()
    sim.filesystem.set('/home/user/source.txt', 'source content')
    const result = sim.run('mv /home/user/source.txt /home/user/dest.txt')
    expect(result.exitCode).toBe(0)
    expect(sim.filesystem.has('/home/user/source.txt')).toBe(false)
    expect(sim.filesystem.get('/home/user/dest.txt')).toBe('source content')
  })

  it('should handle grep command', () => {
    const sim = new BashSim()
    sim.filesystem.set('/home/user/test.txt', 'line1\nline2 ERROR\nline3')
    const result = sim.run('grep ERROR /home/user/test.txt')
    expect(result.stdout).toBe('line2 ERROR')
    expect(result.exitCode).toBe(0)
  })

  it('should handle wc command', () => {
    const sim = new BashSim()
    sim.filesystem.set('/home/user/test.txt', 'line1\nline2\nline3')
    const result = sim.run('wc /home/user/test.txt')
    expect(result.stdout).toContain('3')
    expect(result.exitCode).toBe(0)
  })

  it('should handle export command', () => {
    const sim = new BashSim()
    const result = sim.run('export TEST_VAR=value')
    expect(result.exitCode).toBe(0)
  })

  it('should return error for unknown command', () => {
    const sim = new BashSim()
    const result = sim.run('unknowncommand')
    expect(result.exitCode).toBe(127)
    expect(result.stderr).toContain('command not found')
  })

  it('should handle empty command', () => {
    const sim = new BashSim()
    const result = sim.run('')
    expect(result.exitCode).toBe(0)
  })
})
