import { describe, it, expect } from 'vitest'
import { getBashSession, resetBashSession, clearAllSessions } from './sessionStore'

describe('sessionStore', () => {
  it('devuelve la misma sesión para la misma lección (estado persiste)', () => {
    clearAllSessions()
    const a = getBashSession('L-001')
    a.run('mkdir notas && echo hola > notas/a.txt')
    const b = getBashSession('L-001')
    expect(b).toBe(a)
    expect(b.run('cat notas/a.txt').stdout).toContain('hola')
  })

  it('lecciones distintas tienen sesiones independientes', () => {
    clearAllSessions()
    getBashSession('L-001').run('echo secreto > solo_aqui.txt')
    const res = getBashSession('L-002').run('cat solo_aqui.txt')
    expect(res.exitCode).not.toBe(0)
    expect(res.stdout).not.toContain('secreto')
  })

  it('resetBashSession destruye la sesión', () => {
    clearAllSessions()
    const a = getBashSession('L-003')
    resetBashSession('L-003')
    expect(getBashSession('L-003')).not.toBe(a)
  })
})
