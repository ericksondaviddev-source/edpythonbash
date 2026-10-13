import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n'

declare const __BUILD_ID__: string

const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'
const STORAGE_KEY = 'ed-pybash:build'
const RELOAD_FLAG = 'ed-pybash:reloading'

async function clearStaleCaches() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(r => r.unregister()))
    }
  } catch {
    /* ignore */
  }
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
  } catch {
    /* ignore */
  }
}

async function bootstrap() {
  const prev = localStorage.getItem(STORAGE_KEY)
  const reloading = sessionStorage.getItem(RELOAD_FLAG)

  if (prev && prev !== BUILD_ID && !reloading) {
    sessionStorage.setItem(RELOAD_FLAG, '1')
    localStorage.setItem(STORAGE_KEY, BUILD_ID)
    await clearStaleCaches()
    location.reload()
    return
  }

  sessionStorage.removeItem(RELOAD_FLAG)
  localStorage.setItem(STORAGE_KEY, BUILD_ID)

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

bootstrap()
