// src/services/backendService.ts
import { BACKEND_URL } from '@/config/config'

export interface Documento {
  id: number
  nombre_archivo: string
  subido_por: string
  fecha_subida: string
  estado: string
  cargando?: boolean
}

export interface ChatResponse {
  pregunta_original: string
  respuesta: string
}

export interface DocumentoUploadResponse {
  ok: boolean
  mensaje: string
  nombre?: string
}

export interface AccionGlobalResponse {
  ok: boolean
  mensaje: string
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/`)
    return res.ok
  } catch {
    return false
  }
}

export async function consultarRAG(pregunta: string): Promise<ChatResponse> {
  const res = await fetch(`${BACKEND_URL}/api/chat/consultar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pregunta }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al consultar IA' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function obtenerDocumentos(): Promise<Documento[]> {
  const res = await fetch(`${BACKEND_URL}/api/documents`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function subirDocumento(file: File): Promise<DocumentoUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BACKEND_URL}/api/documents/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function eliminarDocumento(id: number): Promise<{ ok: boolean; mensaje: string }> {
  const res = await fetch(`${BACKEND_URL}/api/documents/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function descargarDocumento(id: number, nombreArchivo: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/documents/${id}/download`, {
    method: 'GET',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al descargar el archivo' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export async function limpiarSoloCache(): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/cache/all`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al limpiar caché' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function limpiarVectoresYCache(): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/vectors/all`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al limpiar vectores' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function procesarTodosLosDocumentos(): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/process/all`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al sincronizar documentos' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function eliminarTodosLosDocumentos(): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/all/confirm`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al formatear el sistema' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}