// src/services/api/ragParamsApi.ts
import { BACKEND_URL } from '@/config/config'
import { getAuthHeaders } from '@/services/authService'
import type { 
  RagParamsResponse, 
  RagParamsUpdateResponse, 
  RagParamsResetResponse,
  PromptsUpdatePayload,
  PromptsUpdateResponse,
  RagParams 
} from '../types/config.types'

export async function obtenerRagParams(): Promise<RagParamsResponse> {
  const res = await fetch(`${BACKEND_URL}/api/rag-params`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al obtener parámetros RAG.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function actualizarRagParams(params: Partial<RagParams>): Promise<RagParamsUpdateResponse> {
  const res = await fetch(`${BACKEND_URL}/api/rag-params`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al actualizar parámetros RAG.' }))
    const detail = err.detail
    if (typeof detail === 'object' && detail?.errores) {
      throw new Error(detail.mensaje ?? 'Valores inválidos.')
    }
    throw new Error(typeof detail === 'string' ? detail : `HTTP ${res.status}`)
  }
  return res.json()
}

/** Restaura todos los parámetros RAG a sus valores por defecto */
export async function resetearRagParams(): Promise<RagParamsResetResponse> {
  const res = await fetch(`${BACKEND_URL}/api/rag-params/reset`, {
    method:  'POST',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al restaurar parámetros RAG.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * Guarda uno o ambos prompts.
 * - Texto completo → se persiste en BD y se usa en runtime.
 * - Cadena vacía "" → borra el prompt de BD (vuelve al hardcodeado).
 */
export async function actualizarPrompts(
  payload: PromptsUpdatePayload,
): Promise<PromptsUpdateResponse> {
  const res = await fetch(`${BACKEND_URL}/api/rag-params`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al guardar los prompts.' }))
    const detail = err.detail
    if (typeof detail === 'object' && detail?.errores) {
      throw new Error(detail.mensaje ?? 'Prompt inválido.')
    }
    throw new Error(typeof detail === 'string' ? detail : `HTTP ${res.status}`)
  }
  return res.json()
}