export interface Quiz {
  pregunta: string
  opciones: string[]
  correcta: string
  explicacion: string
}

export interface Simulator {
  tipo: 'fix_bug' | 'fill_blank' | 'drag_drop' | 'performance_test'
  engine: 'pyodide' | 'bash_sim' | 'subprocess_sim' | 'profiling_sim' | 'bs4_fixture'
  instruccion: string
  setup_code?: string
  codigo_inicial: string
  test_code?: string
  asserts_stdout?: string[]
  asserts_return?: AssertReturn[]
  asserts_exception?: AssertException[]
  asserts_forbidden?: string[]
  asserts_performance?: string[]
  solucion: string
}

export interface Lesson {
  id: string
  modulo: string
  competencia: string
  nivel: 'principiante' | 'intermedio' | 'avanzado'
  fase: number
  microproyecto: string
  modelo_mental: string
  codigo_roto: string
  diagnostico: string
  codigo_corregido: string
  codigo_optimizado: string
  disenso_experto: string
  pregunta_transferencia: string
  quiz: Quiz
  simulador?: Simulator
  audio_script: string
  video_prompt: string
  trazabilidad: Trazabilidad
  tags_rag: string[]
}

export interface Module {
  id: string
  nombre: string
  fase: number
  lecciones: Lesson[]
}

export interface Trazabilidad {
  libros_fuente: string[]
  conceptos_clave: string[]
}

export interface AssertReturn {
  caso: string
  esperado: number | string | boolean
}

export interface AssertException {
  caso: string
  esperada: string
}
