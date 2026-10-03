# Fase 1 — Cimientos de Secuencia (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Arreglar la secuencia del curso (orden real de módulos/lecciones), añadir router con URLs, navegación prev/next con "Lección X de Y", CTA de siguiente lección, y corregir los bugs visibles de Tailwind 4 — con slice de validación en M1.1.

**Architecture:** `react-router-dom` (HashRouter, seguro para PWA/offline) reemplaza el estado `currentView` de `App.tsx`. `parser.ts` ordena lecciones por ID y módulos por `(fase, número)`. `App.tsx` calcula la lista plana ordenada y pasa prev/next/posición a `LessonView`.

**Tech Stack:** React 19, react-router-dom 7, Tailwind 4, Vitest + @testing-library/react, Zustand.

**Nota:** el proyecto NO es repo git. Task 0 lo inicializa para permitir commits frecuentes (solo local, no remoto).

---

### Task 0: Inicializar git

**Files:**
- Create: `app/.gitignore`

- [ ] **Step 1: Crear .gitignore**

```
node_modules
dist
*.local
.env
```

- [ ] **Step 2: git init + commit inicial**

```bash
cd app && git init && git add -A && git commit -m "chore: initial commit (pre-redesign state)"
```

---

### Task 1: Parser — orden real de módulos y lecciones

**Files:**
- Modify: `src/lib/parser.ts:39-60`
- Test: `src/lib/parser.test.ts` (existe; añadir casos)

- [ ] **Step 1: Añadir tests que fallan**

Añadir a `src/lib/parser.test.ts`:

```ts
import { parseLessonsFromJSON, groupLessonsByModule } from './parser'
import type { Lesson } from '../types/lesson'

const fakeLesson = (id: string, modulo: string, fase: number) =>
  ({
    id,
    modulo,
    competencia: `C ${id}`,
    nivel: 'principiante',
    fase,
    microproyecto: '',
    modelo_mental: 'm',
    codigo_roto: 'c',
    diagnostico: 'd',
    codigo_corregido: 'cc',
    codigo_optimizado: 'co',
    disenso_experto: 'de',
    pregunta_transferencia: 'pt',
    quiz: { pregunta: 'p', opciones: ['a', 'b'], correcta: 'A', explicacion: 'e' },
    audio_script: 'a',
    video_prompt: 'v',
    trazabilidad: { libros_fuente: [], conceptos_clave: [] },
    tags_rag: []
  }) as Lesson

describe('orden de secuencia', () => {
  it('ordena lecciones por id numérico dentro del módulo', () => {
    const lessons = [
      fakeLesson('M3.4-006', 'Módulo 3.4', 3),
      fakeLesson('M3.4-003', 'Módulo 3.4', 3),
      fakeLesson('M3.4-010', 'Módulo 3.4', 3)
    ]
    const modules = groupLessonsByModule(lessons)
    expect(modules[0].lecciones.map(l => l.id)).toEqual([
      'M3.4-003',
      'M3.4-006',
      'M3.4-010'
    ])
  })

  it('ordena módulos por fase y número (3.1 antes que 3.4)', () => {
    const lessons = [
      fakeLesson('M3.4-001', 'Módulo 3.4', 3),
      fakeLesson('M3.1-001', 'Módulo 3.1', 3),
      fakeLesson('F0.1-001', 'F0.1', 0),
      fakeLesson('M1.1-001', 'Módulo 1.1', 1)
    ]
    const modules = groupLessonsByModule(lessons)
    expect(modules.map(m => m.id)).toEqual(['F0.1', 'Módulo 1.1', 'Módulo 3.1', 'Módulo 3.4'])
  })

  it('extrae el número de módulos con nombre descriptivo', () => {
    const lessons = [
      fakeLesson('M3.5-001', '3.5 - Rendimiento y Optimización', 3),
      fakeLesson('M3.2-001', 'Módulo 3.2', 3)
    ]
    const modules = groupLessonsByModule(lessons)
    expect(modules.map(m => m.id)).toEqual(['Módulo 3.2', '3.5 - Rendimiento y Optimización'])
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `npm run test -- src/lib/parser.test.ts`
Expected: FAIL (orden actual: inserción/alfabético)

- [ ] **Step 3: Implementar el orden en parser.ts**

Reemplazar `groupLessonsByModule` (líneas 39-60) por:

```ts
function extractModuleNumber(modulo: string): number {
  const match = modulo.match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 999
}

export function groupLessonsByModule(lessons: Lesson[]): Module[] {
  const moduleMap = new Map<string, Lesson[]>()

  for (const lesson of lessons) {
    if (!moduleMap.has(lesson.modulo)) {
      moduleMap.set(lesson.modulo, [])
    }
    moduleMap.get(lesson.modulo)!.push(lesson)
  }

  const modules: Module[] = []
  for (const [modulo, lecciones] of moduleMap) {
    const sorted = [...lecciones].sort((a, b) =>
      a.id.localeCompare(b.id, 'en', { numeric: true })
    )
    modules.push({
      id: modulo,
      nombre: modulo,
      fase: sorted[0].fase,
      lecciones: sorted
    })
  }

  return modules.sort(
    (a, b) => a.fase - b.fase || extractModuleNumber(a.id) - extractModuleNumber(b.id)
  )
}

export function flattenOrderedLessons(modules: Module[]): Lesson[] {
  return modules.flatMap(m => m.lecciones)
}
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `npm run test -- src/lib/parser.test.ts`
Expected: PASS (todos los casos)

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser.ts src/lib/parser.test.ts
git commit -m "feat(parser): sort lessons by id and modules by (fase, numero)"
```

---

### Task 2: Router con URLs reales

**Files:**
- Modify: `src/App.tsx` (refactor completo)
- Modify: `src/components/layout/Sidebar.tsx` (usar navegación por URL)
- Modify: `src/main.tsx` (envolver en HashRouter si App no lo hace)

- [ ] **Step 1: Instalar react-router-dom**

Run: `npm install react-router-dom`
Expected: added N packages

- [ ] **Step 2: Refactorizar App.tsx a rutas**

Cambios clave en `src/App.tsx` (eliminar `currentView`/`currentLesson`, mantener el resto):

```tsx
import { HashRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useMemo, useEffect } from 'react'
import { flattenOrderedLessons } from './lib/parser'

// Dentro del árbol (necesita hooks de router): crear componente interno
function AppShell() {
  const navigate = useNavigate()
  const { lessonId } = useParams()
  const location = useLocation()
  const { completeLesson } = useProgressStore()
  // ... (mismos stores/estados de theme, lang, loading, panels que hoy)

  const modules = useMemo(() => groupLessonsByModule(lessons), [lessons])
  const orderedLessons = useMemo(() => flattenOrderedLessons(modules), [modules])
  const currentLesson = lessonId ? lessons.find(l => l.id === lessonId) ?? null : null

  // scroll-to-top al cambiar de ruta
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const handleLessonSelect = (lesson: Lesson) => {
    navigate(`/leccion/${lesson.id}`)
    setIsSidebarOpen(false)
  }

  const handleBack = () => navigate('/')

  // Dashboard + Sidebar + LessonView iguales, pero:
  // - key={lessonId ?? 'dashboard'} en LessonView para resetear tabs
  // - LessonView recibe orderedLessons/position (Task 3)
  // - eliminar el bloque condicional currentView === 'dashboard'
}

// Envolver:
export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}
```

- [ ] **Step 3: Sidebar auto-expandir módulo actual y sincronizar**

En `src/components/layout/Sidebar.tsx`: añadir prop `currentLessonId` (ya existe), calcular módulo actual con `useMemo` y auto-expandirlo con `useEffect`:

```tsx
useEffect(() => {
  if (currentLessonId) {
    const mod = modules.find(m => m.lecciones.some(l => l.id === currentLessonId))
    if (mod) setExpandedModule(mod.id)
  }
}, [currentLessonId, modules])
```

Añadir `aria-expanded={expandedModule === m.id}` a los botones del acordeón.

- [ ] **Step 4: Verificar manualmente**

Run: `npm run dev -- --port 5174`
Verificar en navegador: `/`, `/leccion/M1.1-001`, recargar mantiene la lección, botón atrás del navegador funciona.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(nav): HashRouter with real URLs, sidebar auto-expand, scroll-to-top"
```

---

### Task 3: Prev/next, "Lección X de Y" y CTA de siguiente lección

**Files:**
- Modify: `src/components/lesson/LessonView.tsx`
- Modify: `src/App.tsx` (pasar props)
- Modify: `src/i18n/es.json`, `src/i18n/en.json`

- [ ] **Step 1: Añadir claves i18n**

Añadir a `es.json` (sección `lesson`):

```json
"lessonPosition": "Lección {{current}} de {{total}}",
"previousLesson": "Anterior",
"nextLesson": "Siguiente",
"goToNextLesson": "Ir a la siguiente lección →",
"courseCompleted": "¡Has completado el curso! 🎉"
```

Y a `en.json`:

```json
"lessonPosition": "Lesson {{current}} of {{total}}",
"previousLesson": "Previous",
"nextLesson": "Next",
"goToNextLesson": "Go to next lesson →",
"courseCompleted": "You completed the course! 🎉"
```

- [ ] **Step 2: Ampliar LessonViewProps y añadir navegación**

En `src/components/lesson/LessonView.tsx`:

```tsx
interface LessonViewProps {
  lesson: Lesson
  onBack: () => void
  onComplete: () => void
  onNavigate: (lessonId: string) => void
  position: { index: number; total: number }
  prevLesson: Lesson | null
  nextLesson: Lesson | null
}
```

En el header (tras el subtítulo del módulo):

```tsx
<p className="text-xs text-[var(--text-secondary)] mt-1">
  {t('lessonPosition', { current: position.index + 1, total: position.total })}
</p>
```

Reemplazar el bloque final `!isCompleted && (...)` por navegación secuencial:

```tsx
<div className="flex flex-col sm:flex-row gap-3 pt-2">
  {prevLesson && (
    <button
      onClick={() => onNavigate(prevLesson.id)}
      className="flex-1 py-3 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
    >
      ← {t('previousLesson')}
    </button>
  )}
  {isCompleted ? (
    nextLesson ? (
      <button
        onClick={() => onNavigate(nextLesson.id)}
        className="flex-1 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        {t('goToNextLesson')}
      </button>
    ) : (
      <span className="flex-1 py-3 text-center font-medium text-[var(--success)]">
        {t('courseCompleted')}
      </span>
    )
  ) : (
    <button
      onClick={onComplete}
      className="flex-1 py-3 bg-[var(--success)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
    >
      {t('markComplete')}
    </button>
  )}
</div>
```

- [ ] **Step 3: Pasar props desde App.tsx**

En `AppShell` (App.tsx), al renderizar LessonView:

```tsx
const currentIndex = orderedLessons.findIndex(l => l.id === currentLesson?.id)
// ...
<LessonView
  key={lessonId ?? 'dashboard'}
  lesson={currentLesson}
  onBack={handleBack}
  onComplete={handleCompleteLesson}
  onNavigate={handleLessonSelect}
  position={{ index: currentIndex, total: orderedLessons.length }}
  prevLesson={currentIndex > 0 ? orderedLessons[currentIndex - 1] : null}
  nextLesson={currentIndex >= 0 && currentIndex < orderedLessons.length - 1 ? orderedLessons[currentIndex + 1] : null}
/>
```

- [ ] **Step 4: Verificar y ejecutar tests**

Run: `npm run test` y `npm run build`
Expected: tests PASS, build OK (ajustar tests de LessonView si dependen de props antiguas)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(lesson): prev/next navigation, lesson position, next-lesson CTA"
```

---

### Task 4: Corregir bugs de Tailwind 4 (`bg-opacity-*`) y CSS de capa

**Files:**
- Modify: `src/App.tsx:80`, `src/components/atoms/Modal.tsx:34`, `src/components/molecules/QuizOption.tsx:22-29`, `src/components/quiz/QuizEngine.tsx:100-102`, `src/components/lesson/LessonView.tsx:44`, `src/components/organisms/AIPanel.tsx:110`, `src/components/organisms/AIReviewCard.tsx:59,77`, `src/components/organisms/StepByStepGuide.tsx:63`, `src/components/organisms/BlockEditor.tsx:312`
- Delete: `src/components/organisms/QuizEngine.tsx`, `src/components/organisms/SimulatorPanel.tsx`, `src/components/organisms/RepeatableQuiz.tsx`, `src/components/molecules/CodeBlock.tsx`, `src/App.css` (código muerto)
- Modify: `src/index.css:46-56`, `src/index.css:72-75`

- [ ] **Step 1: Buscar todos los `bg-opacity` restantes**

Run: `rg "bg-opacity" src/ --count-matches`
Expected: ~14 usos activos

- [ ] **Step 2: Reemplazar por sintaxis Tailwind 4**

Reglas de reemplazo (aplicar en cada archivo encontrado):
- `bg-black bg-opacity-50` → `bg-black/50`
- `bg-[var(--success)] bg-opacity-20 text-[var(--success)]` → `bg-[var(--success)]/20 text-[var(--success)]`
- `bg-[var(--error)] bg-opacity-20 text-[var(--error)]` → `bg-[var(--error)]/20 text-[var(--error)]`
- `hover:bg-opacity-10` → `hover:bg-[var(--accent)]/10`
- Badges del QuizEngine (`bg-blue-500 text-blue-500` etc.) → `bg-blue-500/20 text-blue-500` (ídem green/red)

- [ ] **Step 3: Mover header/footer a @layer base**

En `src/index.css`, envolver las reglas (líneas 46-56):

```css
@layer base {
  header {
    padding-top: env(safe-area-inset-top);
    padding-left: max(1.5rem, env(safe-area-inset-left));
    padding-right: max(1.5rem, env(safe-area-inset-right));
  }

  footer {
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
    padding-left: max(1.5rem, env(safe-area-inset-left));
    padding-right: max(1.5rem, env(safe-area-inset-right));
  }
}
```

Y reducir la regla global de touch targets (líneas 72-75) para no romper botones pequeños:

```css
button, a, input, textarea, select {
  touch-action: manipulation;
  min-height: 44px;
  min-width: 44px;
}

.code-block-action,
[class~="no-min-touch"] {
  min-height: 0;
  min-width: 0;
}
```

(Añadir clase `no-min-touch` a los botones pequeños de CodeBlock y footer.)

- [ ] **Step 4: Eliminar código muerto**

```bash
git rm src/components/organisms/QuizEngine.tsx src/components/organisms/SimulatorPanel.tsx src/components/organisms/RepeatableQuiz.tsx src/components/molecules/CodeBlock.tsx src/App.css
```

Actualizar `src/components/organisms/index.ts` para quitar los exports eliminados. Ejecutar `npm run test` y corregir imports rotos si los hay.

- [ ] **Step 5: Verificar visualmente con Playwright**

Run: `npm run dev -- --port 5174` + Playwright MCP: verificar quiz legible (texto verde/rojo sobre fondo translúcido), modal con backdrop translúcido, header alineado con main.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix(ui): replace dead bg-opacity-* with Tailwind 4 syntax, layer base CSS, remove dead code"
```

---

### Task 5: Slice de validación M1.1 (gate con el usuario)

**Files:**
- Solo verificación, sin cambios de código (salvo ajustes que surjan)

- [ ] **Step 1: Build y tests finales de la fase**

Run: `npm run test && npm run build`
Expected: todos PASS

- [ ] **Step 2: Recorrido completo con Playwright en M1.1**

Verificar en `http://localhost:5174/`:
1. Dashboard abre con Fase 0 arriba y "Continuar" apunta a `F0.1-001` (o navegar a M1.1)
2. Abrir `/leccion/M1.1-001` → muestra "Lección 1 de 8"
3. Recargar → mantiene la lección
4. Botón atrás del navegador → vuelve al dashboard
5. Marcar completada → aparece CTA "Ir a la siguiente lección →" → navega a M1.1-002
6. Sidebar auto-expande el módulo de la lección actual
7. Quiz legible, modal translúcido

- [ ] **Step 3: Presentar el slice al usuario y pedir aprobación** antes de pasar a la Fase 2 (contenido profundo)

- [ ] **Step 4: Commit de ajustes**

```bash
git add -A
git commit -m "chore: phase 1 validation slice adjustments"
```
