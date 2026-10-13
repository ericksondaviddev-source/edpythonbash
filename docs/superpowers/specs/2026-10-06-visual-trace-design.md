# Visual Trace Design

Fecha: 2026-10-06
Estado: aprobado por el usuario

## Objetivo

Construir una pestaña "Visual" en cada lección que muestre el ejecutarse real del código, línea por línea, con representación física de variables y salida. El usuario quiere **"saber qué representa cada cosa realmente en la pantalla"** — unir la sintaxis del código con cómo se ve y opera en una pantalla real. Esto permite comprender el código mejor porque en la mente se liga la sintaxis con su forma física.

El diseño se apoya en tres renderizadores automáticos que ya tienen el código fuente, sin necesidad de autoría nueva para 174 lecciones.

## Contexto actual

- `LessonView.tsx`: 174 lecciones con `modelo_mental`, `codigo_roto`, `diagnostico`, `codigo_corregido`, `quiz`, `simulador`, `audio_script`, `video_prompt`.
- `CodeBlock.tsx`: resaltado Prism, typewriter (desactivado), cursor parpadeante, botón "Saltar" (condicional).
- `TracerVideo.tsx`: código muerto fuera del bundle (Canvas ASCII 3D).
- `TutorVideo.tsx`: typewriter + narración por voz + `aria-live`, sin resaltado de sintaxis.
- `Markdown.tsx`: `react-markdown` sin `rehype-raw` → SVG inline no soportado.
- `reactflow` (11.11.4): motor de grafos dirigido, usado solo en MindMap.
- `tutorRecorder.ts`: único uso real de Canvas en producción (captura WebM).
- `video_prompt`: 726 chars promedio en las 174 lecciones, estructura `ESCENA N (título):` con descripciones visuales literales, **nunca renderizado** en la UI.
- `diagnostico`: 46% ya vienen en lista numerada con referencias a líneas concretas de código (`1. **Línea 7** (requests.get…): llamada bloqueante`).
- `loadPyodide`: verificado en browser que **sí carga** y permite ejecución real paso a paso.
- `verifyError`, `quiz.next`: 2 claves i18n faltantes (ya añadidas).

## 3 Renderizadores automáticos (sin autoría nueva de lecciones)

### 1. Python tracer (98 lecciones con `engine: pyodide`)

**Concepto**: step-through visual donde cada línea ejecuta y muestra:
- **Cajas de memoria**: variable → valor repr + tipo badge (`int`, `str`, `True`, `False`, `list`, `dict`, `None`).
- **Output real**: lo que `print()` realmente mostró después de esa línea.
- **Excepción visual**: si falla la línea, muestra TypeError/NameError con línea y mensaje en una caja roja.

**Cómo funciona técnicamente**:
1. Instrumentación AST en `pyodide.ts`: el `init()` instrumenta cada expresión top-level con una llamada `__snap__(lineno, flat_vars, out_snapshot)`.
2. `flat_vars`: lista flat `[k1, v1_repr, k2, v2_repr, ...]` de strings (fácil `.toJs()` en JS).
3. `out_snapshot`: copia de la lista de prints ocurridos hasta ese paso.
4. Excepción: `try/except` captura lineno negativo + `{'__error__': 'TypeError: ...'}` + out_snapshot.
5. El panel de Trace consume el array de snapshots y muestra paso a paso.

**Paso a paso (detalle)**:
- El transformer `NodeTransformer` recorre `Module`/`FunctionDef`/`For`/`If` y después de cada `st` visita inserta:
  ```python
  __snap__(L, [k for k,v in list(locals().items()) if not k.startswith('_')],
           [s for s in _OUT])
  ```
  donde `_OUT` es una lista mutable compartida y `__snap__` es una función global de pyodide.
- `print` es reemplazado temporalmente para acumular en `_OUT` (fuera del scope de la lección, se restaura después).
- `__snap__` JS callback recibe `[flat_list, out_list]` y los almacena en `window.__steps`.
- El panel de Trace renderiza `window.__steps` como índice navegable.

### 2. HTML/CSS live preview (F0.1 / 26 lecciones)

**Concepto**: un `<iframe srcdoc>` que renderiza el `codigo_roto` y el `codigo_corregido` tal como se vería en un navegador real.

- **Broken preview**: muestra el código roto con sus fallas visuales (etiquetas sin cerrar, estructura inválida, etc.).
- **Fixed preview**: muestra el código corregido ya arreglado.

**Implementación**:
- Componente `IframePreview` con `srcdoc` que contiene HTML + CSS minimal.
- Sandbox sin scripts (`allow-scripts` off) por seguridad.
- El componente comprueba si el código contiene `<html>`, `<body>`, tags de bloque comunes; si no, envuelve en un documento HTML5 básico.
- Los estilos CSS se injectan via `<style>` tag (no `link`) para evitar requests adicionales.

### 3. Bash file tree (10 lecciones con `bash_sim`)

**Concepto**: el script va llenando un árbol de directorios y archivos a medida que corre — `ls`, `mkdir`, `touch`, `rm` visibles al instante.

**Implementación**:
- Extensión del `TerminalPanel` existente: el árbol aparece a la derecha (o debajo) del output de consola.
- Cada comando `mkdir`/`touch`/`rm` actualiza el árbol visual.
- El prompt muestra `user@ed-dev:~/$` y el cwd real del `bash_sim`.

## 5. Capa de causa→efecto (ReactFlow)

Sobre los tres renderizadores, una superposición opcional:

- Cada línea del `codigo_roto` que tenga referencia en `diagnostico` → flecha → su diagnóstico → flecha → su corrección en `codigo_corregido`.
- El 46% de los `diagnostico` ya vienen numerados `1. **Línea 7** (requests.get…): llamada bloqueante` → parseable automáticamente.
- El panel de Trace muestra, al pasar el cursor sobre una línea, las flechas conectadas; al hacer clic, resalta tanto la línea del código roto como el diagnóstico correspondiente.

## 6. Piloto (6 lecciones — primeras lecciones del usuario)

| N.º | Lección | Materia | Visual |
|---|---|---|---|
| 1 | F0.1-001 Estructura semántica | HTML | Preview live de la estructura semántica |
| 2 | F0.1-002 Flexbox vs Grid | HTML | Preview Flexbox vs Grid lado a lado |
| 3 | M1.1-001 Sintaxis básica y tipos | Python | Cajas de memoria con `int`, `str`, `True`, `False` |
| 3 | M1.1-002 Control de flujo | Python | Ramificación if/else visual |
| 3 | M1.1-003 Bucles | Python | Snapshot por iteración del bucle |
| 4 | M1.1-004 Funciones | Python | Scope de variables + retorno |

**Cambios en JSON**: añadir `visual: 'html_preview'` a las 3 lecciones F0.1 (F0.1-001, F0.1-002, F0.1-003). Para Python, el tracer se activa automáticamente cuando `engine === 'pyodide'`; no se requiere campo nuevo.

## 6. i18n

- Todas las nuevas cadenas de UI por `t()` (es/en).
- Nuevas claves en `src/i18n/es.json` y `src/i18n/en.json`:
  - Python tracer: `trace`, `variable`, `output`, `error`, `step`, `continue`, `restart`
  - HTML preview: `html_preview`, `broken_preview`, `fixed_preview`, `render_live`
  - Bash tree: `file_tree`, `mkdir`, `touch`, `rm`, `cd`, `prompt`
  - Causa→efecto: `cause`, `effect`, `link`, `unlink`
  - Panel: `visual_tab`, `trace`, `prev_step`, `next_step`, `restart`, `error`

## 7. Archivos previstos

### Crear:
- `src/lib/pyTrace.ts` — Python line-by-line tracer (instrumentación AST, `__snap__`, captura de prints, excepciones).
- `src/components/visual/TracePanel.tsx` — panel de navegación de pasos, controles (Play/Pause/Step), render de cajas de memoria, output, errores.
- `src/components/visual/IframePreview.tsx` — preview live HTML/CSS en iframe sandbox.
- `src/components/visual/BashTree.tsx` — árbol de archivos visual en terminal.
- `src/components/lesson/VisualTab.tsx` — nueva pestaña "Visual" en LessonView, lógica de renderizado según motor (`pyodide` → Trace, `none` y HTML → IframePreview, `bash_sim` → BashTree).
- `src/i18n/es.json` / `src/i18n/en.json` — nuevas claves i18n.

### Modificar:
- `src/components/lesson/LessonView.tsx` — añadir pestaña "Visual" al tabber.
- `src/services/pyodide.ts` — instrumentación AST en `init()`.
- `src/services/sessionStore.ts` (opcional) — persistir estado de la trace entre navegaciones de lección (marcar como visto, progreso).
- `src/i18n/es.json` / `src/i18n/en.json` — nuevas claves.

### Tests (nuevos):
- `src/services/pyTrace.test.ts` — tester unitario del instrumento (mock de pyodide namespace, verifica snapshots esperados).
- `src/components/visual/TracePanel.test.tsx` — render + navegación de pasos + error step.
- `src/components/visual/IframePreview.test.tsx` — render HTML, sandbox sin scripts.
- `src/components/simulator/TerminalPanel.test.tsx` — árbol de archivos Bash.

## 7. Límites explicitos (fase 2 opcional)

- Sin multi-archivo ni explorador de archivos.
- Sin autocompletado inteligente ni lint en la terminal/tracer.
- Sin perfiles de rendimiento ni guardado persistente de trazas entre sesiones (la traza es efímera por lección).
- Todo debe seguir funcionando offline-first (Pyodide CDN + service worker cache).

## 8. Dependencias nuevas

- Ninguna dependencia externa nueva: todo se construye con las ya instaladas (`reactflow`, `prismjs`, `remark-gfm`, `howler`, etc.).
- `ast` module nativo de Python (no requiere instalar nada).
- `NodeTransformer` de `ast` para la instrumentación.

## 8. Dependencias que ya existen y se reutilizan

- `reactflow` (grafos → causa→efecto).
- `prismjs` (resaltado de sintaxis en el panel de código).
- `react-markdown` (render de `modelo_mental`/`diagnostico` dentro del trace).
- `tutorRecorder.ts` (patrón de snapshot via Canvas — concepto similar pero para WebM).
- `CodeBlock.tsx` (resaltado + controles de tipo).

---
*Diseño validado con el usuario en sesión de brainstorming (2026-10-06).*