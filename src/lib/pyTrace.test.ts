import { describe, it, expect, vi } from 'vitest'
import { guessType, tracePython } from './pyTrace'

vi.mock('../services/pyodide', () => ({
  getPyodideRunner: vi.fn(() => ({
    trace: vi.fn(async (code: string) => [
      { lineno: 1, variables: { x: code }, output: [] }
    ])
  }))
}))

import { getPyodideRunner } from '../services/pyodide'

describe('pyTrace', () => {
  it('guessType deduce el tipo a partir del repr', () => {
    expect(guessType('5')).toBe('int')
    expect(guessType('-3')).toBe('int')
    expect(guessType('5.0')).toBe('float')
    expect(guessType("'hola'")).toBe('str')
    expect(guessType('"hola"')).toBe('str')
    expect(guessType('True')).toBe('bool')
    expect(guessType('False')).toBe('bool')
    expect(guessType('None')).toBe('NoneType')
    expect(guessType('[1, 2]')).toBe('list')
    expect(guessType('{"a": 1}')).toBe('dict')
    expect(guessType('(1, 2)')).toBe('tuple')
    expect(guessType('set([1])')).toBe('set')
    expect(guessType('<object>')).toBe('obj')
  })

  it('tracePython delega al runner y devuelve sus pasos', async () => {
    const steps = await tracePython('x = 1')
    expect(getPyodideRunner).toHaveBeenCalled()
    expect(steps).toHaveLength(1)
    expect(steps[0].variables.x).toBe('x = 1')
  })
})
