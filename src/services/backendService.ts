// src/services/backendService.ts
// Archivo refactorizado que re-exporta todas las APIs y tipos para mantener compatibilidad

// ─── RE-EXPORTAR TIPOS ────────────────────────────────────────────────────────
export * from './types/chat.types'
export * from './types/config.types'
export * from './types/documento.types'
export * from './types/evaluacion.types'
export * from './types/monitor.types'
export * from './types/usuario.types'

// ─── ALIAS PARA COMPATIBILIDAD ────────────────────────────────────────────────
export type { EventoSSE as EventoEvaluacion } from './types/evaluacion.types'

// ─── RE-EXPORTAR APIs ─────────────────────────────────────────────────────────
export * from './api/chatApi'
export * from './api/configApi'
export * from './api/documentsApi'
export * from './api/evaluacionApi'
export * from './api/monitorApi'
export * from './api/ragParamsApi'
export * from './api/usersApi'

// ─── FUNCIONES PÚBLICAS (no requieren token) ──────────────────────────────────

import { BACKEND_URL } from '@/config/config'

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/`)
    return res.ok
  } catch {
    return false
  }
}