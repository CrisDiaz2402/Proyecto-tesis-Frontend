// src/services/backendService.ts

import { BACKEND_URL } from '@/config/config'
import { getAuthHeaders, limpiarSesion } from '@/services/authService'


export async function apiFetch(
  url: string,
  opts?: RequestInit,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(opts?.headers as Record<string, string> ?? {}),
  }

  const res = await fetch(`${BACKEND_URL}${url}`, {
    ...opts,
    headers,
  })

  if (res.status === 401) {
    limpiarSesion()
    window.location.href = '/login'
    throw new Error('Sesión expirada. Redirigiendo al login.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }

  return res
}

export interface ChatResponse {
  pregunta_original: string
  respuesta: string
}

export type MotorTipo  = 'local' | 'cloud'
export type MotorScope = 'local'

export interface ConfiguracionIA {
  motor_vectores: MotorTipo
  motor_llm: MotorTipo
}

export const MODOS_IA = [
  {
    id: 'local:local',
    motor_vectores: 'local'  as MotorTipo,
    motor_llm:      'local'  as MotorTipo,
    label:          'Todo Local',
    descripcion:    'Vectores sentence-transformers + LLM vLLM (Qwen2.5), sin internet.',
    icono:          'mdi:server-network',
    color:          'blue',
  },
  {
    id: 'local:cloud',
    motor_vectores: 'local'  as MotorTipo,
    motor_llm:      'cloud'  as MotorTipo,
    label:          'Vectores Local + LLM Nube',
    descripcion:    'Busca en vectores sentence-transformers locales, pero responde con Gemini Flash.',
    icono:          'mdi:server-network',
    color:          'violet',
  },
]

export interface RagParams {
  umbral_relevancia_local: number
  rag_k_local: number
}

export interface ParamLimit {
  min: number
  max: number
  type: 'int' | 'float'
  default: number
  label: string
  descripcion: string
}

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

export interface RagParamsUpdateResponse {
  ok: boolean
  mensaje: string
  params_cambiados: string[]
  params_sin_cambio: string[]
  acciones_limpieza: string[]
  advertencias: string[]
  parametros_actuales: RagParams
}

export interface RagParamsResetResponse {
  ok: boolean
  mensaje: string
  params_reseteados: string[]
  acciones_limpieza: string[]
  advertencias: string[]
  parametros_actuales: RagParams
  defaults: RagParams
}

export interface PromptsUpdatePayload {
  prompt_principal?: string  
}

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

export interface Documento {
  id: number
  nombre_archivo: string
  subido_por: string
  fecha_subida: string
  procesado_local: boolean
  estado_local: string

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

export type Veredicto = 'PASS' | 'PARCIAL' | 'FAIL' | 'ERROR'

export interface CasoEvaluacion {
  id: string
  grupo: string
  pregunta: string
  respuesta_esperada: string
  umbral_similitud: number   // default 0.80
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
  tipo: string
  pregunta: string
  respuesta: string
  latencia_ms: number
  score: number       
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
  similitud_promedio?: number
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
  similitud_promedio: number
  latencia_promedio_ms: number
  conteo_global: ConteoGlobal
}

export interface EventoProgreso {
  tipo: 'progreso'
  caso_actual: number
  total_casos: number
  porcentaje: number     
  resultado: ResultadoCaso
}

export interface EventoCompletado {
  tipo: 'completado'
  caso_actual: number
  total_casos: number
  porcentaje: number
  reporte_final: ResultadoEvaluacion
}

export interface EventoError {
  tipo: 'error'
  caso_actual: number
  total_casos: number
  mensaje: string
  mensaje_error: string
  detalle?: string
}

export type EventoSSE = EventoProgreso | EventoCompletado | EventoError

export type EventoEvaluacion = EventoSSE

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

export interface Usuario {
  id: string
  username: string
  rol: string
  fecha_creacion: string
}


export async function consultarRAG(pregunta: string): Promise<ChatResponse> {
  const res = await apiFetch('/api/chat/consultar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pregunta }),
  })
  return res.json()
}

export async function obtenerConfiguracionIA(): Promise<ConfiguracionIA> {
  const res = await apiFetch('/api/config/motor')
  return res.json()
}

export async function actualizarConfiguracionIA(config: ConfiguracionIA): Promise<void> {
  await apiFetch('/api/config/motor', {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(config),
  })
}

export async function obtenerDocumentos(): Promise<Documento[]> {
  const res = await apiFetch('/api/documents')
  return res.json()
}

export async function subirDocumento(file: File, motor: MotorTipo): Promise<DocumentoUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('motor', motor)
  const res = await apiFetch('/api/documents/upload', {
    method:  'POST',
    body:    formData,
  })
  return res.json()
}

export async function eliminarDocumento(id: number, motor: MotorTipo): Promise<AccionGlobalResponse> {
  const res = await apiFetch(`/api/documents/${id}?motor=${motor}`, {
    method:  'DELETE',
  })
  return res.json()
}

export async function descargarDocumento(
  id: number,
  nombreArchivo: string,
  motor: MotorTipo,
): Promise<void> {
  const res = await apiFetch(`/api/documents/${id}/download?motor=${motor}`)
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
export async function limpiarSoloCache(motor: MotorScope): Promise<AccionGlobalResponse> {
  const res = await apiFetch(`/api/documents/cache/all?motor=${motor}`, {
    method:  'DELETE',
  })
  return res.json()
}

export async function limpiarVectoresYCache(motor: MotorScope): Promise<AccionGlobalResponse> {
  const res = await apiFetch(`/api/documents/vectors/all?motor=${motor}`, {
    method:  'DELETE',
  })
  return res.json()
}

export async function procesarTodosLosDocumentos(motor: MotorTipo): Promise<AccionGlobalResponse> {
  const res = await apiFetch(`/api/documents/process/all?motor=${motor}`, {
    method:  'POST',
  })
  return res.json()
}

export async function eliminarTodosLosDocumentos(): Promise<AccionGlobalResponse> {
  const res = await apiFetch('/api/documents/all/confirm', {
    method:  'DELETE',
  })
  return res.json()
}

export function parsearGoldenDataset(contenido: string): CasoEvaluacion[] {
  const data = JSON.parse(contenido)
  if (!Array.isArray(data.casos)) {
    throw new Error('El JSON debe tener un campo "casos" que sea un array.')
  }
  return data.casos.map((c: any, i: number) => {
    if (!c.id || !c.pregunta || !c.respuesta_esperada) {
      throw new Error(`Caso en posición ${i} le falta "id", "pregunta" o "respuesta_esperada".`)
    }
    return {
      id:                 String(c.id),
      grupo:              c.grupo ?? 'General',
      pregunta:           String(c.pregunta),
      respuesta_esperada: String(c.respuesta_esperada),
      umbral_similitud:   typeof c.umbral_similitud === 'number' ? c.umbral_similitud : 0.80,
      descripcion:        c.descripcion ?? undefined,
      habilitado:         c.habilitado !== false,
    } satisfies CasoEvaluacion
  })
}

export async function ejecutarEvaluacion(
  request: EjecucionRequest,
): Promise<ResultadoEvaluacion> {
  const res = await apiFetch('/api/evaluacion/ejecutar', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(request),
  })
  return res.json()
}

export async function ejecutarEvaluacionStream(
  request: EjecucionRequest,
  onEvento: (evento: EventoSSE) => void,
): Promise<ResultadoEvaluacion> {
  const res = await apiFetch('/api/evaluacion/ejecutar-stream', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(request),
  })

  if (!res.body) throw new Error('El servidor no devolvió un stream.')

  console.log('[SSE] Conexión abierta, leyendo stream...')

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer    = ''
  let reporteFinal: ResultadoEvaluacion | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      console.log('[SSE] Stream cerrado. reporteFinal:', reporteFinal)
      break
    }

    buffer += decoder.decode(value, { stream: true })

    const partes = buffer.split('\n\n')
    buffer = partes.pop() ?? ''

    for (const parte of partes) {
      const linea = parte.trim()
      if (!linea.startsWith('data:')) continue

      const jsonStr = linea.slice('data:'.length).trim()
      if (!jsonStr) continue

      try {
        const evento: EventoSSE = JSON.parse(jsonStr)

        if (evento.tipo === 'error') {
          const detalle = evento.detalle ? ` — ${evento.detalle}` : ''
          throw new Error((evento.mensaje_error ?? 'Error en el servidor durante la evaluación.') + detalle)
        }

        if (evento.tipo === 'progreso') {
          console.log(`[SSE] Progreso: ${evento.caso_actual}/${evento.total_casos} (${evento.porcentaje}%) — id: ${evento.resultado?.id}`)
        }

        onEvento(evento)

        if (evento.tipo === 'completado') {
          console.log('[SSE] Evento completado recibido, extrayendo reporte_final...')
          console.log('[SSE] reporte_final:', evento.reporte_final)
          reporteFinal = evento.reporte_final
        }
      } catch (err) {
        console.error('[SSE] Error parseando evento:', err, '| Raw JSON:', jsonStr)
      }
    }
  }

  if (!reporteFinal) {
    throw new Error('Evaluación terminó sin resultado final.')
  }

  return reporteFinal
}

export async function obtenerEstadoMonitor(): Promise<EstadoMonitor> {
  const res = await apiFetch('/api/monitor/estado')
  return res.json()
}

export async function obtenerRagParams(): Promise<RagParamsResponse> {
  const res = await apiFetch('/api/rag-params')
  return res.json()
}

export async function actualizarRagParams(params: Partial<RagParams>): Promise<RagParamsUpdateResponse> {
  const res = await apiFetch('/api/rag-params', {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(params),
  })
  return res.json()
}

export async function resetearRagParams(): Promise<RagParamsResetResponse> {
  const res = await apiFetch('/api/rag-params/reset', {
    method:  'POST',
  })
  return res.json()
}

export async function actualizarPrompts(
  payload: PromptsUpdatePayload,
): Promise<PromptsUpdateResponse> {
  const res = await apiFetch('/api/rag-params', {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  return res.json()
}

export async function obtenerUsuarios(): Promise<Usuario[]> {
  const res = await apiFetch('/api/usuarios')
  return res.json()
}

export async function crearUsuario(
  payload: { username: string; password?: string; rol?: string },
): Promise<void> {
  await apiFetch('/api/usuarios', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
}

export async function eliminarUsuario(id: string): Promise<void> {
  await apiFetch(`/api/usuarios/${id}`, {
    method:  'DELETE',
  })
}

export async function actualizarUsuario(
  id: string,
  payload: { username?: string; password?: string; rol?: string },
): Promise<void> {
  await apiFetch(`/api/usuarios/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/`)
    return res.ok
  } catch {
    return false
  }
}

export interface NluConfig {
  palabras_saludo: string[]
  frases_despedida: string[]
  frases_agradecimiento: string[]
  palabras_lista_larga: string[]
  frases_rechazo: string[]
  mensaje_saludo: string
  mensaje_despedida: string
  mensaje_agradecimiento: string
  mensaje_fuera_de_tema: string
  mensaje_sin_resultados: string
  fecha_actualizacion: string
}

export interface NluConfigUpdatePayload {
  palabras_saludo?: string[]
  frases_despedida?: string[]
  frases_agradecimiento?: string[]
  palabras_lista_larga?: string[]
  frases_rechazo?: string[]
  mensaje_saludo?: string
  mensaje_despedida?: string
  mensaje_agradecimiento?: string
  mensaje_fuera_de_tema?: string
  mensaje_sin_resultados?: string
}

export async function obtenerNluConfig(): Promise<NluConfig> {
  const res = await apiFetch('/api/nlu-config')
  return res.json()
}

export async function actualizarNluConfig(payload: NluConfigUpdatePayload): Promise<NluConfig> {
  const res = await apiFetch('/api/nlu-config', {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  return res.json()
}

export async function resetearNluConfig(): Promise<NluConfig> {
  const res = await apiFetch('/api/nlu-config/reset', {
    method:  'POST',
  })
  return res.json()
}

export async function obtenerNluDefaults(): Promise<NluConfig> {
  const res = await apiFetch('/api/nlu-config/defaults')
  return res.json()
}