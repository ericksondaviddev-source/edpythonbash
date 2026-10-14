export interface Quiz {
  pregunta: string
  opciones: string[]
  correcta: string
  explicacion: string
}

export interface QuizIA {  pregunta: string
  opciones: string[]
  correcta: string
  explicacion: string
  tipo: 'concepto' | 'codigo' | 'debugging'
}

export interface Simulator {
  tipo: 'fix_bug' | 'fill_blank' | 'drag_drop' | 'performance_test'
  engine:
    | 'pyodide'
    | 'bash_sim'
    | 'js'
    | 'subprocess_sim'
    | 'profiling_sim'
    | 'bs4_fixture'
    | 'concurrency_sim'
    | 'pytest_sim'
    | 'string_match'
    | 'tomllib_validate'
    | 'json_match'
    | 'none'
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
  /** IDs de bloques que el alumno debe colocar en el editor de bloques para superar el reto. */
  bloques_requeridos?: string[]
}

export interface AssertException {
  caso: string
  esperada: string
}

export interface TutorStep {
  /** Código que se escribe carácter a carácter (formato legacy). */
  code: string
  /** Texto narrado al alumno (voz o subtítulos). */
  narration: string
  /** Línea o rango de líneas del código corregido que se destaca (formato nuevo). */
  code_lines?: { start: number; end: number }
  /** Variables esperadas en memoria tras ejecutar este paso. */
  expected_vars?: Record<string, string>
}

/** Datos de un diagrama de flujo. */
export interface FlowchartData {
  nodes: FlowchartNode[]
  edges: FlowchartEdge[]
}

export type FlowchartNodeType = 'start' | 'process' | 'decision' | 'end'

export interface FlowchartNode {
  id: string
  type: FlowchartNodeType
  position: { x: number; y: number }
  data: { label: string; description?: string }
}

export interface FlowchartEdge {
  id: string
  source: string
  target: string
  label?: string
  sourceHandle?: string
  targetHandle?: string
}

/** Campo opcional: diagrama de flujo asociado a la lección. */
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
  quiz_ia?: QuizIA[]
  tutor_steps?: TutorStep[]
  _enriched?: boolean
  simulador?: Simulator
  colab?: Colab
  flowchart_data?: FlowchartData
  flowchart_objetivo?: string
  flowchart_mode?: 'view' | 'build'
  flowchart_starter?: FlowchartData
  flowchart_rules?: string[]
  audio_script: string
  video_prompt: string
  trazabilidad: Trazabilidad
  tags_rag: string[]
}

export interface LessonSummary {
  id: string
  modulo: string
  fase: number
  nivel: 'principiante' | 'intermedio' | 'avanzado'
  competencia: string
  tags_rag: string[]
  flowchart_mode?: 'view' | 'build'
  file?: string
}

export interface Module<T = Lesson> {
  id: string
  nombre: string
  fase: number
  lecciones: T[]
}

export interface Trazabilidad {
  libros_fuente: string[]
  conceptos_clave: string[]
}

export interface Colab {
  objetivo?: string
  sitios_practica?: string[]
  celdas: ColabCell[]
}

export interface ColabCell {
  tipo: 'markdown' | 'code'
  contenido: string
}

export interface AssertReturn {
  caso: string
  esperado: number | string | boolean
}

export interface AssertException {
  caso: string
  esperada: string
}
