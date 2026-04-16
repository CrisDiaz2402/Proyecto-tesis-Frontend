// src/services/api/documentsApi.ts
import { BACKEND_URL } from '@/config/config'
import { getAuthHeaders } from '@/services/authService'
import type { Documento, DocumentoUploadResponse, AccionGlobalResponse } from '../types/documento.types'
import type { MotorTipo, MotorScope } from '../types/config.types'

export async function obtenerDocumentos(): Promise<Documento[]> {
  const res = await fetch(`${BACKEND_URL}/api/documents`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function subirDocumento(file: File, motor: MotorTipo): Promise<DocumentoUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('motor', motor)
  const res = await fetch(`${BACKEND_URL}/api/documents/upload`, {
    method:  'POST',
    headers: { ...getAuthHeaders() },
    body:    formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al subir el documento.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function eliminarDocumento(id: number, motor: MotorTipo): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/${id}?motor=${motor}`, {
    method:  'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al eliminar el documento.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

/** Descarga el archivo físico original del documento desde el backend. */
export async function descargarDocumento(
  id: number,
  nombreArchivo: string,
  motor: MotorTipo,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/documents/${id}/download?motor=${motor}`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al descargar el documento.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Limpia el caché semántico del motor indicado sin tocar vectores.
 *  motor: 'local' → cache_ll + cache_lc | 'cloud' → cache_cc | 'all' → los 3
 */
export async function limpiarSoloCache(motor: MotorScope): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/cache/all?motor=${motor}`, {
    method:  'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al limpiar caché.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

/** Elimina vectores de ChromaDB + caché del motor indicado y actualiza estado en BD. */
export async function limpiarVectoresYCache(motor: MotorScope): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/vectors/all?motor=${motor}`, {
    method:  'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al limpiar vectores y caché.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

/** Re-vectoriza todos los documentos físicos del motor indicado. */
export async function procesarTodosLosDocumentos(motor: MotorTipo): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/process/all?motor=${motor}`, {
    method:  'POST',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al procesar documentos.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

/** Elimina TODOS los documentos del sistema (endpoint de confirmación). */
export async function eliminarTodosLosDocumentos(): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/all/confirm`, {
    method:  'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al eliminar todos los documentos.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}