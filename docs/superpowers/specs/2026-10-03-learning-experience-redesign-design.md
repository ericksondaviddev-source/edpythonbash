# Design: Rediseño de la Experiencia de Aprendizaje — ED-python/bash

**Fecha:** 2026-10-03
**Estado:** Aprobado por el usuario (enfoque A por capas con toque de B: slice de validación al inicio)

## Problema

El usuario reporta que la app no comunica el hilo y la secuencia del contenido, las explicaciones son superficiales, los quizzes son débiles, el simulador no se entiende cómo usarlo para aprender, y hay problemas de diseño/UX. La exploración confirmó causas concretas:

1. **Hilo roto:** glob alfabético (empezar en Fase 3), módulos desordenados, lecciones sin ordenar por ID, sin prev/next, sidebar desincronizado, sin router (sin URLs/historial).
2. **Explicaciones superficiales:** textos de 1 párrafo pintados crudo (markdown sin renderizar), sin resaltado de sintaxis, campo `colab` (notebooks elaborados) nunca mostrado.
3. **Quiz débil:** 7/8 preguntas generadas con plantillas (respuesta siempre "A"), marcador `0/0`, aprobar/suspender marca igual, perder progreso al cambiar de tab.
4. **Simulador poco utilizable:** solo 62% ejecutable (6 engines sin implementar), tests/asserts del JSON nunca ejecutados, guía genérica hardcodeada, sin verificación de la tarea.
5. **Diseño con bugs:** 16 usos de `bg-opacity-*` muertos en Tailwind 4 (quiz ilegible, fondos opacos), header/footer desalineados, colores hardcodeados, i18n incompleto.

## Decisiones del usuario

| Área | Decisión |
|---|---|
| Contenido | **Enriquecer con IA** (OpenRouter) las 174 lecciones, guardando resultados en los JSON |
| Quiz | **Profundo:** arreglar bugs + preguntas IA de calidad guardadas en JSON + asserts |
| Simulador | **Retos guiados:** objetivo → escribir → ejecutar → verificación automática (asserts) → siguiente, con XP |
| Diseño | **Recorrido completo:** router con URLs, dashboard con progreso, breadcrumb, prev/next, flujo "siguiente lección" + **rediseño visual general** (tipografía, espaciado, jerarquía, coherencia) |

## Enfoque: 5 fases secuenciales (cada una funcional al final) con slice de validación

### Fase 1 — Cimientos de secuencia (con slice de validación)
- Ordenar lecciones por ID dentro de cada módulo y módulos por `(fase, número)` en `src/lib/parser.ts`
- Introducir `react-router-dom`: rutas `/`, `/modulo/:moduloId`, `/leccion/:lessonId`
- Slice de validación: implementar el flujo completo nuevo en el módulo M1.1 y validarlo con el usuario antes de replicar
- Prev/next con "Lección X de Y" en LessonView, flujo "siguiente lección" al completar
- Corregir los 16 usos de `bg-opacity-*` por sintaxis Tailwind 4 (`bg-black/50`, `bg-[var(--success)]/20`)
- Mover reglas `header`/`footer` a `@layer base`; `key={lesson.id}`; scroll-to-top

### Fase 2 — Contenido profundo
- Renderizar markdown (react-markdown) en modelo_mental, diagnostico, disenso_experto, pregunta_transferencia
- Resaltado de sintaxis real (shiki o prism) con lenguaje por lección (python/bash/html)
- Mostrar el campo `colab` como sección "Notebook Colab" (celdas markdown/code)
- Enriquecimiento IA batch: script Node (offline) que, lección por lección, usa OpenRouter (`openrouter/free`) para expandir modelo_mental/diagnostico/pregunta_transferencia (2-4 párrafos, con ejemplos), escribe en los JSON. Key por env var, nunca commiteada. Re-ejecutable (skip si campo enriquecido ya existe, marcador `_enriched: true`)

### Fase 3 — Quiz profundo
- Arreglar bugs: marcador, barajado estable por montaje de lección, persistencia de intentos
- Gating real: aprobar el quiz (≥70%) para marcar la lección completada
- Generación IA batch de preguntas de calidad (razonamiento, distractores plausibles, explicaciones completas) guardadas en cada JSON (`quiz_ia: []`, 3-4 preguntas por lección)
- Banco: 1 pregunta JSON + 3-4 IA + hasta 2 generadas de código = quiz de 5-8 preguntas

### Fase 4 — Simulador como retos guiados
- Nuevo flujo "Reto": objetivo (instruccion) → editor → Ejecutar → **verificación automática** ejecutando `test_code`/asserts_stdout/return/exception/forbidden con checklist ✓/✗ visible → XP al pasar → CTA siguiente lección
- Runner de tests Python (Pyodide singleton con caché, offline-first), runner Bash mejorado (multi-comando, pipes, redirects)
- Fallback para engines no implementados: modo reto "compara con solución" (sin ejecución) usando `validacion`/`solucion`
- Eliminar la guía genérica hardcodeada

### Fase 5 — Rediseño visual y pulido
- Sistema de diseño revisado: escala tipográfica coherente, espaciado, tokens únicos (usar `src/utils/tokens.ts`), estados de foco consistentes (átomo Button en todo)
- Dashboard con progreso por defecto, tarjetas de módulo clicables con %, breadcrumb en Header
- Sidebar sincronizado (auto-expandir módulo actual, una instancia), MindMap accesible (resaltar lección actual, teclado)
- i18n completo (todo texto por `t()`), quitar código muerto/duplicados, actualizar AGENTS.md/README
- Racha real (actualizar streak en cada visita)

## Arquitectura de datos (cambios)

- `types/lesson.ts`: añadir `colab?`, `quiz_ia?`, `_enriched?`, `validacion?`, `estado_inicial?` (schema F0)
- Los JSON enriquecidos se regeneran in-place por el script batch (idempotente)
- Progress store: gating de quiz (guardar mejor score), XP por verificación de reto

## Testing

- Vitest: parser (orden), quiz engine (gating, marcador), test runner (asserts)
- Playwright MCP: validar slice M1.1 visualmente antes de replicar; validación final por fase

## Fuera de alcance

- Backend/servidor (progreso sigue local)
- Monaco editor (se mantiene textarea con resaltado overlay)
- Implementar los 6 engines especializados restantes (pytest_sim, concurrency_sim, etc.) → fallback comparación
