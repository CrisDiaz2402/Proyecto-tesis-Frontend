import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'

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
  conectado_en: number  
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

export interface ReconnectStrategy {
  shouldReconnect(event: CloseEvent): boolean
  getDelay(attempt: number): number
}

export class ExponentialBackoffStrategy implements ReconnectStrategy {
  private maxDelayMs: number
  private codigosNoReintentables: number[]

  constructor(
    maxReintentos = 5,
    maxDelayMs = 30_000,
    codigosNoReintentables = [1000, 4401, 4001, 4003],
  ) {
    void maxReintentos
    this.maxDelayMs = maxDelayMs
    this.codigosNoReintentables = codigosNoReintentables
  }

  shouldReconnect(event: CloseEvent): boolean {
    if (this.codigosNoReintentables.includes(event.code)) return false
    return true
  }

  getDelay(attempt: number): number {
    return Math.min(1000 * 2 ** attempt, this.maxDelayMs)
  }
}

export type WsEstadoNombre = 'desconectado' | 'conectando' | 'listo' | 'generando' | 'error'

export interface WsStateContext {
  estadoRef: Ref<WsEstadoNombre>
  errorRef: Ref<string>
  transicionarA(nombre: WsEstadoNombre): void
}

export interface WsState {
  nombre: WsEstadoNombre
  onMensaje(msg: WsMensajeChat, ctx: WsStateContext): void
  onClose(event: CloseEvent, ctx: WsStateContext): void
  onError(event: Event, ctx: WsStateContext): void
}

class ConectandoState implements WsState {
  nombre: WsEstadoNombre = 'conectando'
  onMensaje(_msg: WsMensajeChat, ctx: WsStateContext): void {
    ctx.transicionarA('listo')
  }
  onClose(_event: CloseEvent, ctx: WsStateContext): void {
    ctx.transicionarA('desconectado')
  }
  onError(_event: Event, ctx: WsStateContext): void {
    ctx.errorRef.value = 'Error en la conexión WebSocket.'
    ctx.transicionarA('error')
  }
}

class ListoState implements WsState {
  nombre: WsEstadoNombre = 'listo'
  onMensaje(msg: WsMensajeChat, ctx: WsStateContext): void {
    if (msg.tipo === 'token') ctx.transicionarA('generando')
    if (msg.tipo === 'error') ctx.transicionarA('error')
  }
  onClose(_event: CloseEvent, ctx: WsStateContext): void {
    ctx.transicionarA('desconectado')
  }
  onError(_event: Event, ctx: WsStateContext): void {
    ctx.errorRef.value = 'Error en la conexión WebSocket.'
    ctx.transicionarA('error')
  }
}

class GenerandoState implements WsState {
  nombre: WsEstadoNombre = 'generando'
  onMensaje(msg: WsMensajeChat, ctx: WsStateContext): void {
    if (msg.tipo === 'respuesta' || msg.tipo === 'complete') ctx.transicionarA('listo')
    if (msg.tipo === 'error') ctx.transicionarA('error')
  }
  onClose(_event: CloseEvent, ctx: WsStateContext): void {
    ctx.transicionarA('desconectado')
  }
  onError(_event: Event, ctx: WsStateContext): void {
    ctx.errorRef.value = 'Error en la conexión WebSocket.'
    ctx.transicionarA('error')
  }
}

class ErrorState implements WsState {
  nombre: WsEstadoNombre = 'error'
  onMensaje(msg: WsMensajeChat, ctx: WsStateContext): void {
    if (msg.tipo === 'token') ctx.transicionarA('generando')
    if (msg.tipo === 'respuesta' || msg.tipo === 'complete') ctx.transicionarA('listo')
  }
  onClose(_event: CloseEvent, ctx: WsStateContext): void {
    ctx.transicionarA('desconectado')
  }
  onError(_event: Event, _ctx: WsStateContext): void {
  }
}

class DesconectadoState implements WsState {
  nombre: WsEstadoNombre = 'desconectado'
  onMensaje(_msg: WsMensajeChat, _ctx: WsStateContext): void {}
  onClose(_event: CloseEvent, _ctx: WsStateContext): void {}
  onError(_event: Event, _ctx: WsStateContext): void {}
}

const WS_STATES: Record<WsEstadoNombre, WsState> = {
  desconectado: new DesconectadoState(),
  conectando:   new ConectandoState(),
  listo:        new ListoState(),
  generando:    new GenerandoState(),
  error:        new ErrorState(),
}

interface WsMensajeHandler {
  handle(msg: WsMensajeChat): void
  setNext(handler: WsMensajeHandler): WsMensajeHandler
}

abstract class BaseWsHandler implements WsMensajeHandler {
  private nextHandler: WsMensajeHandler | null = null

  setNext(handler: WsMensajeHandler): WsMensajeHandler {
    this.nextHandler = handler
    return handler
  }

  handle(msg: WsMensajeChat): void {
    if (this.nextHandler) {
      this.nextHandler.handle(msg)
    }
  }
}

class TokenHandler extends BaseWsHandler {
  private tokenStream: Ref<string>
  private onGenerando: () => void

  constructor(tokenStream: Ref<string>, onGenerando: () => void) {
    super()
    this.tokenStream = tokenStream
    this.onGenerando = onGenerando
  }

  handle(msg: WsMensajeChat): void {
    if (msg.tipo === 'token') {
      this.tokenStream.value += msg.token ?? ''
      this.onGenerando()
      return
    }
    super.handle(msg)
  }
}

class RespuestaCompletaHandler extends BaseWsHandler {
  private tokenStream: Ref<string>
  private respuestaCompleta: Ref<string>
  private onListo: () => void

  constructor(tokenStream: Ref<string>, respuestaCompleta: Ref<string>, onListo: () => void) {
    super()
    this.tokenStream = tokenStream
    this.respuestaCompleta = respuestaCompleta
    this.onListo = onListo
  }

  handle(msg: WsMensajeChat): void {
    if (msg.tipo === 'respuesta') {
      this.respuestaCompleta.value = msg.respuesta ?? this.tokenStream.value
      this.onListo()
      Promise.resolve().then(() => {
        this.tokenStream.value = ''
      })
      return
    }
    if (msg.tipo === 'complete') {
      if (this.tokenStream.value) {
        this.respuestaCompleta.value = this.tokenStream.value
      }
      this.onListo()
      Promise.resolve().then(() => {
        this.tokenStream.value = ''
      })
      return
    }
    super.handle(msg)
  }
}

class WsErrorHandler extends BaseWsHandler {
  private error: Ref<string>
  private onError: () => void

  constructor(error: Ref<string>, onError: () => void) {
    super()
    this.error = error
    this.onError = onError
  }

  handle(msg: WsMensajeChat): void {
    if (msg.tipo === 'error') {
      this.error.value = msg.mensaje ?? 'Error desconocido del servidor.'
      this.onError()
      console.error('[WS Chat] server error:', msg.mensaje, msg.details)
      return
    }
    super.handle(msg)
  }
}

class PongHandler extends BaseWsHandler {
  handle(msg: WsMensajeChat): void {
    if (msg.tipo === 'pong') {
      return
    }
    if (msg.tipo === 'status') {
      console.debug('[WS Chat] status:', msg.mensaje)
      return
    }
    super.handle(msg)
    if (!['token', 'respuesta', 'complete', 'error'].includes(msg.tipo)) {
      console.warn('[WS Chat] unknown message type:', msg.tipo)
    }
  }
}

export function useWebSocket(
  baseUrl: string,
  strategy: ReconnectStrategy = new ExponentialBackoffStrategy(),
) {
  const ws             = ref<WebSocket | null>(null)
  const estado         = ref<WsEstadoNombre>('desconectado')
  const tokenStream    = ref('')
  const respuestaCompleta = ref('')
  const error          = ref('')
  let pingInterval: ReturnType<typeof setInterval> | null = null
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let intentos = 0
  let _lastAuthToken: string | undefined

  const stateCtx: WsStateContext = {
    estadoRef: estado,
    errorRef: error,
    transicionarA(nombre: WsEstadoNombre) {
      estado.value = nombre
    },
  }

  function _currentState(): WsState {
    return WS_STATES[estado.value]
  }

  function _crearCadenaHandlers(): WsMensajeHandler {
    const tokenH     = new TokenHandler(tokenStream, () => stateCtx.transicionarA('generando'))
    const respuestaH = new RespuestaCompletaHandler(tokenStream, respuestaCompleta, () => stateCtx.transicionarA('listo'))
    const errorH     = new WsErrorHandler(error, () => stateCtx.transicionarA('error'))
    const pongH      = new PongHandler()

    tokenH.setNext(respuestaH).setNext(errorH).setNext(pongH)
    return tokenH
  }

  let cadenaHandlers = _crearCadenaHandlers()

  function _validarUrl(url: string): boolean {
    if (!url || !url.startsWith('ws')) {
      console.error('[WS] invalid url:', url)
      return false
    }
    return true
  }

  function conectar(authToken?: string): void {
    if (ws.value?.readyState === WebSocket.OPEN || ws.value?.readyState === WebSocket.CONNECTING) {
      return
    }

    if (!_validarUrl(baseUrl)) {
      estado.value = 'error'
      error.value  = 'URL del servidor WebSocket inválida.'
      return
    }

    estado.value    = 'conectando'
    error.value     = ''
    _lastAuthToken  = authToken
    cadenaHandlers  = _crearCadenaHandlers()

    const url = authToken && authToken.trim()
      ? `${baseUrl}/ws/chat?token=${authToken}`
      : `${baseUrl}/ws/chat`

    try {
      ws.value = new WebSocket(url)
    } catch (e: unknown) {
      console.error('[WS] create error:', e)
      estado.value = 'error'
      error.value  = 'No se pudo crear la conexión WebSocket.'
      return
    }

    ws.value.onopen = () => {
      console.info('[WS] connected')
      estado.value = 'listo'
      error.value  = ''
      intentos     = 0
      _iniciarPing()
    }

    ws.value.onmessage = (event) => {
      try {
        const msg: WsMensajeChat = JSON.parse(event.data)
        _currentState().onMensaje(msg, stateCtx)
        cadenaHandlers.handle(msg)
      } catch (err) {
        console.error('[WS] parse error:', err, event.data)
        error.value  = 'Error de formato en mensaje del servidor.'
        estado.value = 'error'
      }
    }

    ws.value.onerror = (event) => {
      console.error('[WS] error:', event)
      _currentState().onError(event, stateCtx)
    }

    ws.value.onclose = (event) => {
      _limpiarPing()
      _currentState().onClose(event, stateCtx)
      ws.value = null

      if (event.code === 4401) {
        error.value  = 'Token inválido o corrupto. Por favor inicia sesión nuevamente.'
        estado.value = 'error'
      } else if (event.code === 1006) {
        error.value  = 'Conexión cerrada inesperadamente. Verifica que el servidor esté en línea.'
        estado.value = 'error'
      } else if (event.code !== 1000) {
        error.value  = `Conexión cerrada (código ${event.code}).`
        estado.value = 'error'
      } else {
      }

      if (strategy.shouldReconnect(event)) {
        intentos++
        const delay = strategy.getDelay(intentos)
        console.info(`[WS] retry ${intentos} in ${delay / 1000}s`)
        reconnectTimeout = setTimeout(() => conectar(_lastAuthToken), delay)
      }
    }
  }

  function enviarPregunta(pregunta: string): void {
    if (!pregunta.trim()) {
      console.warn('[WS] empty question')
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
    } catch (e: unknown) {
      console.error('[WS] send error:', e)
      estado.value = 'error'
      error.value  = 'Error al enviar la pregunta al servidor.'
    }
  }

  function desconectar(): void {
    _limpiarPing()
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    if (ws.value) {
      ws.value.close(1000, 'Cierre normal del cliente')
      ws.value = null
    }
    estado.value = 'desconectado'
  }

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

export function useChatWebSocket(baseUrl: string) {
  const noReconnect: ReconnectStrategy = {
    shouldReconnect: () => false,
    getDelay: () => 0,
  }
  return useWebSocket(baseUrl, noReconnect)
}

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

const MAX_REINTENTOS = 5

export function useMonitorWebSocket(baseUrl: string, authToken: string) {
  const ws             = ref<WebSocket | null>(null)
  const estado         = ref<EstadoMonitorWS>({ ...ESTADO_VACIO })
  const conectado      = ref(false)
  const errorConexion  = ref(false)
  const errorMsg       = ref('')
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let intentos = 0

  const strategy = new ExponentialBackoffStrategy(MAX_REINTENTOS)

  function _esConfiguracionValida(): boolean {
    if (!baseUrl || !baseUrl.startsWith('ws')) {
      console.error('[WS Monitor] invalid url:', baseUrl)
      errorMsg.value      = 'URL del servidor WebSocket inválida.'
      errorConexion.value = true
      return false
    }
    if (!authToken || authToken.trim() === '') {
      console.error('[WS Monitor] empty token')
      errorMsg.value      = 'No hay sesión activa. Inicia sesión para ver el monitor.'
      errorConexion.value = true
      return false
    }
    return true
  }

  function conectar(): void {
    if (ws.value?.readyState === WebSocket.OPEN || ws.value?.readyState === WebSocket.CONNECTING) {
      return
    }
    if (!_esConfiguracionValida()) return

    if (intentos >= MAX_REINTENTOS) {
      console.error('[WS Monitor] max retries:', MAX_REINTENTOS)
      errorMsg.value      = 'No se pudo conectar al monitor tras varios intentos.'
      errorConexion.value = true
      return
    }

    try {
      ws.value = new WebSocket(`${baseUrl}/ws/monitor?token=${authToken}`)
    } catch (e: unknown) {
      console.error('[WS Monitor] create error:', e)
      errorMsg.value      = 'No se pudo crear la conexión con el monitor.'
      errorConexion.value = true
      return
    }

    ws.value.onopen = () => {
      console.info('[WS Monitor] connected')
      conectado.value     = true
      errorConexion.value = false
      errorMsg.value      = ''
      intentos            = 0
    }

    ws.value.onmessage = (event) => {
      try {
        const msg: WsMensajeMonitor = JSON.parse(event.data)
        if (msg.tipo === 'estado_completo' && msg.data) {
          estado.value = msg.data
        } else if (msg.tipo === 'error') {
          console.error('[WS Monitor] server error:', msg)
        }
      } catch (err) {
        console.error('[WS Monitor] parse error:', err, event.data)
      }
    }

    ws.value.onclose = (event) => {
      conectado.value = false
      ws.value        = null

      if (!strategy.shouldReconnect(event)) {
        errorConexion.value = true
        errorMsg.value      = event.code === 4001 || event.code === 4003
          ? 'Sesión expirada. Recarga la página e inicia sesión.'
          : ''
        if (event.code !== 1000) {
          console.error(`[WS Monitor] close no-reconnect, code:`, event.code)
        }
        return
      }

      errorConexion.value = true
      intentos++
      const delay = strategy.getDelay(intentos)
      console.warn(`[WS Monitor] retry ${intentos}/${MAX_REINTENTOS}, code: ${event.code}, delay: ${delay / 1000}s`)
      reconnectTimeout = setTimeout(() => conectar(), delay)
    }

    ws.value.onerror = (event) => {
      console.error('[WS Monitor] error:', event)
      conectado.value     = false
      errorConexion.value = true
    }
  }

  function desconectar(): void {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    intentos = MAX_REINTENTOS
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