import type { TraceStep } from '../types/trace'

export type { TraceStep } from '../types/trace'

/**
 * API pública del tracer de Python. Ejecuta el código línea por línea
 * y devuelve un snapshot por paso (variables visibles + salida).
 * Requiere que Pyodide esté cargado (se carga bajo demanda).
 */
export async function tracePython(code: string): Promise<TraceStep[]> {
  const { getPyodideRunner } = await import('../services/pyodide')
  const runner = getPyodideRunner()
  return runner.trace(code)
}

/**
 * A partir del repr de un valor, deduce una etiqueta de tipo
 * amigable para mostrar junto a la variable.
 */
export function guessType(repr: string): string {
  if (repr === 'None') return 'NoneType'
  if (repr === 'True' || repr === 'False') return 'bool'
  if (/^-?\d+$/.test(repr)) return 'int'
  if (/^-?\d*\.\d+$/.test(repr)) return 'float'
  if (/^'.*'$/.test(repr) || /^".*"$/.test(repr)) return 'str'
  if (/^\[.*\]$/.test(repr)) return 'list'
  if (/^\{.*\}$/.test(repr)) return 'dict'
  if (/^\(.*\)$/.test(repr)) return 'tuple'
  if (/^set\(/.test(repr)) return 'set'
  if (/^<.*>$/.test(repr)) return 'obj'
  return 'var'
}
