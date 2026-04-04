// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  loginAPI,
  guardarSesion,
  limpiarSesion,
  hayTokenGuardado,
  getUsernameGuardado,
} from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {

  // Inicializamos desde localStorage para sobrevivir recargas de página
  const username   = ref<string>(getUsernameGuardado())
  const isLoggedIn = ref<boolean>(hayTokenGuardado())

  // ─── LOGIN ──────────────────────────────────────────────────────────────────

  async function login(user: string, password: string): Promise<boolean> {
    try {
      const data = await loginAPI(user, password)
      guardarSesion(data)
      username.value   = data.username
      isLoggedIn.value = true
      return true
    } catch {
      return false
    }
  }

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────

  function logout() {
    limpiarSesion()
    username.value   = ''
    isLoggedIn.value = false
  }

  return { username, isLoggedIn, login, logout }
})