# Diseño: Solarpunk + Bento + Deploy "edpythonbash"

Fecha: 2026-10-05. Aprobado por el usuario (enfoque 1 "Seguridad y base primero").
Decisiones previas: videos=B generados in-app (C tour interactivo opcional),
alcance=B (sistema de diseño + pantallas clave), tricolor=C híbrido,
deploy=A (repo público + automatizado + GitHub Actions).

## 1. Fase 0 — Reparación y seguridad (urgente)

- `scripts/enrich-all.mjs` está sintácticamente roto: falta cerrar
  `async function main() {` (refactor anterior). Fix: añadir `}` antes de
  `await main()`. Verificar con `node --check` y una pasada con cuota 0
  (exit 42, sin gastar requests).
- Rotación de API key (la hace el USUARIO en openrouter.ai/keys: Delete
  actual → Create Key → pegar nueva): actualizar `scripts/.api-key.tmp`,
  probar llamada. La key vieja queda muerta en el historial git.
- Higiene pre-publicación: `.superpowers/` al `.gitignore`,
  `package.json` name → `edpythonbash`, quitar `/vite.svg` roto de
  `index.html` (lo reemplaza el logo nuevo).

## 2. Sistema de diseño solarpunk (tokens + componentes base)

Paleta híbrida (tricolor venezolano, oficial HTML):
- Amarillo `#F7D117` = acento primario (CTAs, XP, progreso; texto oscuro
  encima para WCAG AA). Azul `#0033AB` = enlaces/secundario.
  Rojo `#CF142B` = solo errores/destructivo. Se retira el naranja `#FF6B35`.
- Light: blanco roto con verde suave. Dark: verde-bosque profundo
  (`#0B1F17`/`#12241C`), no gris GitHub.
- Tokens nuevos (compatibles con los ~20 existentes, no rompen tests):
  `--surface-glass`, `--border-glass`, `--accent`, `--accent-2`,
  `--danger`, `--grad-solar`, `--ring`.
- Glassmorphism: `backdrop-blur` + fondos translúcidos + borde 1px en
  Header, Cards, Modales.
- Motivo Inti: rayos/estrellas de 8 puntas (arco venezolano) como patrón
  radial sutil + bordes de badges de racha.
- Maximalismo medido: doble borde en badges, gradientes dobles en hero,
  brillo en nivel. Sin romper legibilidad.
- Componentes base a tokens nuevos: Button, Card, Modal, Header.
  Todo lo demás (174 lecciones) los hereda sin tocar.

## 3. Logo y favicon

3 conceptos SVG a elegir en el companion visual al iniciar la fase:
- A) Sol de Inti + prompt `>_` central.
- B) Monograma ED con franja tricolor.
- C) Sol naciente solarpunk sobre terminal.
Entregables: `logo.svg`, `favicon.svg`, PNG 192/512 (manifest),
`apple-touch-icon.png`, `mask-icon.svg`; `theme-color` → amarillo solar;
actualizar `index.html` y manifest PWA.

## 4. Portada: bento grid + videos de instrucción

Bento (Dashboard), responsive 1→2→3 columnas, cards glass mixtas:
hero (logo + progreso con barra tricolor), "Continuar lección",
videos de instrucción (card ancha), stats (XP/racha/nivel/completadas),
preview mindmap, card "Conecta tu API key".
Motor nuevo `src/lib/instructionVideos.ts`: 3 storyboards →
animación Canvas en vivo CON voz (speechSynthesis) + subtítulos,
descarga WebM (mudo, vía `tutorRecorder`) o HTML (con voz, vía
`tutorExport`). Contenidos: (1) Empieza aquí, (2) código real,
(3) tu tutor IA. i18n es/en, miniaturas del canvas, modal de
reproducción. Tour interactivo (opción C) queda como mejora futura.

## 5. Pulido de pantallas clave

Lección, Quiz y Simulador aplican los nuevos tokens (fondos glass,
botones, acentos). Sin cambios de lógica ni de JSON. Verificación
visual en navegador + suite existente en verde.

## 6. Deploy GitHub + Vercel

1. Después de rotar la key: `gh repo create edpythonbash --public
   --source=. --push`.
2. GitHub Actions `.github/workflows/ci.yml`: `npm ci` + `tsc -b` +
   `vitest run` + lint en push/PR.
3. `vercel link` + `vercel --prod` (build `npm run build`, output
   `dist/`; sin rewrites — HashRouter).
4. Smoke test en `https://edpythonbash.vercel.app` (PWA, offline, Pyodide).
5. README con badges + capturas.

## Verificación por fase

98/98 tests (vitest), `tsc -b`, lint sin avisos nuevos, `npm run build`,
consola del navegador limpia. Commits por tarea.
Riesgos: contraste AA del amarillo (Lighthouse), cuota IA en background
hasta 174/174, WebM mudo (aceptado).
