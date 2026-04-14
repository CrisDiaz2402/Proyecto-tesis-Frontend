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
  // Alto impacto — Chunking
  breakpoint_threshold_amount: number

  // Alto impacto — Retrieval
  umbral_relevancia_local: number
  umbral_relevancia_cloud: number
  rag_k_local: number
  rag_k_cloud: number

  // Medio impacto — Tokens
  num_tokens_normal_local: number
  num_tokens_lista_local: number
  num_tokens_normal_cloud: number
  num_tokens_lista_cloud: number

  // Medio impacto — Caché L2
  cache_threshold_ll: number
  cache_threshold_lc: number
  cache_threshold_cc: number
  umbral_similitud: number

  // Bajo impacto — LLM local
  repeat_penalty: number
  top_k_llm: number
  top_p_llm: number
  hyde_num_predict: number

  // Bajo impacto — Caché L1
  max_l1_entries: number
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
    prompt_hyde: string | null
  }
  defaults: RagParams
  limites: Record<keyof RagParams, ParamLimit>
  fecha_actualizacion: string | null
  prompts_default_texto: {
    prompt_principal: string
    prompt_hyde: string
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

// ─── TIPOS PARA PROMPTS EDITABLES ─────────────────────────────────────────────

/** Payload para actualizar uno o ambos prompts */
export interface PromptsUpdatePayload {
  prompt_principal?: string   // texto completo → guarda; "" → resetea al hardcodeado
  prompt_hyde?: string        // texto completo → guarda; "" → resetea al hardcodeado
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
    prompt_hyde: string | null
  }
}

// ─── PÚBLICOS (no requieren token) ────────────────────────────────────────────

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

// ─── PARÁMETROS RAG (requieren token) ─────────────────────────────────────────

/** Obtiene parámetros actuales + defaults + límites de validación + textos de prompts por defecto */
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

/** Actualiza uno o más parámetros RAG. El backend ejecuta la limpieza automática. */
export async function actualizarRagParams(
  params: Partial<RagParams>,
): Promise<RagParamsUpdateResponse> {
  const res = await fetch(`${BACKEND_URL}/api/rag-params`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al guardar parámetros RAG.' }))
    const detail = err.detail
    if (typeof detail === 'object' && detail?.errores) {
      throw new Error(detail.mensaje ?? 'Parámetros fuera de rango.')
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

// ─── PROMPTS EDITABLES (requieren token) ──────────────────────────────────────

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

// ─── DOCUMENTOS (requieren token) ─────────────────────────────────────────────

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

export async function indexarDocumento(
  id: number,
  scope: MotorScope,
): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/${id}/indexar?scope=${scope}`, {
    method:  'POST',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al indexar el documento.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function indexarTodos(scope: MotorScope): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/indexar-todos?scope=${scope}`, {
    method:  'POST',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al indexar todos los documentos.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function formatearSistema(): Promise<AccionGlobalResponse> {
  const res = await fetch(`${BACKEND_URL}/api/documents/formatear`, {
    method:  'POST',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al formatear el sistema' }))
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

/** Elimina TODOS los documentos, vectores, archivos físicos y caché de ambos ecosistemas. */
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

// ─── EVALUADOR RAG (requieren token) ──────────────────────────────────────────

export type TipoCaso = 'contiene' | 'no_contiene' | 'corrige' | 'no_alucina'
export type Veredicto = 'PASS' | 'PARCIAL' | 'FAIL'

export interface CasoEvaluacion {
  id: string
  grupo: string
  tipo: TipoCaso
  pregunta: string
  claves: string[]
  claves_prohibidas: string[]
  descripcion?: string
  habilitado: boolean
}

export interface EjecucionRequest {
  experimento: string
  casos: CasoEvaluacion[]
}

export interface ResultadoCaso {
  id: string
  grupo: string
  tipo: TipoCaso
  pregunta: string
  respuesta: string
  latencia_ms: number
  score: number        // 0.0 | 0.5 | 1.0
  veredicto: Veredicto
  detalle: string
  descripcion?: string
}

export interface ResumenGrupo {
  promedio: number
  pass: number
  parcial: number
  fail: number
  total: number
}

export interface MetricasPhoenix {
  disponible: boolean
  spans_analizados?: number
  latencia_total_ms_avg?: number
  latencia_llm_ms_avg?: number
  latencia_retrieval_avg?: number
  fragmentos_usados_avg?: number
  k_retrieval?: number
  umbral_relevancia?: number
  hyde_aplicado?: boolean
  modelo_llm?: string
  modelo_embed?: string
  nota?: string
}

export interface ConteoGlobal {
  pass: number
  parcial: number
  fail: number
  total: number
}

export interface ResultadoEvaluacion {
  experimento: string
  motor: string
  timestamp: string
  duracion_total_seg: number
  resultados: ResultadoCaso[]
  resumen_por_grupo: Record<string, ResumenGrupo>
  score_global: number
  conteo_global: ConteoGlobal
  metricas_phoenix: MetricasPhoenix
}

// ── Tipos de eventos SSE ───────────────────────────────────────────────────────

export interface EventoProgreso {
  tipo: 'progreso'
  caso_actual: number
  total_casos: number
  porcentaje: number       // 0–100, calculado por el backend
  resultado: ResultadoCaso
}

export interface EventoCompletado {
  tipo: 'completado'
  caso_actual: number
  total_casos: number
  porcentaje: 100
  reporte_final: ResultadoEvaluacion
}

export interface EventoError {
  tipo: 'error'
  mensaje_error: string
}

export type EventoEvaluacion = EventoProgreso | EventoCompletado | EventoError

// ─────────────────────────────────────────────────────────────────────────────
// Verifica si Phoenix está online a través del proxy del backend.
// NO contacta Phoenix directamente — eso genera error CORS en el navegador.
// ─────────────────────────────────────────────────────────────────────────────
export async function verificarPhoenixStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/evaluacion/phoenix-status`, {
      headers: { ...getAuthHeaders() },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return false
    const data = await res.json()
    return data.online === true
  } catch {
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluación clásica síncrona — devuelve el reporte completo al terminar.
// ─────────────────────────────────────────────────────────────────────────────
export async function ejecutarEvaluacion(
  request: EjecucionRequest,
): Promise<ResultadoEvaluacion> {
  const res = await fetch(`${BACKEND_URL}/api/evaluacion/ejecutar`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify(request),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error durante la evaluación.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}
// ─── MONITOR DE CONCURRENCIA (requiere token) ─────────────────────────────────

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

export async function obtenerEstadoMonitor(): Promise<EstadoMonitor> {
  const res = await fetch(`${BACKEND_URL}/api/monitor/estado`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
// ─────────────────────────────────────────────────────────────────────────────
// Evaluación con SSE — llama al callback onEvento por cada evento recibido.
// Retorna el ResultadoEvaluacion final cuando el stream termina.
// ─────────────────────────────────────────────────────────────────────────────
export async function ejecutarEvaluacionStream(
  request: EjecucionRequest,
  onEvento: (evento: EventoEvaluacion) => void,
): Promise<ResultadoEvaluacion> {
  const res = await fetch(`${BACKEND_URL}/api/evaluacion/ejecutar-stream`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify(request),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error durante la evaluación.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }

  if (!res.body) throw new Error('El servidor no devolvió un stream.')

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer    = ''
  let reporteFinal: ResultadoEvaluacion | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Cada evento SSE termina con "\n\n"
    const partes = buffer.split('\n\n')
    // El último elemento puede ser un fragmento incompleto — lo dejamos en buffer
    buffer = partes.pop() ?? ''

    for (const parte of partes) {
      // Extraer el contenido después de "data: "
      const linea = parte.trim()
      if (!linea.startsWith('data:')) continue

      const jsonStr = linea.slice('data:'.length).trim()
      if (!jsonStr) continue

      try {
        const evento = JSON.parse(jsonStr) as EventoEvaluacion
        onEvento(evento)

        if (evento.tipo === 'completado') {
          reporteFinal = evento.reporte_final
        }
        if (evento.tipo === 'error') {
          throw new Error(evento.mensaje_error || 'Error desconocido en el stream.')
        }
      } catch (parseError) {
        // Si el error es nuestro throw, re-lanzar
        if (parseError instanceof Error && parseError.message !== 'Error al parsear SSE') {
          throw parseError
        }
        console.warn('No se pudo parsear evento SSE:', jsonStr)
      }
    }
  }

  if (!reporteFinal) throw new Error('El stream terminó sin devolver el reporte final.')
  return reporteFinal
}