# ED-python/bash Learning App

PWA (Progressive Web App) para aprender Python y Bash de forma interactiva, por ED-Dev.

## Características

- **174 lecciones** en 19 módulos (F0-F3), con contenido enriquecido por IA
- **Secuencia real**: orden de módulos por fase/número, navegación prev/next, "Lección X de Y"
- **Router con URLs**: deep-links a cualquier lección (`#/leccion/M1.1-001`)
- **Código roto → corregido → optimizado**: Aprende debugging real, con resaltado de sintaxis
- **Quizzes con gating**: aprobar con ≥70% para completar la lección
- **Retos guiados en el simulador**: verificación automática con asserts (`test_code`, stdout, excepciones, forbidden) + XP
- **Notebook Colab**: celdas markdown/código por lección
- **Markdown renderizado** en todas las explicaciones
- **Video generativo**: Efecto "code typing" con ASCII 3D
- **Audio TTS**: Escucha las lecciones
- **Bilingüe**: Español e inglés
- **Temas**: Light solar / Dark solar
- **PWA**: Funciona offline, instalable
- **Progreso local**: localStorage (Zustand persist), XP, rachas

## Stack

- React 19 + Vite 8
- Tailwind CSS 4 + CSS variables
- Zustand (estado)
- react-router-dom 7 (HashRouter)
- react-markdown + Prism (contenido)
- Pyodide (Python en WASM, singleton cacheado)
- i18next (i18n)
- Canvas API (video + ASCII 3D)
- Vitest + Playwright (tests)

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Desarrollo (puerto 5174 si 5173 está ocupado)
npm run dev -- --port 5174

# Build
npm run build

# Tests
npm run test          # Unit tests
npm run test:e2e      # E2E tests

# Preview (producción, usado por python-bash.bat)
npm run preview -- --port 4173
```

### Enriquecimiento IA (opcional, offline batch)

```bash
# Requiere key de OpenRouter
$env:OPENROUTER_API_KEY = "sk-or-..."
node scripts/enrich-lessons.mjs --limit 5   # probar con 5
node scripts/enrich-lessons.mjs             # todas las lecciones pendientes
```

El script es idempotente (marca `_enriched: true` y salta las ya hechas).

## Estructura

```
src/
  components/     # atoms/ molecules/ organisms/ + lesson/ quiz/ simulator/ video/ audio/
  pages/          # Dashboard
  store/          # Estado global (Zustand: progress, theme, language)
  i18n/           # Traducciones (ES/EN)
  lib/            # parser.ts (orden de secuencia)
  data/modulos/   # 28 archivos JSON con lecciones
  types/          # Tipos TypeScript
  services/       # pyodide (singleton + verify), bashSim, questionGenerator
  scripts/        # enrich-lessons.mjs (batch IA)
```

## Agregar lecciones

1. Crea un archivo JSON en `src/data/modulos/`
2. Sigue el schema existente (ver `src/types/lesson.ts`)
3. El parser lo incluye automáticamente (ordenado por id dentro del módulo)

## Licencia

MIT
