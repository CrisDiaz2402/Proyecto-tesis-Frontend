// src/services/api/configApi.ts
import { BACKEND_URL } from '@/config/config'
import { getAuthHeaders } from '@/services/authService'
import type { ConfiguracionIA } from '../types/config.types'

export async function obtenerConfiguracionIA(): Promise<ConfiguracionIA> {
  const res = await fetch(`${BACKEND_URL}/api/config/motor`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function actualizarConfiguracionIA(config: ConfiguracionIA): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/config/motor`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify(config),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al actualizar configuración.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
}