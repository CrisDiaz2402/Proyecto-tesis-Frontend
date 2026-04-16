// src/composables/useWebSocket.ts
import { ref, onUnmounted } from 'vue'

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface WsMensajeChat {
  tipo: 'token' | 'respuesta' | 'status' | 'error' | 'complete' | 'pong'
  token?: string
  respuesta?: string
  pregunta?: string
  mensaje?: string
  motor?: string
  cached?: boolean
  timestamp?: number
  details?: string
}

export interface WsMensajeMonitor {
  tipo: 'estado_completo' | 'error'
  data?: EstadoMonitorWS
}

export interface ConexionActiva {
  client_id: string
  username: string
  conectado_en: number   // unix timestamp (segundos)
  ip?: string
}

export interface ConsultaActiva {
  id: string
  client_id: string
  pregunta: string
  motor: string
  inicio: number
}

export interface ConsultaHistorial {
  id: string
  client_id: string
  pregunta: string
  motor: string
  latencia_ms: number
  cache: boolean
  fin: number
}

export interface EstadoMonitorWS {
  conexiones: ConexionActiva[]
  total_conexiones: number
  activas: ConsultaActiva[]
  total_activas: number
  historial: ConsultaHistorial[]
  latencia_avg_ms: number
  cache_hits: number
  total_consultas: number
  timestamp: number
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSABLE: CHAT (AvatarView)
// ─────────────────────────────────────────────────────────────────────────────

export function useChatWebSocket(baseUrl: string) {
  const ws        = ref<WebSocket | null>(null)
  const estado    = ref<'desconectado' | 'conectando' | 'listo' | 'generando' | 'error'>('desconectado')
  const tokenStream        = ref('')   // tokens acumulados durante streaming
  const respuestaCompleta  = ref('')   // respuesta final cuando llega "respuesta"
  const error              = ref('')
  let pingInterval: ReturnType<typeof setInterval> | null = null

  // ── Validaciones previas ────────────────────────────────────────────────────
  function _validarUrl(url: string): boolean {
    if (!url || !url.startsWith('ws')) {
      console.error('[WS Chat] URL inválida:', url, '— debe comenzar con ws:// o wss://')
      return false
    }
    return true
  }

  // ── Conexión ────────────────────────────────────────────────────────────────
  // authToken es opcional: si viene vacío/null se conecta como visitante anónimo.
  // El backend /ws/chat acepta conexiones sin token (avatar público).
  function conectar(authToken?: string): void {
    // Evitar doble conexión
    if (ws.value?.readyState === WebSocket.OPEN || ws.value?.readyState === WebSocket.CONNECTING) {
      return
    }

    if (!_validarUrl(baseUrl)) {
      estado.value = 'error'
      error.value  = 'URL del servidor WebSocket inválida.'
      return
    }

    estado.value = 'conectando'
    error.value  = ''

    // Si hay token se lo pasamos; si no, conectamos sin query param (anónimo)
    const url = authToken && authToken.trim()
      ? `${baseUrl}/ws/chat?token=${authToken}`
      : `${baseUrl}/ws/chat`

    try {
      ws.value = new WebSocket(url)
    } catch (e: any) {
      console.error('[WS Chat] Error al crear WebSocket:', e)
      estado.value = 'error'
      error.value  = 'No se pudo crear la conexión WebSocket.'
      return
    }

    ws.value.onopen = () => {
      console.info('[WS Chat] Conexión establecida.')
      estado.value = 'listo'
      error.value  = ''
      _iniciarPing()
    }

    ws.value.onmessage = (event) => {
      try {
        const msg: WsMensajeChat = JSON.parse(event.data)
        _procesarMensaje(msg)
      } catch (err) {
        console.error('[WS Chat] Error al parsear mensaje recibido:', err, '| Raw:', event.data)
        error.value  = 'Error de formato en mensaje del servidor.'
        estado.value = 'error'
      }
    }

    ws.value.onerror = (event) => {
      // El evento ErrorEvent de WebSocket no expone detalles útiles en el cliente
      // por seguridad del navegador; el código de cierre en onclose es más informativo.
      console.error('[WS Chat] Error de WebSocket:', event)
      estado.value = 'error'
      error.value  = 'Error en la conexión WebSocket.'
    }

    ws.value.onclose = (event) => {
      _limpiarPing()
      estado.value = 'desconectado'
      ws.value     = null

      // Codigos útiles para diagnóstico:
      // 1000 = cierre normal | 1001 = servidor apagado | 1006 = cierre abrupto (sin handshake)
      // 4401 = token inválido (código personalizado FastAPI)
      if (event.code === 4401) {
        error.value  = 'Token inválido o corrupto. Por favor inicia sesión nuevamente.'
        estado.value = 'error'
        console.error(`[WS Chat] Cierre por autenticación fallida (code=${event.code}, reason="${event.reason}")`)
      } else if (event.code === 1006) {
        error.value  = 'Conexión cerrada inesperadamente. Verifica que el servidor esté en línea.'
        estado.value = 'error'
        console.warn(`[WS Chat] Cierre abrupto (code=1006) — el servidor puede estar caído o rechazó la conexión.`)
      } else if (event.code !== 1000) {
        error.value  = `Conexión cerrada (código ${event.code}).`
        estado.value = 'error'
        console.warn(`[WS Chat] Cierre con código ${event.code}: "${event.reason}"`)
      } else {
        console.info('[WS Chat] Conexión cerrada normalmente.')
      }
    }
  }

  // ── Procesamiento de mensajes entrantes ────────────────────────────────────
  function _procesarMensaje(msg: WsMensajeChat): void {
    switch (msg.tipo) {
      case 'token':
        tokenStream.value += msg.token ?? ''
        estado.value = 'generando'
        break

      case 'respuesta':
        // Respuesta completa (cloud o fin de streaming vLLM)
        respuestaCompleta.value = msg.respuesta ?? tokenStream.value
        tokenStream.value       = ''
        estado.value            = 'listo'
        break

      case 'complete':
        // El backend indica fin del ciclo de generación
        estado.value = 'listo'
        break

      case 'error':
        error.value  = msg.mensaje ?? 'Error desconocido del servidor.'
        estado.value = 'error'
        console.error('[WS Chat] Error del servidor:', msg.mensaje, '| Details:', msg.details)
        break

      case 'status':
        // Mensajes informativos (procesando, recuperando…) — solo log, no modificar UI
        console.debug('[WS Chat] Estado:', msg.mensaje)
        break

      case 'pong':
        // Respuesta al ping de keepalive — ignorar silenciosamente
        break

      default:
        console.warn('[WS Chat] Tipo de mensaje desconocido:', (msg as any).tipo)
    }
  }

  // ── Envío de preguntas ─────────────────────────────────────────────────────
  function enviarPregunta(pregunta: string): void {
    if (!pregunta.trim()) {
      console.warn('[WS Chat] Se intentó enviar una pregunta vacía.')
      return
    }
    if (ws.value?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket no está conectado. Por favor espera a que se establezca la conexión.')
    }

    tokenStream.value       = ''
    respuestaCompleta.value = ''
    error.value             = ''
    estado.value            = 'generando'

    try {
      ws.value.send(JSON.stringify({ tipo: 'pregunta', pregunta }))
    } catch (e: any) {
      console.error('[WS Chat] Error al enviar pregunta:', e)
      estado.value = 'error'
      error.value  = 'Error al enviar la pregunta al servidor.'
    }
  }

  // ── Desconexión ─────────────────────────────────────────────────────────────
  function desconectar(): void {
    _limpiarPing()
    if (ws.value) {
      ws.value.close(1000, 'Cierre normal del cliente')
      ws.value = null
    }
    estado.value = 'desconectado'
  }

  // ── Ping de keepalive ───────────────────────────────────────────────────────
  function _iniciarPing(): void {
    _limpiarPing()
    pingInterval = setInterval(() => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        ws.value.send(JSON.stringify({ tipo: 'ping' }))
      } else {
        _limpiarPing()
      }
    }, 30_000)
  }

  function _limpiarPing(): void {
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
  }

  // Limpieza automática al desmontar el componente
  onUnmounted(() => desconectar())

  return {
    estado,
    tokenStream,
    respuestaCompleta,
    error,
    conectar,
    enviarPregunta,
    desconectar,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSABLE: MONITOR (MonitorConcurrencia — panel admin)
// ─────────────────────────────────────────────────────────────────────────────

const ESTADO_VACIO: EstadoMonitorWS = {
  conexiones:        [],
  total_conexiones:  0,
  activas:           [],
  total_activas:     0,
  historial:         [],
  latencia_avg_ms:   0,
  cache_hits:        0,
  total_consultas:   0,
  timestamp:         0,
}

// Máximo número de reintentos antes de rendirse
const MAX_REINTENTOS = 5

export function useMonitorWebSocket(baseUrl: string, authToken: string) {
  const ws             = ref<WebSocket | null>(null)
  const estado         = ref<EstadoMonitorWS>({ ...ESTADO_VACIO })
  const conectado      = ref(false)
  const errorConexion  = ref(false)
  const errorMsg       = ref('')
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let intentos = 0

  // ── Validaciones ───────────────────────────────────────────────────────────
  function _esConfiguracionValida(): boolean {
    if (!baseUrl || !baseUrl.startsWith('ws')) {
      console.error('[WS Monitor] URL inválida:', baseUrl)
      errorMsg.value      = 'URL del servidor WebSocket inválida.'
      errorConexion.value = true
      return false
    }
    if (!authToken || authToken.trim() === '') {
      console.error('[WS Monitor] Token de autenticación vacío. El servidor rechazará con 403.')
      errorMsg.value      = 'No hay sesión activa. Inicia sesión para ver el monitor.'
      errorConexion.value = true
      return false
    }
    return true
  }

  // ── Conexión ───────────────────────────────────────────────────────────────
  function conectar(): void {
    if (ws.value?.readyState === WebSocket.OPEN || ws.value?.readyState === WebSocket.CONNECTING) {
      return
    }
    if (!_esConfiguracionValida()) return

    if (intentos >= MAX_REINTENTOS) {
      console.error(`[WS Monitor] Se alcanzó el límite de ${MAX_REINTENTOS} reintentos. Abortando.`)
      errorMsg.value      = 'No se pudo conectar al monitor tras varios intentos.'
      errorConexion.value = true
      return
    }

    try {
      ws.value = new WebSocket(`${baseUrl}/ws/monitor?token=${authToken}`)
    } catch (e: any) {
      console.error('[WS Monitor] Error al crear WebSocket:', e)
      errorMsg.value      = 'No se pudo crear la conexión con el monitor.'
      errorConexion.value = true
      return
    }

    ws.value.onopen = () => {
      console.info('[WS Monitor] Conexión establecida.')
      conectado.value     = true
      errorConexion.value = false
      errorMsg.value      = ''
      intentos            = 0   // resetear contador de reintentos al conectar con éxito
    }

    ws.value.onmessage = (event) => {
      try {
        const msg: WsMensajeMonitor = JSON.parse(event.data)
        if (msg.tipo === 'estado_completo' && msg.data) {
          estado.value = msg.data
        } else if (msg.tipo === 'error') {
          console.error('[WS Monitor] Error del servidor:', msg)
        }
      } catch (err) {
        console.error('[WS Monitor] Error al parsear mensaje:', err, '| Raw:', event.data)
      }
    }

    ws.value.onclose = (event) => {
      conectado.value = false
      ws.value        = null

      if (event.code === 4001 || event.code === 4003) {
        // Token inválido o expirado — no tiene sentido reintentar
        errorConexion.value = true
        errorMsg.value      = 'Sesión expirada. Recarga la página e inicia sesión.'
        console.error(`[WS Monitor] Autenticación rechazada (code=${event.code})`)
        return
      }

      if (event.code !== 1000) {
        // Cierre inesperado — programar reconexión con backoff exponencial
        errorConexion.value = true
        intentos++
        const delay = Math.min(1000 * 2 ** intentos, 30_000) // max 30s
        console.warn(`[WS Monitor] Cierre inesperado (code=${event.code}). Reintento ${intentos}/${MAX_REINTENTOS} en ${delay / 1000}s.`)
        reconnectTimeout = setTimeout(() => conectar(), delay)
      } else {
        console.info('[WS Monitor] Conexión cerrada normalmente.')
      }
    }

    ws.value.onerror = (event) => {
      console.error('[WS Monitor] Error de WebSocket:', event)
      conectado.value     = false
      errorConexion.value = true
      // onclose se disparará justo después — allí se maneja el reintento
    }
  }

  // ── Desconexión manual ─────────────────────────────────────────────────────
  function desconectar(): void {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    intentos = MAX_REINTENTOS // evitar reconexiones automáticas después del desmontaje
    if (ws.value) {
      ws.value.close(1000, 'Cierre normal del cliente')
      ws.value = null
    }
    conectado.value = false
  }

  onUnmounted(() => desconectar())

  return {
    estado,
    conectado,
    errorConexion,
    errorMsg,
    conectar,
    desconectar,
  }
}