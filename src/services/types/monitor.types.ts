// src/services/types/monitor.types.ts

export interface ConsultaActiva {
  id: string
  pregunta: string
  motor: string
  inicio: number
}

export interface RegistroHistorial {
  id: string
  pregunta: string
  motor: string
  inicio: number
  fin: number
  latencia_ms: number
  cache: boolean
}

export interface EstadoMonitor {
  activas: ConsultaActiva[]
  total_activas: number
  historial: RegistroHistorial[]
  latencia_avg_ms: number
  cache_hits: number
  total_consultas: number
  timestamp: number
}