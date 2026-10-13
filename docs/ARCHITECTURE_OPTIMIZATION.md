# Arquitectura Modular & Guía de Optimización

Este documento detalla las optimizaciones de rendimiento y la arquitectura atómica modular implementadas en la aplicación **ED-python/bash**, diseñada para escalar con nuevas lecciones, características interactivas y herramientas de aprendizaje.

---

## 1. Resumen de Métricas de Rendimiento

| Métrica | Antes | Ahora | Mejora |
|---|---|---|---|
| **Bundle Inicial (`index.js`)** | `3,661.34 kB` (1,043 kB gzip) | **`94.96 kB`** (25.47 kB gzip) | **-97.4%** 🚀 |
| **Vendor Chunk (`vendor.js`)** | `525.82 kB` (165.6 kB gzip) | **`248.23 kB`** (79.2 kB gzip) | **-52.8%** |
| **Tiempo de Compilación (`build`)** | ~3.12s + 22s rollup warnings | **0.96s** | **~3.2x más rápido** |
| **Tiempo de Pruebas Unitarias (`vitest`)**| 43.54s | **6.13s** | **~7x más rápido** ⚡ |
| **Advertencias de Rollup** | `INEFFECTIVE_DYNAMIC_IMPORT` (2x) | **0 advertencias** | Limpio y estricto |

---

## 2. Pilares de la Arquitectura

### A. Patrón de Catálogo Liviano + Carga Bajo Demanda (On-Demand Module Chunking)
- **Problema previo:** `App.tsx` realizaba un `import.meta.glob('./data/modulos/*.json', { eager: true })`, empaquetando más de 3.5 MB de JSON de lecciones síncronamente en el arranque.
- **Solución implementada:**
  1. `scripts/generate-catalog.mjs`: Extrae automáticamente los metadatos necesarios para el Dashboard, Sidebar y navegación (`id`, `modulo`, `fase`, `nivel`, `competencia`, `tags_rag`, `file`) a `src/data/catalog.json` (~48 kB).
  2. `src/services/lessonService.ts`: Proporciona acceso síncrono ultra-rápido al catálogo y descarga dinámicamente el contenido completo del módulo (`fetchLessonById`) únicamente cuando el alumno entra a la lección.
  3. Caché en memoria: Los módulos descargados se almacenan en un `Map<string, Lesson>`, asegurando 0 re-descargas en la misma sesión.

### B. Code-Splitting Granular & Carga Perezosa de Rutas
- En `src/App.tsx`, las vistas y paneles pesados se cargan con `React.lazy()` y `<Suspense>`:
  - `Dashboard`: Carga inicial rápida del shell y resumen.
  - `LessonView`: Se descarga solo al ingresar a una lección.
  - `AIPanel`: Se descarga solo al interactuar con el tutor de IA.
  - `APIKeySettings`: Modal aislado.
  - `MindMap` (`reactflow`): Aislado dentro de `Dashboard.tsx` bajo demanda al pulsar la pestaña "Mapa Mental".
- En `vite.config.ts`, `manualChunks` organiza las dependencias por dominio:
  - `editor`: `@monaco-editor/react`, `monaco-editor`
  - `flow`: `reactflow`
  - `markdown`: `react-markdown`, `remark-gfm`
  - `dnd`: `@dnd-kit/*`
  - `syntax`: `prismjs`
  - `audio`: `howler`
  - `i18n`: `i18next`, `react-i18next`
  - `vendor`: `react`, `react-dom`, `react-router-dom`, `zustand`

### C. Desacoplamiento de Simuladores (Pyodide & BashSim)
- Se eliminaron las importaciones estáticas circulares de `pyodide.ts`:
  - `pyTrace.ts` y `TerminalPanel.tsx` ahora importan dinámicamente el motor de Pyodide al ejecutar código (`await import('../../services/pyodide')`).
  - Pyodide WebAssembly vive aislado en su propio chunk (`pyodide-*.js`), garantizando que los usuarios que solo leen o navegan no carguen código innecesario.
- `BashSim` se importa de manera consistente para evitar advertencias de imports inefectivos.

### D. Optimización del Entorno de Pruebas (`vitest.config.ts`)
- Se configuró `pool: 'vmThreads'` en `vitest.config.ts`, evitando la costosa destrucción y recreación de JSDOM 32 veces consecutivas.
- Las 165 pruebas pasaron de ejecutarse en 43s a solo **6.1s**.

---

## 3. Guía: Cómo Agregar Nuevas Lecciones y Features

### Para agregar nuevas lecciones:
1. Añade o edita archivos JSON en `src/data/modulos/` siguiendo la interfaz `Lesson` en `src/types/lesson.ts`.
2. Al ejecutar `npm run build` o `npm run catalog`, el catálogo `src/data/catalog.json` se actualiza de forma 100% automática.
3. El frontend y la navegación reconocerán las nuevas lecciones al instante.

### Para agregar nuevos componentes o herramientas:
1. **Atoms** (`src/components/atoms/`): Componentes primitivos sin dependencias de dominio (botones, badges, iconos).
2. **Molecules** (`src/components/molecules/`): Combinación de átomos (Markdown, inputs compuestos).
3. **Organisms** (`src/components/organisms/`): Secciones funcionales completas (MindMap, BlockEditor, AIPanel).
4. **Services** (`src/services/`): Lógica de negocio y motores externos (Pyodide, BashSim, LessonService).
5. Mantener las rutas principales y librerías externas pesadas separadas mediante `React.lazy()` para preservar el bundle < 100 kB.
