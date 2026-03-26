// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {

  const username  = ref<string>('')
  const isLoggedIn = ref<boolean>(false)

  // ─── LOGIN ──────────────────────────────────────────────────────────────────

  /**
   * Autenticación temporal con credenciales hardcodeadas.
   * Cuando app/api/routers/auth.py esté implementado, reemplazar el bloque
   * hardcodeado por la llamada a backendService.login().
   */
  async function login(user: string, password: string): Promise<boolean> {

    // ── TEMPORAL: validación local ──────────────────────────────────────────
    // Reemplazar esto cuando exista POST /auth/login en el backend:
    //
    // import { login as loginAPI } from '@/services/backendService'
    // const result = await loginAPI(user, password)
    // if (!result.ok) return false
    // localStorage.setItem('auth_token', result.token!)
    // username.value  = user
    // isLoggedIn.value = true
    // return true
    // ────────────────────────────────────────────────────────────────────────

    const CREDENCIALES_TEMP = [
      { user: 'admin',            password: 'admin123'  },
      { user: 'admin@epn.edu.ec', password: 'admin123'  },
    ]

    const valido = CREDENCIALES_TEMP.some(
      c => c.user === user && c.password === password
    )

    if (valido) {
      username.value   = user
      isLoggedIn.value = true
      return true
    }

    return false
  }

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────

  function logout() {
    username.value   = ''
    isLoggedIn.value = false

    // Cuando exista auth en el backend, también limpiar el token:
    // localStorage.removeItem('auth_token')
  }

  return { username, isLoggedIn, login, logout }
})