# Terminal unificada persistente para el simulador — Design

Fecha: 2026-10-05
Estado: aprobado por el usuario (2026-10-05)

## Objetivo

Hacer que el simulador de cada lección se sienta como programar de verdad:
una consola interactiva con estado persistente, en vez del actual
textarea de un solo disparo donde cada ejecución parte de cero.

## Contexto actual

- `SimulatorPanel.tsx`: editor (textarea) + Ejecutar + output + Verificar
  (solo pyodide) + editor de bloques + solución + XP.
- `BashSim` (`services/bashSim.ts`): se instancia de nuevo en cada
  ejecución → archivos, `cd`, variables y pipes se pierden entre comandos.
  Soporta pipes, redirects, `;`, `&&`, env y cwd en memoria.
- Pyodide (`services/pyodide.ts`): runner singleton; `input()` no es
  interactivo; no hay historial ni REPL visible.
- Verificación con tests + XP (+25) + navegación a siguiente lección ya
  existen y no se tocan salvo lo indicado abajo.

## 1. Arquitectura

- Nuevo componente `TerminalPanel` dentro de la pestaña Simulador, debajo
  del editor de código actual (el editor se mantiene).
- Nuevo módulo `services/sessionStore.ts`: `Map<sessionKey, Session>` donde
  `sessionKey = lessonId + ':' + engine`. La sesión sobrevive a la
  navegación entre lecciones; solo se destruye con "Reiniciar sesión" o
  reset del progreso.
- `BashSession`: envuelve UNA instancia de `BashSim` reutilizada en cada
  comando (filesystem, env, cwd y exit codes persisten).
- `PySession`: usa el runner Pyodide compartido pero con un namespace propio
  por sesión (un `dict` de globals por sesión pasado a `runPythonAsync`;
  las variables de una lección nunca contaminan otra). "Reiniciar sesión"
  descarta el dict y crea uno nuevo. La verificación con tests existente
  (`verify`) sigue usando el namespace global como hasta ahora.
- Botones del panel: Ejecutar en terminal, Reiniciar sesión, Verificar
  (sin cambios), Mostrar solución (sin cambios).

## 2. Comportamiento de la terminal

- Prompt realista: `user@ed-dev:~$` (bash, refleja `cwd`) y `>>>`
  (python). Cada comando ejecutado queda en un historial visible con su
  salida debajo, estilo terminal.
- Historial de comandos con ↑/↓, limpiar vista con Ctrl+L.
- Autocompletado básico con Tab en Bash (comandos implementados + rutas
  del filesystem virtual). Sin autocompletado inteligente.
- `input()` interactivo en Python: si el código en ejecución pide entrada,
  la terminal muestra un prompt inline y pausa hasta recibirla.
- Bash honesto: `bash: <cmd>: command not found`, `$?` con el último exit
  code, `stderr` separado visualmente.
- "Ejecutar en terminal": corre el contenido del editor dentro de la
  sesión activa; las variables/funciones/archivos creados quedan
  disponibles para seguir experimentando comando a comando.
- Accesibilidad: la terminal es navegable por teclado, `aria-live`
  polite en la salida, foco visible en la línea de entrada.
- i18n: todos los textos de UI por `t()` (es/en). Estilos con CSS vars.

## 3. Retos y progreso

- Sin cambios: tests de verificación, +25 XP, badge de mejor puntaje,
  botón a la siguiente lección.
- Único añadido: tras 2 verificaciones fallidas consecutivas de la misma
  lección, se muestra automáticamente la primera pista (`quiz.pista` si
  existe en el JSON; si no existe el campo, se omite sin error).
- No se toca el sistema de XP, rachas ni dashboard.

## 4. Testing y límites

Tests nuevos (Vitest + Testing Library):
- `sessionStore`: misma key devuelve la misma sesión; reinicio la destruye.
- `BashSession`: `mkdir/cd`, archivos y `export` persisten entre comandos;
  `$?` refleja el último exit code.
- `PySession`/`pyodide`: variables persisten entre ejecuciones; reset las
  limpia (mock del runner si Pyodide no carga en jsdom).
- `TerminalPanel`: render de prompt, ↑ recupera el comando anterior,
  Ctrl+L limpia la vista, flujo de `input()` interactivo.

Límites explícitos (fuera de alcance, posible fase 2):
- Sin multi-archivo ni explorador de archivos.
- Sin autocompletado inteligente ni lint en la terminal.
- Motores `subprocess_sim`, `profiling_sim`, `bs4_fixture` siguen sin
  ejecutarse (muestran el aviso actual).
- Todo debe seguir funcionando offline-first.

## Archivos previstos

- Nuevo: `src/services/sessionStore.ts`, `src/components/simulator/TerminalPanel.tsx`
- Modificar: `src/components/lesson/LessonView.tsx` o `SimulatorPanel.tsx`
  (integrar el panel), `src/i18n/es.json`, `src/i18n/en.json`
- Tests: `src/services/sessionStore.test.ts`,
  `src/components/simulator/TerminalPanel.test.tsx`
