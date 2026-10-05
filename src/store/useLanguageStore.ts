import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../i18n'

interface LanguageState {
  lang: 'es' | 'en'
  toggleLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'es',
      toggleLanguage: () =>
        set((state) => {
          const lang = state.lang === 'es' ? 'en' : 'es'
          void i18n.changeLanguage(lang)
          return { lang }
        })
    }),
    {
      name: 'language-storage'
    }
  )
)
