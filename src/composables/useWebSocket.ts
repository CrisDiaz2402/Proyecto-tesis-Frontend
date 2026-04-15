// src/composables/useWebSocket.ts
import { ref, onUnmounted } from 'vue'

export interface WebSocketMessage {
  type: 'token' | 'complete' | 'error' | 'monitor'
  data: any
}

export function useChatWebSocket(baseUrl: string) {
  const ws = ref<WebSocket | null>(null)
  const estado = ref<'desconectado' | 'conectando' | 'listo' | 'generando' | 'error'>('desconectado')
  const token = ref('')
  const mensajeCompleto = ref('')
  const error = ref('')

  function conectar(authToken: string) {
    if (ws.value?.readyState === WebSocket.OPEN) return

    estado.value = 'conectando'
    ws.value = new WebSocket(`${baseUrl}/ws/chat?token=${authToken}`)

    ws.value.onopen = () => {
      estado.value = 'listo'
      error.value = ''
    }

    ws.value.onmessage = (event) => {
      try {
        const mensaje: WebSocketMessage = JSON.parse(event.data)
        
        switch (mensaje.type) {
          case 'token':
            token.value += mensaje.data
            estado.value = 'generando'
            break
            
          case 'complete':
            mensajeCompleto.value = token.value
            estado.value = 'listo'
            break
            
          case 'error':
            error.value = mensaje.data
            estado.value = 'error'
            break
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err)
        error.value = 'Error de formato en mensaje del servidor'
        estado.value = 'error'
      }
    }

    ws.value.onerror = () => {
      estado.value = 'error'
      error.value = 'Error de conexión WebSocket'
    }

    ws.value.onclose = () => {
      estado.value = 'desconectado'
    }
  }

  function enviarPregunta(pregunta: string) {
    if (ws.value?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket no está conectado')
    }

    // Reset del estado
    token.value = ''
    mensajeCompleto.value = ''
    error.value = ''
    estado.value = 'generando'

    ws.value.send(JSON.stringify({
      type: 'chat',
      data: { pregunta }
    }))
  }

  function desconectar() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    estado.value = 'desconectado'
  }

  // Cleanup automático
  onUnmounted(() => {
    desconectar()
  })

  return {
    // Estado
    estado,
    token,
    mensajeCompleto,
    error,

    // Acciones
    conectar,
    enviarPregunta,
    desconectar
  }
}

/**
 * Composable para monitor WebSocket (futuro reemplazo del polling HTTP)
 */
export function useMonitorWebSocket(baseUrl: string, authToken: string) {
  const ws = ref<WebSocket | null>(null)
  const estado = ref<any>(null)
  const conectado = ref(false)

  function conectar() {
    ws.value = new WebSocket(`${baseUrl}/ws/monitor?token=${authToken}`)

    ws.value.onopen = () => {
      conectado.value = true
    }

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        estado.value = data
      } catch (err) {
        console.error('Error parsing monitor WebSocket message:', err)
      }
    }

    ws.value.onclose = () => {
      conectado.value = false
    }

    ws.value.onerror = () => {
      conectado.value = false
    }
  }

  function desconectar() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    conectado.value = false
  }

  onUnmounted(() => {
    desconectar()
  })

  return {
    estado,
    conectado,
    conectar,
    desconectar
  }
}