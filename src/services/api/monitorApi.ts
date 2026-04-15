// src/services/api/monitorApi.ts
import { BACKEND_URL } from '@/config/config'
import { getAuthHeaders } from '@/services/authService'
import type { EstadoMonitor } from '../types/monitor.types'

export async function obtenerEstadoMonitor(): Promise<EstadoMonitor> {
  const res = await fetch(`${BACKEND_URL}/api/monitor/estado`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}