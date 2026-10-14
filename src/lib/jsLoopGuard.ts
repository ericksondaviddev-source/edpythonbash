/**
 * Guard de bucles para el motor JS.
 *
 * El motor ejecuta el código del alumno dentro de un iframe aislado. Un
 * `while (true)` sin salida colgaría el hilo de ese iframe, así que
 * reescribimos las condiciones de bucle para llamar a `__tick()` en cada
 * iteración y abortar con un error claro al superar el límite.
 *
 * El reescritor es un escáner ligero (sin parser) que salta cadenas,
 * plantillas y comentarios para no confundir `while` dentro de un string
 * con un bucle real. No es un parser de JS completo: está pensado para el
 * código educativo de las lecciones.
 */

/** Iteraciones máximas antes de abortar (protege contra bucles infinitos). */
export const MAX_LOOP_ITERATIONS = 5000

/** Nombre de la función inyectada en el preámbulo. */
export const TICK_FN = '__tick'

const PREAMBLE = `
var __lc = 0;
function ${TICK_FN}() {
  if (++__lc > ${MAX_LOOP_ITERATIONS}) {
    throw new Error('Bucle infinito detectado: se superaron ${MAX_LOOP_ITERATIONS} iteraciones.');
  }
  return true;
}
`.trim()

type State = 'code' | 'sq' | 'dq' | 'template' | 'line' | 'block'

/** Devuelve el índice del `)` que cierra el `(` en `start`, o -1. */
function findMatchingParen(code: string, start: number): number {
  let depth = 0
  let state: State = 'code'
  for (let i = start; i < code.length; i++) {
    const ch = code[i]
    const next = code[i + 1]
    if (state === 'code') {
      if (ch === '/' && next === '/') { state = 'line'; i++; continue }
      if (ch === '/' && next === '*') { state = 'block'; i++; continue }
      if (ch === "'") { state = 'sq'; continue }
      if (ch === '"') { state = 'dq'; continue }
      if (ch === '`') { state = 'template'; continue }
      if (ch === '(') depth++
      else if (ch === ')') { depth--; if (depth === 0) return i }
      continue
    }
    if (state === 'line') { if (ch === '\n') state = 'code'; continue }
    if (state === 'block') { if (ch === '*' && next === '/') { state = 'code'; i++ } continue }
    if (state === 'sq') { if (ch === '\\') { i++; continue } if (ch === "'") state = 'code'; continue }
    if (state === 'dq') { if (ch === '\\') { i++; continue } if (ch === '"') state = 'code'; continue }
    if (state === 'template') { if (ch === '\\') { i++; continue } if (ch === '`') state = 'code'; continue }
  }
  return -1
}

/** ¿`pos` no está pegado por la izquierda a otro carácter de identificador? */
function isBoundaryBefore(code: string, pos: number): boolean {
  if (pos <= 0) return true
  return !/[A-Za-z0-9_$]/.test(code[pos - 1])
}

/** ¿`pos` no está pegado por la derecha a otro carácter de identificador? */
function isBoundaryAfter(code: string, pos: number): boolean {
  if (pos >= code.length) return true
  return !/[A-Za-z0-9_$]/.test(code[pos])
}

/** Cuenta `;` de nivel superior dentro de un rango (ignora anidados y cadenas). */
function countTopLevelSemicolons(code: string, from: number, to: number): number {
  let depth = 0
  let state: State = 'code'
  let count = 0
  for (let i = from; i < to; i++) {
    const ch = code[i]
    const next = code[i + 1]
    if (state === 'code') {
      if (ch === '/' && next === '/') { state = 'line'; i++; continue }
      if (ch === '/' && next === '*') { state = 'block'; i++; continue }
      if (ch === "'") { state = 'sq'; continue }
      if (ch === '"') { state = 'dq'; continue }
      if (ch === '`') { state = 'template'; continue }
      if (ch === '(' || ch === '[' || ch === '{') depth++
      else if (ch === ')' || ch === ']' || ch === '}') depth--
      else if (ch === ';' && depth === 0) count++
      continue
    }
    if (state === 'line') { if (ch === '\n') state = 'code'; continue }
    if (state === 'block') { if (ch === '*' && next === '/') { state = 'code'; i++ } continue }
    if (state === 'sq') { if (ch === '\\') { i++; continue } if (ch === "'") state = 'code'; continue }
    if (state === 'dq') { if (ch === '\\') { i++; continue } if (ch === '"') state = 'code'; continue }
    if (state === 'template') { if (ch === '\\') { i++; continue } if (ch === '`') state = 'code'; continue }
  }
  return count
}

/**
 * Reescribe las condiciones de `while`/`for` para llamar a `__tick()`.
 * Devuelve el código transformado (sin el preámbulo).
 */
function rewriteLoops(code: string): string {
  let out = ''
  let i = 0
  let state: State = 'code'

  while (i < code.length) {
    const ch = code[i]
    const next = code[i + 1]

    if (state !== 'code') {
      out += ch
      if (state === 'line') { if (ch === '\n') state = 'code'; i++; continue }
      if (state === 'block') { if (ch === '*' && next === '/') { out += next; state = 'code'; i += 2; continue } i++; continue }
      if (state === 'sq') { if (ch === '\\') { out += next ?? ''; i += 2; continue } if (ch === "'") state = 'code'; i++; continue }
      if (state === 'dq') { if (ch === '\\') { out += next ?? ''; i += 2; continue } if (ch === '"') state = 'code'; i++; continue }
      if (state === 'template') { if (ch === '\\') { out += next ?? ''; i += 2; continue } if (ch === '`') state = 'code'; i++; continue }
      continue
    }

    if (ch === '/' && next === '/') { state = 'line'; out += ch; i++; continue }
    if (ch === '/' && next === '*') { state = 'block'; out += ch; i++; continue }
    if (ch === "'") { state = 'sq'; out += ch; i++; continue }
    if (ch === '"') { state = 'dq'; out += ch; i++; continue }
    if (ch === '`') { state = 'template'; out += ch; i++; continue }

    // ¿keyword while / for?
    if ((ch === 'w' || ch === 'f') && isBoundaryBefore(code, i)) {
      const kw = ch === 'w' ? 'while' : 'for'
      if (code.startsWith(kw, i) && isBoundaryAfter(code, i + kw.length)) {
        let j = i + kw.length
        while (j < code.length && /\s/.test(code[j])) j++
        if (code[j] === '(') {
          const close = findMatchingParen(code, j)
          if (close !== -1) {
            const cond = code.slice(j + 1, close)
            if (kw === 'while') {
              // Parentizar la condición completa evita que `||` anule el tick
              // por precedencia: `a || b && tick()` no llamaría a tick si a es true.
              // Emitimos el `)` de cierre porque saltamos el original (close + 1).
              out += `${kw} ((${cond.trim()}) && ${TICK_FN}())`
              i = close + 1
              continue
            }
            // for: clásico (init; cond; update) lleva 2 ';' de nivel superior
            const semis = countTopLevelSemicolons(code, j + 1, close)
            if (semis === 2) {
              const parts = splitForParts(code, j + 1, close)
              const trimmedCond = parts.cond.trim()
              const guarded = trimmedCond
                ? `(${trimmedCond}) && ${TICK_FN}()`
                : `${TICK_FN}()`
              out += `for (${parts.init}; ${guarded};${parts.update})`
              i = close + 1
              continue
            }
            // for...of / for...in: sin condición, no se toca
          }
        }
      }
    }

    out += ch
    i++
  }
  return out
}

/** Divide el header de un `for` clásico en init / cond / update. */
function splitForParts(code: string, from: number, to: number): { init: string; cond: string; update: string } {
  let depth = 0
  let state: State = 'code'
  const marks: number[] = []
  for (let i = from; i < to; i++) {
    const ch = code[i]
    const next = code[i + 1]
    if (state === 'code') {
      if (ch === '/' && next === '/') { state = 'line'; i++; continue }
      if (ch === '/' && next === '*') { state = 'block'; i++; continue }
      if (ch === "'") { state = 'sq'; continue }
      if (ch === '"') { state = 'dq'; continue }
      if (ch === '`') { state = 'template'; continue }
      if (ch === '(' || ch === '[' || ch === '{') depth++
      else if (ch === ')' || ch === ']' || ch === '}') depth--
      else if (ch === ';' && depth === 0) marks.push(i)
      continue
    }
    if (state === 'line') { if (ch === '\n') state = 'code'; continue }
    if (state === 'block') { if (ch === '*' && next === '/') { state = 'code'; i++ } continue }
    if (state === 'sq') { if (ch === '\\') { i++; continue } if (ch === "'") state = 'code'; continue }
    if (state === 'dq') { if (ch === '\\') { i++; continue } if (ch === '"') state = 'code'; continue }
    if (state === 'template') { if (ch === '\\') { i++; continue } if (ch === '`') state = 'code'; continue }
  }
  const [s1, s2] = marks
  return {
    init: code.slice(from, s1),
    cond: code.slice(s1 + 1, s2),
    update: code.slice(s2 + 1, to),
  }
}

/**
 * Aplica el guard de bucles al código del alumno y devuelve el código
 * final listo para ejecutar (preámbulo + transformación).
 */
export function injectLoopGuard(code: string): string {
  const guarded = rewriteLoops(code)
  const touched = guarded !== code
  if (!touched) return code
  return `${PREAMBLE}\n${guarded}`
}
