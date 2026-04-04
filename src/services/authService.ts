// src/services/authService.ts
import { BACKEND_URL } from '@/config/config'

const TOKEN_KEY   = 'auth_token'
const USERNAME_KEY = 'auth_username'
const ROL_KEY     = 'auth_rol'

export interface LoginResponse {
  access_token: string
  token_type:   string
  username:     string
  rol:          string
}

// ─── Llamada al backend ────────────────────────────────────────────────────────

export async function loginAPI(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error de conexión con el servidor.' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }

  return res.json()
}

// ─── Gestión del token en localStorage ────────────────────────────────────────

export function guardarSesion(data: LoginResponse): void {
  localStorage.setItem(TOKEN_KEY,    data.access_token)
  localStorage.setItem(USERNAME_KEY, data.username)
  localStorage.setItem(ROL_KEY,      data.rol)
}

export function limpiarSesion(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem(ROL_KEY)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUsernameGuardado(): string {
  return localStorage.getItem(USERNAME_KEY) ?? ''
}

export function getRolGuardado(): string {
  return localStorage.getItem(ROL_KEY) ?? ''
}

export function hayTokenGuardado(): boolean {
  return !!localStorage.getItem(TOKEN_KEY)
}

// ─── Header listo para usar en fetch ──────────────────────────────────────────

export function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  return token
    ? { 'Authorization': `Bearer ${token}` }
    : {}
}