/** Un paso de la traza: estado de la memoria + salida acumulada en una línea. */
export interface TraceStep {
  /** Número de línea original del código del usuario (1-based). -1 = error/sin línea. */
  lineno: number
  /** Variables visibles en este paso: nombre -> repr. */
  variables: Record<string, string>
  /** Líneas de consola producidas hasta este paso (acumulado). */
  output: string[]
  /** Mensaje de error si este paso falló (ej. "TypeError: ..."). */
  error?: string
}

/** Resultado agregado devuelto por el motor de traza. */
export interface TraceResult {
  parse_error: string
  steps: string[]
}
