import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const modulosDir = path.resolve(__dirname, '../src/data/modulos')
const outputFile = path.resolve(__dirname, '../src/data/catalog.json')

const files = fs
  .readdirSync(modulosDir)
  .filter(f => f.endsWith('.json') && !f.includes('profiling_sim') && !f.includes('EXTENSI'))

const catalog = []

for (const file of files) {
  const filePath = path.join(modulosDir, file)
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const content = JSON.parse(raw)
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item && item.id && item.modulo && item.competencia) {
          catalog.push({
            id: item.id,
            modulo: item.modulo,
            fase: typeof item.fase === 'number' ? item.fase : 0,
            nivel: item.nivel || 'principiante',
            competencia: item.competencia,
            tags_rag: Array.isArray(item.tags_rag) ? item.tags_rag : [],
            flowchart_mode: item.flowchart_mode,
            file
          })
        }
      }
    }
  } catch (err) {
    console.error(`Error procesando ${file}:`, err.message)
  }
}

// Ordenar por fase y luego id numérico
catalog.sort((a, b) => {
  if (a.fase !== b.fase) return a.fase - b.fase
  return a.id.localeCompare(b.id, 'en', { numeric: true })
})

fs.writeFileSync(outputFile, JSON.stringify(catalog, null, 2), 'utf8')
console.log(`✓ Catálogo generado exitosamente: ${catalog.length} lecciones -> ${outputFile}`)
