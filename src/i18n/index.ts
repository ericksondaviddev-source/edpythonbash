import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './es.json'
import en from './en.json'

function getInitialLang(): 'es' | 'en' {
  try {
    const raw = localStorage.getItem('language-storage')
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.state?.lang === 'en' ? 'en' : 'es'
  } catch {
    return 'es'
  }
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en }
  },
  lng: getInitialLang(),
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false
  }
})

export default i18n
