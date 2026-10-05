import { describe, it, expect, vi, beforeEach } from 'vitest'
import '../i18n'
import i18n from '../i18n'
import { useLanguageStore } from './useLanguageStore'

beforeEach(async () => {
  useLanguageStore.setState({ lang: 'es' })
  await i18n.changeLanguage('es')
})

describe('useLanguageStore + i18next', () => {
  it('toggleLanguage cambia el idioma de i18next a inglés', async () => {
    useLanguageStore.getState().toggleLanguage()
    await vi.waitFor(() => expect(i18n.language).toBe('en'))
    expect(useLanguageStore.getState().lang).toBe('en')
    expect(i18n.t('common.run')).toBe('Run')
  })

  it('toggleLanguage vuelve a español', async () => {
    useLanguageStore.getState().toggleLanguage()
    await vi.waitFor(() => expect(i18n.language).toBe('en'))
    useLanguageStore.getState().toggleLanguage()
    await vi.waitFor(() => expect(i18n.language).toBe('es'))
    expect(i18n.t('common.run')).toBe('Ejecutar')
  })
})
