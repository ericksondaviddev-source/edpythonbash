import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(Date.now().toString(36))
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Pyodide se descarga una vez del CDN y se cachea (offline-first)
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pyodide-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'ED-python/bash',
        short_name: 'ED-pybash',
        description: 'Aprende Python y Bash de forma interactiva - by ED-Dev',
        theme_color: '#F7D117',
        background_color: '#0B1F17',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('monaco-editor') || id.includes('@monaco-editor')) return 'editor'
            if (id.includes('reactflow')) return 'flow'
            if (id.includes('react-markdown') || id.includes('remark-')) return 'markdown'
            if (id.includes('@dnd-kit')) return 'dnd'
            if (id.includes('prismjs')) return 'syntax'
            if (id.includes('howler')) return 'audio'
            if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n'
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/zustand/')
            ) {
              return 'vendor'
            }
          }
        }
      }
    }
  }
})
