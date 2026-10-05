import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODULOS_DIR = path.join(__dirname, '..', 'src', 'data', 'modulos')

const MODELS = ['openrouter/free', 'google/gemma-4-31b-it:free', 'qwen/qwen3.8-27b:free']
const API_KEY = process.env.OPENROUTER_API_KEY
const REQUEST_DELAY_MS = 6000
const RETRY_429_WAIT_MS = 30000
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
if (!API_KEY) {
  console.error('ERROR: set OPENROUTER_API_KEY env var')
  process.exitCode = 1
  return
}

const args = process.argv.slice(2)
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : Infinity
const fileIdx = args.indexOf('--file')
const FILE_FILTER = fileIdx >= 0 ? args[fileIdx + 1] : null

/** Lock anti-concurrencia: evita dos pasadas escribiendo los mismos JSON. */
const LOCK_FILE = path.join(__dirname, '.enrich-all.lock')
const STALE_MS = 3 * 3600 * 1000
try {
  if (fs.existsSync(LOCK_FILE)) {
    const born = Number(fs.readFileSync(LOCK_FILE, 'utf8')) || 0
    if (Date.now() - born < STALE_MS) {
      console.log('Otra pasada en curso (lock activo). Saliendo.')
      return
    }
    console.warn('Lock obsoleto (>3h), se continúa.')
  }
  fs.writeFileSync(LOCK_FILE, String(Date.now()))
} catch { /* sin lock no se puede garantizar exclusión, se continúa */ }
const releaseLock = () => { try { fs.unlinkSync(LOCK_FILE) } catch {} }
process.on('exit', releaseLock)
process.on('SIGINT', () => process.exit(130))
process.on('SIGTERM', () => process.exit(143))

/** 0 = salir: comprueba la cuota diaria gratuita antes de gastar requests. */
async function checkQuota() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${API_KEY}` },
      signal: AbortSignal.timeout(60000)
    })
    if (!res.ok) {
      console.warn(`No se pudo comprobar la cuota (HTTP ${res.status}), se continúa con cautela.`)
      return true
    }
    const data = (await res.json()).data || {}
    const free = data.free_model_daily_requests
    if (free && typeof free.remaining === 'number') {
      console.log(`Cuota diaria gratuita: ${free.used}/${free.limit} usadas, ${free.remaining} restantes.`)
      if (free.remaining <= 0) {
        console.error('Cuota diaria agotada. Saliendo sin gastar requests (código 42).')
        process.exitCode = 42
        return false
      }
    }
    return true
  } catch (err) {
    console.warn(`No se pudo comprobar la cuota (${err.message}), se continúa con cautela.`)
    return true
  }
}

function buildPrompt(items) {
  const bodies = items.map(l => {
    const needs = []
    needs.push(`id: ${l.lesson.id}`)
    needs.push(`modulo: ${l.lesson.modulo}`)
    needs.push(`competencia: ${l.lesson.competencia}`)
    needs.push(`codigo_roto:\n${l.lesson.codigo_roto}`)
    if (l.needEnrich) {
      needs.push(`modelo_mental: ${l.lesson.modelo_mental}`)
      needs.push(`diagnostico: ${l.lesson.diagnostico}`)
      needs.push(`pregunta_transferencia: ${l.lesson.pregunta_transferencia}`)
    }
    if (l.needQuiz) {
      needs.push(`(usa codigo_roto + diagnostico para crear las preguntas quiz)`)
    }
    return needs.join('\n')
  }).join('\n\n---\n\n')

  const tasks = []
  if (items.some(l => l.needEnrich)) {
    tasks.push(`1. ENRIQUECER (solo las lecciones que traen modelo_mental/diagnostico/pregunta_transferencia):
- modelo_mental: expande a 2-3 párrafos (analogía central, por qué importa, qué errores previene). Usa **negritas** y \`código\` inline.
- diagnostico: expande a 2-3 párrafos numerados si hay varios errores. Explica CADA error, por qué Python/Bash lo lanza, y el patrón general.
- pregunta_transferencia: expande a 2 párrafos (escenario + pista sin dar la solución completa).`)
  }
  if (items.some(l => l.needQuiz)) {
    tasks.push(`2. QUIZ_IA (para TODAS las lecciones del bloque): genera 3-4 preguntas de opción múltiple (A/B/C/D) sobre la lección:
- Mezcla tipos: "concepto" (razonamiento), "codigo" (predecir salida o detectar bug en el codigo_roto) y "debugging" (qué causa el error).
- Distractores plausibles (errores típicos reales, no obviedades).
- Cada pregunta: explicacion completa (por qué la correcta lo es y por qué fallan las demás).
- IMPORTANTE: reparte las respuestas correctas entre A, B, C y D (no todas la misma letra).`)
  }

  return `Eres un profesor experto de programación. Todo en español.

TAREAS:
${tasks.join('\n')}

LECCIONES:
${bodies}

Responde SOLO con JSON válido (sin markdown fences), con este formato exacto:
{"lecciones": [{"id": "<id>", "modelo_mental": "...", "diagnostico": "...", "pregunta_transferencia": "...", "quiz_ia": [{"pregunta": "...", "opciones": ["...", "...", "...", "..."], "correcta": "A|B|C|D", "explicacion": "...", "tipo": "concepto|codigo|debugging"}]}]}
(Opcional: añade "omitir_quiz_ia": true o "omitir_enriquecer": true por lección si no puedes completar esa parte.)
PROHIBIDO escribir razonamientos, explicaciones, comentarios o cualquier texto fuera del JSON. Tu respuesta debe EMPEZAR con el carácter { y TERMINAR con el carácter }.`
}

let quotaAbort = false

/** Última causa de fallo de callOpenRouter: 'network' (fetch lanzó),
 *  'http' (HTTP no recuperable) o 'empty' (respuesta vacía). Sirve para
 *  distinguir "red caída" de "cuota agotada" en el mensaje final. */
let lastFailKind = null

async function callOpenRouter(prompt) {
  let kind = null
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(300000),
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: 8000
          })
        })
        if (res.status === 429) {
          console.warn(`  [${model}] 429, esperando 30s (intento ${attempt + 1}/2)...`)
          await sleep(RETRY_429_WAIT_MS)
          continue
        }
        if (res.status === 402) {
          console.warn(`  [${model}] 402 pago requerido, probando siguiente modelo...`)
          break
        }
        if (!res.ok) {
          kind = 'http'
          console.warn(`  [${model}] HTTP ${res.status}, probando siguiente modelo...`)
          break
        }
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content
        if (!text) {
          kind = 'empty'
          console.warn(`  [${model}] respuesta vacía, probando siguiente modelo...`)
          break
        }
        lastFailKind = null
        return { model, text }
      } catch (err) {
        kind = 'network'
        console.warn(`  [${model}] ${err.message}, probando siguiente modelo...`)
        break
      }
    }
  }
  lastFailKind = kind
  return null
}

function parseJSONLoose(text) {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end < 0) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return null
  }
}

const LETTERS = ['A', 'B', 'C', 'D']
function validQuizItem(q) {
  return q && typeof q.pregunta === 'string' && q.pregunta.length > 10 &&
    Array.isArray(q.opciones) && q.opciones.length === 4 &&
    q.opciones.every(o => typeof o === 'string' && o.length > 0) &&
    LETTERS.includes(q.correcta) &&
    typeof q.explicacion === 'string' && q.explicacion.length > 10 &&
    ['concepto', 'codigo', 'debugging'].includes(q.tipo)
}

function applyResult(lesson, item, needEnrich, needQuiz) {
  let okEnrich = !needEnrich
  let okQuiz = !needQuiz
  if (needEnrich && !item.omitir_enriquecer &&
      item.modelo_mental?.length > 200 && item.diagnostico?.length > 200 &&
      item.pregunta_transferencia?.length > 100) {
    lesson.modelo_mental = item.modelo_mental
    lesson.diagnostico = item.diagnostico
    lesson.pregunta_transferencia = item.pregunta_transferencia
    lesson._enriched = true
    okEnrich = true
  }
  if (needQuiz && !item.omitir_quiz_ia &&
      Array.isArray(item.quiz_ia)) {
    const valid = item.quiz_ia.filter(validQuizItem).slice(0, 4)
    if (valid.length >= 2) {
      lesson.quiz_ia = valid
      okQuiz = true
    }
  }
  return { okEnrich, okQuiz }
}

const files = fs
  .readdirSync(MODULOS_DIR)
  .filter(f => f.endsWith('.json'))
  .filter(f => !f.includes('profiling') && !f.includes('EXTENSI'))
  .filter(f => (FILE_FILTER ? f === FILE_FILTER : true))

if ((await checkQuota()) === false) return

let enriched = 0, quized = 0, failed = 0, skipped = 0, batches = 0
let consecNull = 0 // resultados nulos seguidos (cuota agotada o red caída)
let netRetried = false // reintento de red ya usado para el batch actual

for (const file of files) {
  const filePath = path.join(MODULOS_DIR, file)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const arr = Array.isArray(data) ? data : (data.lecciones || [])
  let dirty = false

  // construir lista de trabajo de este archivo
  const work = arr.map(lesson => ({
    lesson,
    needEnrich: !lesson._enriched,
    needQuiz: !(Array.isArray(lesson.quiz_ia) && lesson.quiz_ia.length >= 2)
  })).filter(w => w.needEnrich || w.needQuiz)

  skipped += arr.length - work.length

  for (let i = 0; i < work.length;) {
    if (batches >= LIMIT) break
    if (quotaAbort) break
    // Batch adaptativo: de 2 en 2 solo si NINGUNA necesita enriquecer
    // (el output largo de 2 enrich colapsa a los modelos gratuitos).
    // Si alguna necesita enrich: de 1 en 1 (enrich + quiz_ia combinados).
    const size = (work[i].needEnrich || (work[i + 1] && work[i + 1].needEnrich)) ? 1 : 2
    const batch = work.slice(i, i + size)
    i += size
    batches++
    console.log(`→ batch: ${batch.map(w => w.lesson.id).join(', ')}`)
    await sleep(REQUEST_DELAY_MS)

    let result = await callOpenRouter(buildPrompt(batch))
    if (!result && lastFailKind === 'network' && !netRetried) {
      // Fallo de red transitorio: esperar 60s y reintentar el MISMO batch
      // una vez, sin contar consecNull (no es cuota).
      console.warn('  red caída (fetch failed): esperando 60s y reintentando el batch...')
      await sleep(60000)
      i -= size
      netRetried = true
      continue
    }
    if (!result) {
      // todos los modelos fallaron (cuota o red): 1 fallo aislado se reintenta
      // en la próxima hora; 2 seguidos abortan la pasada
      consecNull++
      console.error(`  ✗ FALLÓ el batch (todos los modelos) [${consecNull}/2]`)
      failed += batch.length
      if (consecNull >= 2) { quotaAbort = true; break }
      continue
    }
    consecNull = 0

    let parsed = parseJSONLoose(result.text)
    let items = parsed?.lecciones?.filter(x => x && typeof x.id === 'string')

    // fallback: si el batch no parsea, guardar respuesta cruda para depurar y reintentar individual
    if (!items || items.length === 0) {
      try {
        fs.writeFileSync(path.join(__dirname, '.debug-last-batch.txt'), result.text, 'utf8')
        console.warn(`  respuesta cruda guardada en .debug-last-batch.txt (${result.text.length} chars)`)
      } catch { /* ignorar */ }
    }
    if (!items || items.length === 0) {
      console.warn(`  respuesta no parseable, reintentando individual...`)
      items = []
      for (const w of batch) {
        await sleep(REQUEST_DELAY_MS)
        const single = await callOpenRouter(buildPrompt([w]))
        if (!single) {
          consecNull++
          console.error(`  ✗ ${w.lesson.id}: sin respuesta [${consecNull}/2]`)
          failed++
          if (consecNull >= 2) { quotaAbort = true }
          break
        }
    consecNull = 0
    netRetried = false
        const p = parseJSONLoose(single.text)
        const one = p?.lecciones?.find(x => x && x.id === w.lesson.id)
        if (one) items.push(one)
        else console.error(`  ✗ ${w.lesson.id}: respuesta inválida incluso individual`)
      }
      if (quotaAbort) break // los fallos ya se contaron dentro del fallback
    }

    const byId = new Map(items.map(x => [x.id, x]))
    for (const w of batch) {
      const item = byId.get(w.lesson.id)
      if (!item) { console.error(`  ✗ ${w.lesson.id}: sin datos en la respuesta`); failed++; continue }
      const { okEnrich, okQuiz } = applyResult(w.lesson, item, w.needEnrich, w.needQuiz)
      if (w.needEnrich && okEnrich) { enriched++; dirty = true }
      else if (w.needEnrich) { failed++ }
      if (w.needQuiz && okQuiz) { quized++; dirty = true }
      else if (w.needQuiz) { failed++ }
      console.log(`  ${w.lesson.id}: enrich=${okEnrich ? 'OK' : (w.needEnrich ? 'FALLO' : 'skip')} quiz=${okQuiz ? 'OK' : (w.needQuiz ? 'FALLO' : 'skip')} (${result.model})`)
    }
    if (dirty) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
      dirty = false
      console.log(`  [guardado: ${file}]`)
    }
  }
  if (quotaAbort || batches >= LIMIT) break
}

console.log(`\n=== Resumen: ${enriched} enriquecidas, ${quized} con quiz_ia, ${failed} fallidas, ${skipped} ya listas (${batches} batches) ===`)
if (quotaAbort) {
  if (lastFailKind === 'network') {
    console.error('ABORTADO: red caída (fetch failed), NO es cuota. Reintentará en la próxima pasada. Código 43.')
    process.exitCode = 43
  } else {
    console.error('ABORTADO: posible cuota agotada. Código 42.')
    process.exitCode = 42
  }
}
} // cierra main()

await main()
