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

  it('should pipe stdout into grep', () => {
    const sim = new BashSim()
    sim.filesystem.set('/home/user/log.txt', 'line1\nline2 ERROR\nline3')
    const result = sim.run('cat /home/user/log.txt | grep ERROR')
    expect(result.stdout).toBe('line2 ERROR')
    expect(result.exitCode).toBe(0)
  })

  it('should chain pipes (cat | grep | wc)', () => {
    const sim = new BashSim()
    sim.filesystem.set('/home/user/f.txt', 'a\nb\nc')
    const result = sim.run('cat /home/user/f.txt | grep b | wc')
    expect(result.stdout).toBe('1 1 1')
    expect(result.exitCode).toBe(0)
  })

  it('should redirect stdout to a file with >', () => {
    const sim = new BashSim()
    const result = sim.run('echo hello > /home/user/out.txt')
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toBe('')
    expect(sim.filesystem.get('/home/user/out.txt')).toBe('hello')
  })

  it('should append stdout to a file with >>', () => {
    const sim = new BashSim()
    sim.run('echo one > /home/user/out.txt')
    sim.run('echo two >> /home/user/out.txt')
    expect(sim.filesystem.get('/home/user/out.txt')).toBe('onetwo')
  })

  it('should read stdin from a file with <', () => {
    const sim = new BashSim()
    sim.filesystem.set('/home/user/in.txt', 'hello input')
    const result = sim.run('cat < /home/user/in.txt')
    expect(result.stdout).toBe('hello input')
    expect(result.exitCode).toBe(0)
  })

  it('should combine input redirect, pipe and output redirect', () => {
    const sim = new BashSim()
    sim.filesystem.set('/home/user/in.txt', 'keep\nDROP\nkeep2')
    const result = sim.run('grep keep < /home/user/in.txt | wc > /home/user/out.txt')
    expect(result.exitCode).toBe(0)
    expect(sim.filesystem.get('/home/user/out.txt')).toBe('2 2 10')
  })

  it('should run sequential commands with ;', () => {
    const sim = new BashSim()
    const result = sim.run('echo one; echo two')
    expect(result.stdout).toBe('one\ntwo')
    expect(result.exitCode).toBe(0)
  })

  it('should short-circuit && on failure', () => {
    const sim = new BashSim()
    const result = sim.run('cat /nope.txt && echo never')
    expect(result.exitCode).toBe(1)
    expect(result.stdout).not.toContain('never')
  })

  it('should continue && on success', () => {
    const sim = new BashSim()
    const result = sim.run('echo a && echo b')
    expect(result.stdout).toBe('a\nb')
    expect(result.exitCode).toBe(0)
  })

  it('should respect quotes when splitting operators', () => {
    const sim = new BashSim()
    const result = sim.run('echo "a|b;c"')
    expect(result.stdout).toBe('a|b;c')
    expect(result.exitCode).toBe(0)
  })
})
