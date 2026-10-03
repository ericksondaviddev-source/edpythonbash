import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LanguageState {
  lang: 'es' | 'en'
  toggleLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'es',
      toggleLanguage: () =>
        set((state) => ({
          lang: state.lang === 'es' ? 'en' : 'es'
        }))
    }),
    {
      name: 'language-storage'
    }
  )
)
