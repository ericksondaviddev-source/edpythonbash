# Python-bash Learning App

PWA (Progressive Web App) para aprender Python y Bash de forma interactiva.

## Características

- **174 lecciones** en 19 módulos (F0-F3)
- **Código roto → corregido → optimizado**: Aprende debugging real
- **Quizzes interactivos** con feedback inmediato
- **Simuladores**: Python (Pyodide), Bash (simulador), subprocess
- **Video generativo**: Efecto "code typing" con ASCII 3D
- **Audio TTS**: Escucha las lecciones
- **Bilingüe**: Español e inglés
- **Temas**: Light solar / Dark solar
- **PWA**: Funciona offline, instalable
- **Progreso local**: IndexedDB, XP, rachas

## Stack

- React 18 + Vite
- Tailwind CSS + CSS variables
- Zustand (estado)
- Monaco Editor
- Pyodide (Python en WASM)
- i18next (i18n)
- Canvas API (video + ASCII 3D)
- Workbox (PWA)
- Vitest + Playwright (tests)

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Tests
npm run test          # Unit tests
npm run test:e2e      # E2E tests

# Preview
npm run preview
```

## Estructura

```
src/
  components/     # Componentes React
  pages/          # Páginas (Dashboard, LessonPage)
  store/          # Estado global (Zustand)
  i18n/           # Traducciones (ES/EN)
  lib/            # Utilidades (parser, simuladores)
  data/modulos/   # 31 archivos JSON con lecciones
  types/          # Tipos TypeScript
  hooks/          # Custom hooks
  utils/          # Helpers
```

## Agregar lecciones

1. Crea un archivo JSON en `src/data/modulos/`
2. Sigue el schema existente (ver `src/types/lesson.ts`)
3. El parser lo incluye automáticamente

## Licencia

MIT
