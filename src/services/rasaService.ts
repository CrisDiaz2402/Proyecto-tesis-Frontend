// src/services/rasaService.ts
import { RASA_URL, SESSION_STORAGE_KEY } from '@/config/config'

export interface RasaMessage {
  recipient_id: string
  text?: string
}

export interface RasaResponse {
  texto: string
  textoParaVoz: string
}

export function obtenerIdSesion(): string {
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!sessionId) {
    sessionId = 'user_' + Math.random().toString(36).substring(2, 11)
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  }
  return sessionId
}

export async function enviarMensaje(mensaje: string): Promise<RasaResponse> {
  const res = await fetch(`${RASA_URL}/webhooks/rest/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: obtenerIdSesion(), message: mensaje }),
  })

  if (!res.ok) throw new Error(`Rasa HTTP ${res.status}`)

  const data: RasaMessage[] = await res.json()

  if (!data || data.length === 0) {
    const fallback = 'No entendí, intenta de nuevo.'
    return { texto: fallback, textoParaVoz: fallback }
  }

  const texto = data
    .map(msg => msg.text)
    .filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    .join('\n\n')

  const textoParaVoz = texto
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#+\s/g, '')
    .replace(/\|/g, ', ')

  return { texto, textoParaVoz }
}

export async function rasaOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${RASA_URL}/`)
    return res.ok
  } catch {
    return false
  }
}