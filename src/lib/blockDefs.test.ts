import { describe, it, expect } from 'vitest'
import { PYTHON_BLOCKS, BASH_BLOCKS, BLOCK_CATEGORIES } from './blockDefs'

describe('blockDefs', () => {
  it.each([
    ['python', PYTHON_BLOCKS],
    ['bash', BASH_BLOCKS],
  ])('%s: 10 bloques con código y categoría válida', (_lang, blocks) => {
    expect(blocks).toHaveLength(10)
    for (const b of blocks) {
      expect(b.code.trim().length).toBeGreaterThan(0)
      expect(BLOCK_CATEGORIES).toContain(b.category)
    }
    expect(new Set(blocks.map(b => b.id)).size).toBe(blocks.length)
  })
})
