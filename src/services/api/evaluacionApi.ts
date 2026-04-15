// src/services/api/evaluacionApi.ts
import { BACKEND_URL } from '@/config/config'
import { getAuthHeaders } from '@/services/authService'
import type { 
  EjecucionRequest, 
  ResultadoEvaluacion, 
  EventoSSE
} from '../types/evaluacion.types'

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

// ─────────────────────────────────────────────────────────────────────────────
// Evaluación con SSE — llama al callback onEvento por cada evento recibido.
// Retorna el ResultadoEvaluacion final cuando el stream termina.
// ─────────────────────────────────────────────────────────────────────────────
export async function ejecutarEvaluacionStream(
  request: EjecucionRequest,
  onEvento: (evento: EventoSSE) => void,
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

    // Cada evento SSE termina con "\\n\\n"
    const partes = buffer.split('\\n\\n')
    // El último elemento puede ser un fragmento incompleto — lo dejamos en buffer
    buffer = partes.pop() ?? ''

    for (const parte of partes) {
      // Extraer el contenido después de "data: "
      const linea = parte.trim()
      if (!linea.startsWith('data:')) continue

      const jsonStr = linea.slice('data:'.length).trim()
      if (!jsonStr) continue

      try {
        const evento: EventoSSE = JSON.parse(jsonStr)
        onEvento(evento)

        // Si llega el evento final, guardamos el reporte
        if (evento.tipo === 'completado') {
          reporteFinal = evento.resultado_final
        }
      } catch (err) {
        console.error('Error parsing SSE evento:', err, 'JSON:', jsonStr)
      }
    }
  }

  if (!reporteFinal) {
    throw new Error('Evaluación terminó sin resultado final.')
  }

  return reporteFinal
}