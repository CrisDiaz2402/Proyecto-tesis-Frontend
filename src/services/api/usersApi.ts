// src/services/api/usuariosApi.ts
import { BACKEND_URL } from '@/config/config'
import { getAuthHeaders } from '@/services/authService'
import type { Usuario } from '../types/usuario.types'

export async function obtenerUsuarios(): Promise<Usuario[]> {
  const res = await fetch(`${BACKEND_URL}/api/usuarios`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function crearUsuario(username: string, password: string, rol: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/usuarios`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify({ username, password, rol }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al crear usuario.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
}

export async function eliminarUsuario(id: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/usuarios/${id}`, {
    method:  'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al eliminar usuario.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
}

export async function actualizarUsuario(
  id: string, 
  payload: { username?: string; password?: string; rol?: string }
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/usuarios/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al actualizar usuario.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
}