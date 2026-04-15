// src/services/types/documento.types.ts

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

export interface DocumentoUploadResponse {
  ok: boolean
  mensaje: string
  nombre?: string
}

export interface AccionGlobalResponse {
  ok: boolean
  mensaje: string
}