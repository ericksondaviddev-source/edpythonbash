import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODULOS_DIR = path.join(__dirname, '..', 'src', 'data', 'modulos')

const MODELS = ['openrouter/free', 'google/gemma-4-31b-it:free', 'qwen/qwen3.8-27b:free']
const API_KEY = process.env.OPENROUTER_API_KEY
const REQUEST_DELAY_MS = 15000
const sleep = ms => new Promise(r => setTimeout(r, ms))

if (!API_KEY) {
  console.error('ERROR: set OPENROUTER_API_KEY env var')
  process.exit(1)
}

const args = process.argv.slice(2)
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : Infinity
const fileIdx = args.indexOf('--file')
const FILE_FILTER = fileIdx >= 0 ? args[fileIdx + 1] : null

function buildPrompt(lesson) {
  return `Eres un profesor experto de programación. Enriquece los campos de esta lección para que sean MÁS PROFUNDOS y didácticos, manteniendo el idioma español.

REGLAS:
- modelo_mental: expande a 2-3 párrafos. Incluye la analogía central, por qué importa, y qué errores previene. Usa **negritas** para conceptos clave y \`código\` inline cuando ayude.
- diagnostico: expande a 2-3 párrafos numerados si hay varios errores. Explica CADA error línea por línea, por qué Python/Bash lo lanza, y el patrón general que hay que aprender.
- pregunta_transferencia: expande a 2 párrafos. Presenta el escenario de transferencia con más detalle y una pista de cómo resolverlo (sin dar la solución completa).

LECCIÓN ACTUAL:
id: ${lesson.id}
modulo: ${lesson.modulo}
competencia: ${lesson.competencia}
modelo_mental: ${lesson.modelo_mental}
codigo_roto:
${lesson.codigo_roto}
diagnostico: ${lesson.diagnostico}
pregunta_transferencia: ${lesson.pregunta_transferencia}

Responde SOLO con JSON válido (sin markdown fences):
{"modelo_mental": "...", "diagnostico": "...", "pregunta_transferencia": "..."}`
}

async function callOpenRouter(prompt) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6
          })
        })
        if (res.status === 429) {
          console.warn(`  [${model}] 429 rate limit, esperando 30s (intento ${attempt + 1}/3)...`)
          await sleep(30000)
          continue
        }
        if (!res.ok) {
          console.warn(`  [${model}] HTTP ${res.status}, probando fallback...`)
          break
        }
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content
        if (!text) continue
        return { model, text }
      } catch (err) {
        console.warn(`  [${model}] ${err.message}, probando fallback...`)
        break
      }
    }
  }
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

const files = fs
  .readdirSync(MODULOS_DIR)
  .filter(f => f.endsWith('.json'))
  .filter(f => !f.includes('profiling') && !f.includes('EXTENSI'))
  .filter(f => (FILE_FILTER ? f === FILE_FILTER : true))

let enriched = 0
let failed = 0
let skipped = 0

for (const file of files) {
  const filePath = path.join(MODULOS_DIR, file)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let dirty = false

  for (const lesson of data) {
    if (enriched + failed >= LIMIT) break
    if (lesson._enriched) {
      skipped++
      continue
    }

    console.log(`→ ${lesson.id} (${lesson.modulo})`)
    await sleep(REQUEST_DELAY_MS)
    const result = await callOpenRouter(buildPrompt(lesson))

    if (!result) {
      console.error(`  ✗ FALLÓ (todos los modelos)`)
      failed++
      continue
    }

    const parsed = parseJSONLoose(result.text)
    if (!parsed || !parsed.modelo_mental || !parsed.diagnostico || !parsed.pregunta_transferencia) {
      console.error(`  ✗ respuesta JSON inválida (${result.model})`)
      failed++
      continue
    }

    lesson.modelo_mental = parsed.modelo_mental
    lesson.diagnostico = parsed.diagnostico
    lesson.pregunta_transferencia = parsed.pregunta_transferencia
    lesson._enriched = true
    enriched++
    dirty = true
    console.log(`  ✓ OK (${result.model}, ${result.text.length} chars)`)

    // checkpoint cada 5 lecciones
    if (enriched % 5 === 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
      console.log(`  [checkpoint guardado: ${file}]`)
    }
  }

  if (dirty) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
  }
}

console.log(`\n=== Resumen: ${enriched} enriquecidas, ${skipped} ya listas, ${failed} fallidas ===`)
