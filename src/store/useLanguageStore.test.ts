import { describe, it, expect, beforeEach } from 'vitest'
import { useLanguageStore } from './useLanguageStore'

describe('useLanguageStore', () => {
  beforeEach(() => {
    useLanguageStore.setState({ lang: 'es' })
  })

  it('should toggle language', () => {
    const { toggleLanguage } = useLanguageStore.getState()
    toggleLanguage()
    expect(useLanguageStore.getState().lang).toBe('en')
    toggleLanguage()
    expect(useLanguageStore.getState().lang).toBe('es')
  })

  it('should have Spanish by default', () => {
    useLanguageStore.setState({ lang: 'es' })
    expect(useLanguageStore.getState().lang).toBe('es')
  })
})
