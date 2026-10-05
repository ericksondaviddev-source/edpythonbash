# edpythonbash Solarpunk + Bento + Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar la app lista como repo público `edpythonbash` en GitHub + desplegada en Vercel, con sistema de diseño solarpunk, logo nuevo, portada bento con videos de instrucción y pantallas clave pulidas.

**Architecture:** Fases secuenciales, cada una commiteada y verificada (vitest + tsc + lint + build). Tokens CSS primero para que todo lo demás herede. El motor de videos reutiliza `tutorRecorder`/`tutorExport`/`TutorVideo` existentes. Deploy al final, bloqueado por la rotación de la API key (acción del usuario).

**Tech Stack:** React 19 + Vite 8 + Tailwind 4 + CSS variables + Zustand + i18next + Vitest + chrome-devtools MCP + gh CLI + Vercel CLI.

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `scripts/enrich-all.mjs` | Fix: cerrar `async function main()` |
| `.gitignore` | Añadir `.superpowers/` |
| `package.json` | `name` → `edpythonbash` |
| `index.html` | Favicon real + theme-color + título |
| `src/index.css` | Tokens solarpunk light/dark + utilidades glass/Inti |
| `src/components/atoms/*` | Button/Card/Modal a nuevos tokens |
| `src/components/layout/Header.tsx` | Glass + tokens |
| `public/logo.svg`, `public/favicon.svg` | Logo nuevo (concepto A: Inti + `>_`) |
| `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`, `public/mask-icon.svg` | Assets PWA generados del SVG |
| `vite.config.ts` | Manifest con nuevos iconos/nombre |
| `src/pages/Dashboard.tsx` | Rewrite a bento grid |
| `src/components/dashboard/*` | Cards del bento (si Dashboard supera ~200 líneas: `HeroCard.tsx`, `StatsGrid.tsx`, `VideosCard.tsx`, `ApiKeyCard.tsx`) |
| `src/lib/instructionVideos.ts` | Tipos + 3 storyboards (es/en) |
| `src/components/video/InstructionPlayer.tsx` | Reproductor Canvas + voz + subtítulos |
| `src/i18n/es.json`, `src/i18n/en.json` | Claves `dashboard.*`, `videos.*` nuevas |
| `src/components/lesson/LessonView.tsx`, `src/components/quiz/*`, `src/components/simulator/*` | Solo clases/tokens, sin lógica |
| `.github/workflows/ci.yml` | CI: tsc + vitest + lint |
| `README.md` | Badges + capturas + instrucciones deploy |

---

### Task 0: Fix `scripts/enrich-all.mjs`

**Files:**
- Modify: `scripts/enrich-all.mjs` (final del archivo)

- [ ] **Step 1: Leer la cola del archivo y añadir la llave de cierre**
  - Leer últimas 15 líneas. El archivo abre `async function main() {` y termina con `await main()` sin cerrar la función.
  - Edit: antes de `await main()` debe existir `}` que cierre `main()`. Resultado esperado al final:
    ```
    }      // cierra if (quotaAbort) o bloque final
    }      // cierra main()

    await main()
    ```
- [ ] **Step 2: Verificar sintaxis**

  Run: `node --check scripts/enrich-all.mjs`
  Expected: sin salida (exit 0)

- [ ] **Step 3: Dry-run con cuota agotada (no gasta requests)**
  - La cuota free está en 0 hasta ~20:00 VET, así que la pasada sale con código 42 sin llamar a ningún modelo.

  Run: `powershell -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts\enrich-loop.ps1`
  Expected: log con `exit=42`, sin `Assertion failed`, `pendientes=138`

- [ ] **Step 4: Commit**

  ```bash
  git add scripts/enrich-all.mjs
  git commit -m "fix(scripts): cerrar main() en enrich-all.mjs (exit codes limpios)"
  ```

### Task 1: Higiene pre-publicación

**Files:**
- Modify: `.gitignore`, `package.json`, `index.html`

- [ ] **Step 1: `.gitignore` — añadir `.superpowers/`**
  - Edit: append línea `.superpowers/` al final de `.gitignore`.
- [ ] **Step 2: `package.json` — renombrar**
  - Edit: `"name": "app"` → `"name": "edpythonbash"`.
- [ ] **Step 3: `index.html` — favicon temporal + título**
  - Edit: `<link rel="icon" type="image/svg+xml" href="/vite.svg" />` → `href="/favicon.svg"`.
  - Edit: `<title>Python-bash Learning</title>` → `<title>ED-python/bash · Aprende Python y Bash</title>`.
  - (El `theme-color` final y assets llegan en Task 4.)
- [ ] **Step 4: Verificar build**

  Run: `npm run build`
  Expected: `✓ built in` sin errores (solo cambia nombre, sin código).

- [ ] **Step 5: Commit**

  ```bash
  git add .gitignore package.json index.html
  git commit -m "chore: hygiene pre-publicacion (nombre, gitignore, favicon)"
  ```

### Task 2: Tokens solarpunk light/dark + utilidades glass

**Files:**
- Modify: `src/index.css` (sección `:root` y `[data-theme="dark"]`, + nuevas clases)
- Test visual: chrome-devtools (no hay tests unitarios para CSS; la verificación es captura light+dark)

Paleta exacta (no inventar otros valores):
- `--accent: #F7D117` (amarillo solar primario), texto sobre acento: `#1A1A2E`
- `--accent-2: #0033AB` (azul secundario/enlaces)
- `--danger: #CF142B` (errores/destructivo; reemplaza `--error` solo como alias nuevo, conservar `--error` viejo por compatibilidad)
- Light: `--bg-primary: #FDFBF3`, `--bg-secondary: #F5F1E3`, `--bg-tertiary: #EAE4D0`, `--text-primary: #1A1A2E`, `--text-secondary: #4A4A68`, `--border: #DCD2B8`
- Dark: `--bg-primary: #0B1F17`, `--bg-secondary: #12241C`, `--bg-tertiary: #1B3227`, `--text-primary: #EAF3EC`, `--text-secondary: #9DB3A8`, `--border: #2A4436`
- Nuevos: `--surface-glass` (light: `rgba(255,255,255,.55)`; dark: `rgba(18,36,28,.55)`), `--border-glass` (light: `rgba(26,26,46,.12)`; dark: `rgba(234,243,236,.14)`), `--grad-solar: linear-gradient(135deg,#F7D117,#FF6B35)`, `--ring: 0 0 0 3px rgba(247,209,23,.35)`

- [ ] **Step 1: Editar `:root` y `[data-theme="dark"]` con los valores de arriba**
  - Conservar TODAS las variables viejas (`--accent-hover`, `--success`, `--warning`, `--code-bg`, etc.) para no romper componentes existentes.
- [ ] **Step 2: Añadir clases utilitarias al final de `index.css`**
  ```css
  .glass {
    background: var(--surface-glass);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    border: 1px solid var(--border-glass);
  }
  .inti-rays {
    background-image: repeating-conic-gradient(from 0deg, rgba(247,209,23,.07) 0deg 6deg, transparent 6deg 12deg);
  }
  .badge-double { border: 1px solid var(--border-glass); outline: 2px solid var(--accent); outline-offset: 2px; }
  ```
- [ ] **Step 3: Verificar en navegador light + dark**
  - Run: `npm run dev` (puerto 5174), abrir `#/`, `take_snapshot` + `take_screenshot`; alternar `data-theme` vía `evaluate_script` (`document.documentElement.dataset.theme='dark'`) y repetir captura.
  - Expected: sin errores en `list_console_messages`, contraste legible en ambos.
- [ ] **Step 4: Commit**

  ```bash
  git add src/index.css
  git commit -m "feat(theme): tokens solarpunk light/dark + utilidades glass e Inti"
  ```

### Task 3: Componentes base a nuevos tokens

**Files:**
- Modify: `src/components/atoms/Button.tsx`, `src/components/atoms/Card.tsx` (o el archivo Card existente — verificar nombre con glob antes), `src/components/atoms/Modal.tsx`, `src/components/layout/Header.tsx`
- Test: `npx vitest run` (suite existente debe seguir en verde; si algún snapshot depende de clases viejas, actualizar el test, no el componente)

- [ ] **Step 1: Localizar archivos exactos**
  - Run: glob `src/components/atoms/*` y leer Button/Card/Modal/Header.
- [ ] **Step 2: Migrar clases**
  - Primario: `bg-[var(--accent)]` (ahora amarillo) con `text-[#1A1A2E]` en vez de `text-white` (contraste AA sobre amarillo).
  - Superficies: `bg-[var(--bg-secondary)]` → `glass` donde sea panel flotante (Header, Modal, Card destacada).
  - Enlaces: `text-[var(--accent)]` que sean links → `text-[var(--accent-2)]`.
  - Peligro: `variant="danger"` → `var(--danger)`.
- [ ] **Step 3: Tests + tsc**

  Run: `npx vitest run` → Expected: 98/98 (o más si se añaden). Run: `npx tsc -b` → Expected: limpio.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/atoms src/components/layout/Header.tsx
  git commit -m "feat(theme): componentes base a tokens solarpunk + glass"
  ```

### Task 4: Logo y favicon (concepto A: Inti + `>_`)

**Files:**
- Create: `public/logo.svg`, `public/favicon.svg` (reescribir), `public/mask-icon.svg`
- Create: `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` (rasterizar el SVG con `resvg`, `sharp` vía npx, o Playwright screenshot del SVG; usar lo disponible)
- Modify: `vite.config.ts` (manifest: `name: 'ED-python/bash'`, iconos 192/512 + svg, `theme_color: '#F7D117'`), `index.html` (`theme-color` → `#F7D117`)
- Test: abrir `#/` en navegador, verificar favicon en pestaña (screenshot) y `manifest.webmanifest` servido

Diseño del SVG (concepto A, juicio propio — B/C quedan como alternativas futuras):
- Disco solar (Inti) amarillo `#F7D117` con 8 rayos triangulares, aro azul `#0033AB`, prompt `>_` en azul marino sobre el disco, base/línea roja `#CF142B` sutil.
- `favicon.svg`: versión simplificada (disco + `>_` sin rayos finos), viewBox cuadrado.

- [ ] **Step 1: Escribir `public/logo.svg` y `public/favicon.svg`**
- [ ] **Step 2: Generar PNGs 192/512 + apple-touch-icon**
- [ ] **Step 3: Actualizar `vite.config.ts` + `index.html`**
- [ ] **Step 4: Verificar en navegador (snapshot + screenshot, consola limpia) y `npm run build`**
- [ ] **Step 5: Commit**

  ```bash
  git add public/logo.svg public/favicon.svg public/icon-192.png public/icon-512.png public/apple-touch-icon.png public/mask-icon.svg vite.config.ts index.html
  git commit -m "feat(brand): logo Inti + prompt y favicon tricolor solarpunk"
  ```

### Task 5: Portada bento (rewrite Dashboard)

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Create (solo si Dashboard supera 200 líneas): `src/components/dashboard/HeroCard.tsx`, `src/components/dashboard/StatsGrid.tsx`, `src/components/dashboard/VideosCard.tsx`, `src/components/dashboard/ApiKeyCard.tsx`
- Modify: `src/i18n/es.json`, `src/i18n/en.json` (claves `dashboard.*` nuevas; conservar las viejas que sigan en uso)
- Test: crear `src/pages/Dashboard.test.tsx` (o `src/components/dashboard/*.test.tsx`): render con módulos de prueba, botón continuar llama `onLessonSelect`, toggle dashboard/mindmap funciona. Requiere `import '../../i18n'` (o `'../i18n'` según ubicación) y no usar `toBeInTheDocument` sin jest-dom (sí existe `@testing-library/jest-dom` en devDeps — verificar import en setup; los tests previos de TutorTab usan patrón existente: copiar su setup).

Layout bento (responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`):
- Hero (`lg:col-span-2`): logo + `dashboard.title/welcome` + barra de progreso tricolor (amarillo completado sobre track secundario) + racha.
- Continuar lección (existe, reestilizar con `glass`).
- VideosCard (`lg:col-span-2` o ancha): 3 miniaturas → abre `InstructionPlayer` en modal (Task 6 provee el player; si Task 6 va después, dejar el slot con botón deshabilitado NO — orden: implementar Task 6 antes de cablear el modal; el plan ejecuta en orden).
- StatsGrid: XP / nivel / lecciones (badges con `badge-double` en racha).
- ApiKeyCard: estado de la key (`openrouter_api_key` en localStorage) + botón que abre `APIKeySettings` (reutilizar el modal existente vía prop o evento — verificar cómo lo abre Header y replicar).
- Mindmap preview: tarjeta con botón que cambia a vista mindmap (conservar `MindMap` existente intacto).

- [ ] **Step 1: Escribir tests del Dashboard bento (deben fallar: componentes no existen)**
- [ ] **Step 2: Implementar Dashboard + subcomponentes + i18n**
- [ ] **Step 3: Correr tests**

  Run: `npx vitest run src/pages/Dashboard.test.tsx` (o ruta equivalente)
  Expected: PASS

- [ ] **Step 4: Verificar en navegador (snapshot + screenshot desktop y móvil 390px)**
- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/Dashboard.tsx src/components/dashboard src/i18n/es.json src/i18n/en.json [tests]
  git commit -m "feat(dashboard): portada bento solarpunk con glass y tricolor"
  ```

### Task 6: Motor de videos de instrucción

**Files:**
- Create: `src/lib/instructionVideos.ts`, `src/lib/instructionVideos.test.ts`
- Create: `src/components/video/InstructionPlayer.tsx`, `src/components/video/InstructionPlayer.test.tsx`
- Modify: `src/components/dashboard/VideosCard.tsx` (cablear modal con player), `src/i18n/es.json`, `src/i18n/en.json` (claves `videos.*`)

`instructionVideos.ts`:
```ts
export interface InstructionScene { code: string; narration: string }
export interface InstructionVideo { id: string; titleKey: string; descKey: string; scenes: InstructionScene[] }
export function getInstructionVideos(lang: 'es' | 'en'): InstructionVideo[]
```
- 3 videos × 3-4 escenas. Escenas: código corto ilustrativo (flujo de la app como pseudocódigo/python) + narración que explica el paso (usar `t()` en el componente para título/desc; narraciones inline es/en en el storyboard).
- Reutilizar: reproducir con `TutorVideo` existente (acepta `steps: TutorStep[]` — mapear `scenes` → `TutorStep {code, narration}`) y descargas con `buildTutorHtml`/`recordTutorVideo` vía `TutorTab`-like (si `TutorTab` acepta steps genéricos, reutilizarlo directamente en vez de crear `InstructionPlayer`; verificar props de `TutorTab` primero — YAGNI: no duplicar).

- [ ] **Step 1: Verificar props de `TutorVideo`/`TutorTab` y decidir reutilización**
- [ ] **Step 2: Test de `getInstructionVideos` (3 videos, ≥3 escenas c/u, narración no vacía en ambos idiomas)**

  Run: `npx vitest run src/lib/instructionVideos.test.ts` → Expected: FAIL (no existe)

- [ ] **Step 3: Implementar `instructionVideos.ts` (+ test del player si se crea componente nuevo)**
- [ ] **Step 4: Correr tests** → Expected: PASS
- [ ] **Step 5: Cablear en VideosCard + verificar en navegador (reproducir 1 video, consola limpia)**
- [ ] **Step 6: Commit**

  ```bash
  git add src/lib/instructionVideos* src/components/video/InstructionPlayer* src/components/dashboard/VideosCard.tsx src/i18n/
  git commit -m "feat(videos): 3 videos de instruccion generados por la app con voz"
  ```

### Task 7: Pulido de pantallas clave

**Files:**
- Modify: `src/components/lesson/LessonView.tsx`, archivos de `src/components/quiz/`, `src/components/simulator/` (solo classNames/tokens; glob para nombres exactos antes de tocar)
- Test: suite existente en verde

- [ ] **Step 1: Aplicar `glass` + tokens a contenedores de LessonView, QuizEngine/QuizOption, SimulatorPanel**
  - Regla: ningún color hardcodeado nuevo; todo `var(--*)`. Texto sobre amarillo siempre oscuro.
- [ ] **Step 2: Tests + tsc + lint**

  Run: `npx vitest run && npx tsc -b`
  Expected: todo verde, sin avisos nuevos en archivos tocados.

- [ ] **Step 3: Verificar en navegador una lección completa (M3.4-006): pestañas, quiz, simulador, tutor**
- [ ] **Step 4: Commit**

  ```bash
  git add src/components/lesson src/components/quiz src/components/simulator
  git commit -m "feat(theme): pulido solarpunk en leccion, quiz y simulador"
  ```

### Task 8: CI + README + repo público + Vercel

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `README.md` (badges + capturas `docs/` o `public/shots/`)

`.github/workflows/ci.yml` (contenido exacto):
```yaml
name: CI
on:
  push:
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: app/package-lock.json
      - run: npm ci
        working-directory: app
      - run: npx tsc -b
        working-directory: app
      - run: npx vitest run
        working-directory: app
      - run: npm run lint
        working-directory: app
      - run: npm run build
        working-directory: app
```
NOTA: el workflow vive en la raíz del repo. Si el repo git es `app/` directamente (verificar con `git rev-parse --show-toplevel`), quitar `working-directory: app` y `cache-dependency-path`. Decidir en ejecución leyendo la raíz del repo.

- [ ] **Step 1: Crear workflow (según raíz del repo) + commit**
- [ ] **Step 2: README con badges (CI, Vercel), capturas de portada/lección, sección "Tu propia API key" y deploy**
- [ ] **Step 3: BLOQUEADOR — pedir al usuario rotar la key** (openrouter.ai/keys → Delete → Create → pegar en `scripts/.api-key.tmp`). Sin esto NO se hace público.
- [ ] **Step 4: Crear repo público y pushear**

  Run: `gh repo create edpythonbash --public --source=. --push`
  Expected: URL del repo. Si el remoto ya existe, `git remote add origin` + push.

- [ ] **Step 5: Desplegar en Vercel**

  Run: `vercel link` (proyecto `edpythonbash`) y `vercel --prod --yes`
  Expected: URL `https://edpythonbash.vercel.app` (o asignada). Build `npm run build`, output `dist/`. Sin rewrites (HashRouter).

- [ ] **Step 6: Smoke test en producción** (chrome-devtools contra la URL: portada, 1 lección, quiz, consola limpia, PWA instalable)
- [ ] **Step 7: Commit final si hay ajustes + reporte al usuario**

## Verificación global (tras cada Task)

Run: `npx vitest run` (98+ tests PASS) → `npx tsc -b` (limpio) → `npm run lint` (sin avisos nuevos) → `npm run build` (OK).
Navegador: `take_snapshot` + `take_screenshot` + `list_console_messages` sin errores.
Commits: uno por tarea, mensajes como se indica.
```

---

**Self-review del plan:**
1. **Spec coverage:** Fase 0 ✅ (Task 0+1), sistema ✅ (Task 2+3), logo ✅ (Task 4), bento+videos ✅ (Task 5+6), pulido ✅ (Task 7), deploy ✅ (Task 8). Tour interactivo marcado como futuro ✅ (en spec, no requiere tarea).
2. **Placeholder scan:** sin TBD/TODO/"similar a"; cada step tiene comando y expected. Donde el nombre exacto de archivo es incierto (Card/quiz/simulator) el step 1 es localizarlo — es descubrimiento, no placeholder.
3. **Type consistency:** `TutorStep {code, narration}` coincide con `src/lib/tutorScript.ts` existente; `getInstructionVideos(lang)` define su propio contrato en el mismo task; i18n `dashboard.*`/`videos.*` consistente con convención `tutor.*`/`blocks.*`.

Plan guardado. Ejecución: el usuario pidióInline ("avísame cuando termines todo"; decisión previa: inline, no subagentes) → procedo inline con TDD y commits por tarea, empezando por Task 0.
