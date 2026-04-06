// src/services/backendService.ts
import { BACKEND_URL } from '@/config/config'
import { getAuthHeaders } from '@/services/authService'

export interface Documento {
  id: number
  nombre_archivo: string
  subido_por: string
  fecha_subida: string

  // ── CAMPOS DUALES ──
  procesado_local: boolean
  procesado_cloud: boolean
  estado_local: string
  estado_cloud: string

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

export interface Usuario {
  id: string
  username: string
  rol: string
  fecha_creacion: string
}

// ── Tipos de motores ──────────────────────────────────────────────────────────
// MotorTipo: para subir/eliminar documentos (solo local o cloud)
// MotorScope: para acciones globales de caché/vectores (puede afectar a ambos)
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

// ─── PÚBLICOS (no requieren token) ────────────────────────────────────────────

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/`)
    return res.ok
  } catch {
    return false
  }
}

// El Avatar consulta de forma transparente. El backend decide el motor.
export async function consultarRAG(pregunta: string): Promise<ChatResponse> {
  const res = await fetch(`${BACKEND_URL}/api/chat/consultar`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ pregunta }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al consultar IA' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── CONFIGURACIÓN IA (requieren token) ───────────────────────────────────────

export async function obtenerConfiguracionIA(): Promise<ConfiguracionIA> {
  const res = await fetch(`${BACKEND_URL}/api/config/motor`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function actualizarConfiguracionIA(
  motor_vectores: MotorTipo,
  motor_llm: MotorTipo,
): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/config/motor`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify({ motor_vectores, motor_llm }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al cambiar la configuración.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── DOCUMENTOS (requieren token) ─────────────────────────────────────────────

export async function obtenerDocumentos(): Promise<Documento[]> {
  const res = await fetch(`${BACKEND_URL}/api/documents`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function subirDocumento(
  file: File,
  motor: MotorTipo = 'local',
): Promise<DocumentoUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('motor', motor)

  const res = await fetch(`${BACKEND_URL}/api/documents/upload`, {
    method:  'POST',
    headers: { ...getAuthHeaders() },
    body:    formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function eliminarDocumento(
  id: number,
  motor: MotorTipo = 'local',
): Promise<{ ok: boolean; mensaje: string }> {
  const res = await fetch(`${BACKEND_URL}/api/documents/${id}?motor=${motor}`, {
    method:  'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function descargarDocumento(
  id: number,
  nombreArchivo: string,
  motor: MotorTipo = 'local',
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/documents/${id}/download?motor=${motor}`, {
    method:  'GET',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al descargar el archivo' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }

  const blob = await res.blob()
  const url  = window.URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCIONES GLOBALES DE CACHÉ
//
// motor: MotorScope
//   "local" → limpia cache_ll (local:local) + cache_lc (local:cloud)
//   "cloud" → limpia cache_cc (cloud:cloud)
//   "all"   → limpia los 3 cachés
// ─────────────────────────────────────────────────────────────────────────────
export async function limpiarSoloCache(
  motor: MotorScope = 'local',
): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/cache/all?motor=${motor}`, {
    method:  'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al limpiar caché' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCIONES GLOBALES DE VECTORES + CACHÉ
//
// motor: MotorScope
//   "local" → vectores local + cache_ll + cache_lc; BD actualizada
//   "cloud" → vectores cloud + cache_cc; BD actualizada
//   "all"   → todo lo anterior en ambos motores; BD actualizada
// ─────────────────────────────────────────────────────────────────────────────
export async function limpiarVectoresYCache(
  motor: MotorScope = 'local',
): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/vectors/all?motor=${motor}`, {
    method:  'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al limpiar vectores' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function procesarTodosLosDocumentos(
  motor: MotorTipo = 'local',
): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/process/all?motor=${motor}`, {
    method:  'POST',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al sincronizar documentos' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function eliminarTodosLosDocumentos(): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/all/confirm`, {
    method:  'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al formatear el sistema' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── USUARIOS (requieren token) ───────────────────────────────────────────────

export async function obtenerUsuarios(): Promise<Usuario[]> {
  const res = await fetch(`${BACKEND_URL}/api/usuarios`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function crearUsuario(datosFormulario: any): Promise<Usuario> {
  const res = await fetch(`${BACKEND_URL}/api/usuarios`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify(datosFormulario),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al crear usuario en el servidor.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function actualizarUsuario(id: string, datosFormulario: any): Promise<Usuario> {
  const res = await fetch(`${BACKEND_URL}/api/usuarios/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify(datosFormulario),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al actualizar el usuario.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function eliminarUsuario(id: string): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/usuarios/${id}`, {
    method:  'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al eliminar el usuario.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}