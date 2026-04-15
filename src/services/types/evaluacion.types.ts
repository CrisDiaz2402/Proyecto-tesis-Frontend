// src/services/types/evaluacion.types.ts

export type TipoCaso = 'contiene' | 'no_contiene' | 'corrige' | 'no_alucina'
export type Veredicto = 'PASS' | 'PARCIAL' | 'FAIL'

export interface CasoEvaluacion {
  id: string
  grupo: string
  tipo: TipoCaso
  pregunta: string
  claves: string[]
  claves_prohibidas: string[]
  descripcion?: string
  habilitado: boolean
}

export interface EjecucionRequest {
  experimento: string
  casos: CasoEvaluacion[]
}

export interface ResultadoCaso {
  id: string
  grupo: string
  tipo: TipoCaso
  pregunta: string
  respuesta: string
  latencia_ms: number
  score: number        // 0.0 | 0.5 | 1.0
  veredicto: Veredicto
  detalle: string
  descripcion?: string
}

export interface ResumenGrupo {
  promedio: number
  pass: number
  parcial: number
  fail: number
  total: number
}

export interface ConteoGlobal {
  pass: number
  parcial: number
  fail: number
  total: number
}

export interface ResultadoEvaluacion {
  experimento: string
  motor: string
  timestamp: string
  duracion_total_seg: number
  resultados: ResultadoCaso[]
  resumen_por_grupo: Record<string, ResumenGrupo>
  score_global: number
  conteo_global: ConteoGlobal
}

// ── Tipos de eventos SSE ───────────────────────────────────────────────────────

export interface EventoProgreso {
  tipo: 'progreso'
  caso_actual: number
  total_casos: number
  porcentaje: number       // 0–100, calculado por el backend
  resultado: ResultadoCaso
}

export interface EventoCompletado {
  tipo: 'completado'
  caso_actual: number
  total_casos: number
  porcentaje: number
  resultado_final: ResultadoEvaluacion
}

export interface EventoError {
  tipo: 'error'
  caso_actual: number
  total_casos: number
  mensaje: string
  detalle?: any
}

export type EventoSSE = EventoProgreso | EventoCompletado | EventoError