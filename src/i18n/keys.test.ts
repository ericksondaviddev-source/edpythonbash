import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import es from './es.json'
import en from './en.json'

function lookup(dict: unknown, key: string): unknown {
  let cur: unknown = dict
  for (const part of key.split('.')) {
    if (typeof cur !== 'object' || cur === null) return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

function collectTsFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'i18n') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectTsFiles(full))
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full)
  }
  return out
}

describe('i18n key coverage', () => {
  it('toda clave literal t() existe en es.json y en.json', () => {
    const files = collectTsFiles(path.join(process.cwd(), 'src'))
    expect(files.length).toBeGreaterThan(0)
    const keys = new Set<string>()
    const re = /\bt\(\s*'([^']+)'/g
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf-8')
      let match: RegExpExecArray | null
      while ((match = re.exec(text)) !== null) keys.add(match[1])
    }
    expect([...keys].length).toBeGreaterThan(50)
    const missingEs = [...keys].filter(k => lookup(es, k) === undefined)
    const missingEn = [...keys].filter(k => lookup(en, k) === undefined)
    expect(missingEs).toEqual([])
    expect(missingEn).toEqual([])
  })
})
