<template>
  <div class="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100 blur-[120px] rounded-full pointer-events-none"></div>

    <div class="w-full max-w-sm relative z-10">
      <div class="text-center mb-8">
        <img src="/logo.svg" alt="Logo sistema" class="w-20 h-20 object-contain mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-gray-800">FisBot</h1>
        <p class="text-gray-500 text-sm mt-1">Asistente virtual de la FIS</p>
      </div>

      <div class="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
        <h2 class="text-lg font-semibold text-gray-800 mb-6">Iniciar sesión</h2>

        <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-500 uppercase tracking-wider">Usuario</label>
            <div class="relative">
              <Icon icon="mdi:account-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                v-model="form.username"
                type="text"
                required
                class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder-gray-400"
                placeholder="Ingresa tu usuario"
              >
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-500 uppercase tracking-wider">Contraseña</label>
            <div class="relative">
              <Icon icon="mdi:lock-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                v-model="form.password"
                :type="mostrarPassword ? 'text' : 'password'"
                required
                class="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder-gray-400"
                placeholder="••••••••"
              >
              <button
                type="button"
                @click="mostrarPassword = !mostrarPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon :icon="mostrarPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="text-lg" />
              </button>
            </div>
          </div>

          <p v-if="error" class="text-red-500 text-sm mt-2 flex items-center gap-1.5">
            <Icon icon="mdi:alert-circle" />
            {{ error }}
          </p>

          <button
            type="submit"
            :disabled="cargando"
            class="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <Icon v-if="cargando" icon="mdi:loading" class="animate-spin text-lg" />
            <span>{{ cargando ? 'Verificando...' : 'Ingresar' }}</span>
          </button>
        </form>

        <div class="flex items-center my-6">
          <div class="flex-1 border-t border-gray-200"></div>
          <span class="px-3 text-xs text-gray-400 uppercase tracking-wide">Acceso Estudiantes</span>
          <div class="flex-1 border-t border-gray-200"></div>
        </div>

        <RouterLink
          to="/"
          class="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-600 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Icon icon="mdi:robot-3d" class="text-xl" />
          <span>Volver al Asistente Virtual</span>
        </RouterLink>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router     = useRouter()
const authStore  = useAuthStore()

const form           = ref({ username: '', password: '' })
const error          = ref('')
const cargando       = ref(false)
const mostrarPassword = ref(false)

const handleLogin = async () => {
  error.value    = ''
  cargando.value = true

  try {
    const ok = await authStore.login(form.value.username, form.value.password)
    if (ok) {
      router.push('/admin/documents')
    } else {
      error.value = 'Credenciales inválidas'
    }
  } catch (e: any) {
    error.value = e.message || 'Error de conexión'
  } finally {
    cargando.value = false
  }
}
</script>