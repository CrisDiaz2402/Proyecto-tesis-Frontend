// src/services/api/chatApi.ts
import { BACKEND_URL } from '@/config/config'
import { getAuthHeaders } from '@/services/authService'
import type { ChatResponse } from '../types/chat.types'

export async function consultarRAG(pregunta: string): Promise<ChatResponse> {
  const res = await fetch(`${BACKEND_URL}/api/chat/consultar`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pregunta }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error en el chat.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }

  return res.json()
}