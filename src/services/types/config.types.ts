// src/services/types/config.types.ts

// ── Tipos de motores ──────────────────────────────────────────────────────────
export type MotorTipo  = 'local' | 'cloud'
export type MotorScope = 'local' | 'cloud' | 'all'

export interface ConfiguracionIA {
  motor_vectores: MotorTipo
  motor_llm: MotorTipo
}

// Las 3 combinaciones válidas (cloud:local eliminado — incompatibilidad estructural)
export const MODOS_IA = [
  {
    id: 'local:local',
    motor_vectores: 'local'  as MotorTipo,
    motor_llm:      'local'  as MotorTipo,
    label:          'Todo Local',
    descripcion:    'Vectores Ollama + LLM Llama 3.1. Máxima privacidad, sin internet.',
    icono:          'mdi:server-network',
    color:          'blue',
  },
  {
    id: 'cloud:cloud',
    motor_vectores: 'cloud'  as MotorTipo,
    motor_llm:      'cloud'  as MotorTipo,
    label:          'Todo Nube',
    descripcion:    'Vectores Gemini Embedding + LLM Gemini Flash. Máximo rendimiento.',
    icono:          'mdi:cloud-outline',
    color:          'emerald',
  },
  {
    id: 'local:cloud',
    motor_vectores: 'local'  as MotorTipo,
    motor_llm:      'cloud'  as MotorTipo,
    label:          'Vectores Local + LLM Nube',
    descripcion:    'Busca en vectores Ollama locales, pero responde con Gemini Flash.',
    icono:          'mdi:server-network',
    color:          'violet',
  },
]

// ─── TIPOS PARA PARÁMETROS RAG ────────────────────────────────────────────────

/** Valores editables del sistema RAG — espejo del modelo de BD del backend */
export interface RagParams {
  // Parámetros esenciales RAG
  umbral_relevancia_local: number
  umbral_relevancia_cloud: number
  rag_k_local: number
  rag_k_cloud: number
}

/** Límites de validación de un parámetro, tal como los devuelve el backend */
export interface ParamLimit {
  min: number
  max: number
  type: 'int' | 'float'
  default: number
  label: string
  descripcion: string
}

/** Respuesta completa de GET /api/rag-params */
export interface RagParamsResponse {
  ok: boolean
  parametros_actuales: RagParams & {
    prompt_principal: string | null
  }
  defaults: RagParams
  limites: Record<keyof RagParams, ParamLimit>
  fecha_actualizacion: string | null
  prompts_default_texto: {
    prompt_principal: string
  }
}

/** Respuesta de PUT /api/rag-params */
export interface RagParamsUpdateResponse {
  ok: boolean
  mensaje: string
  params_cambiados: string[]
  params_sin_cambio: string[]
  acciones_limpieza: string[]
  advertencias: string[]
  parametros_actuales: RagParams
}

/** Respuesta de POST /api/rag-params/reset */
export interface RagParamsResetResponse {
  ok: boolean
  mensaje: string
  params_reseteados: string[]
  acciones_limpieza: string[]
  advertencias: string[]
  parametros_actuales: RagParams
  defaults: RagParams
}

/** Payload para actualizar prompts */
export interface PromptsUpdatePayload {
  prompt_principal?: string   // texto completo → guarda; "" → resetea al hardcodeado
}

/** Respuesta de actualizar prompts (reutiliza el mismo PUT /api/rag-params) */
export interface PromptsUpdateResponse {
  ok: boolean
  mensaje: string
  params_cambiados: string[]
  params_sin_cambio: string[]
  acciones_limpieza: string[]
  advertencias: string[]
  parametros_actuales: RagParams & {
    prompt_principal: string | null
  }
}