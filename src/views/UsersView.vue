<!-- src/views/UsersView.vue -->
<template>
  <div class="p-8">

    <!-- Cabecera -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">Administradores</h1>
        <p class="text-gray-400 text-sm mt-1">Gestión de usuarios con acceso al panel</p>
      </div>
      <button
        @click="abrirModalCrear"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <Icon icon="mdi:plus" class="text-lg" />
        Nuevo usuario
      </button>
    </div>

    <!-- Tabla -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
        <Icon icon="mdi:account-group-outline" class="text-blue-400 text-lg" />
        <h2 class="text-sm font-semibold text-white">Usuarios registrados</h2>
        <span class="ml-auto px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">
          {{ usuarios.length }} usuario(s)
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700">
              <th class="text-left px-6 py-3">Usuario / Correo</th>
              <th class="text-left px-6 py-3">Rol</th>
              <th class="text-left px-6 py-3">Fecha creación</th>
              <th class="text-center px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in usuarios"
              :key="user.id"
              class="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center shrink-0">
                    <Icon icon="mdi:account-outline" class="text-blue-400 text-base" />
                  </div>
                  <span class="text-gray-200 font-medium">{{ user.username }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-0.5 rounded text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-600/30">
                  {{ user.rol }}
                </span>
              </td>
              <td class="px-6 py-4 text-gray-400 whitespace-nowrap">{{ user.fechaCreacion }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="abrirModalEditar(user)"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs rounded-lg transition-colors"
                  >
                    <Icon icon="mdi:pencil-outline" class="text-sm" />
                    Editar
                  </button>
                  <button
                    @click="eliminar(user)"
                    :disabled="user.username === authStore.username"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="No puedes eliminar tu propio usuario"
                  >
                    <Icon icon="mdi:trash-can-outline" class="text-sm" />
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal crear / editar -->
    <div
      v-if="modalAbierto"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      @click.self="cerrarModal"
    >
      <div class="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">

        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-semibold text-white">
            {{ modoEdicion ? 'Editar usuario' : 'Nuevo usuario' }}
          </h3>
          <button @click="cerrarModal" class="text-gray-500 hover:text-gray-300 transition-colors">
            <Icon icon="mdi:close" class="text-xl" />
          </button>
        </div>

        <div class="flex flex-col gap-4">

          <!-- Username -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400 uppercase tracking-wider">Usuario / Correo</label>
            <div class="relative">
              <Icon icon="mdi:account-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              <input
                v-model="form.username"
                type="text"
                placeholder="usuario@epn.edu.ec"
                class="w-full pl-10 pr-4 py-2.5 bg-gray-700 text-white text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400 uppercase tracking-wider">
              Contraseña {{ modoEdicion ? '(dejar vacío para no cambiar)' : '' }}
            </label>
            <div class="relative">
              <Icon icon="mdi:lock-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              <input
                v-model="form.password"
                :type="verPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full pl-10 pr-10 py-2.5 bg-gray-700 text-white text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 transition-all"
              />
              <button
                type="button"
                @click="verPassword = !verPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Icon :icon="verPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="text-lg" />
              </button>
            </div>
          </div>

          <!-- Error -->
          <p v-if="errorModal" class="text-red-400 text-xs flex items-center gap-1.5">
            <Icon icon="mdi:alert-circle-outline" />
            {{ errorModal }}
          </p>

          <!-- Botones -->
          <div class="flex gap-3 mt-2">
            <button
              @click="cerrarModal"
              class="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="guardar"
              class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {{ modoEdicion ? 'Guardar cambios' : 'Crear usuario' }}
            </button>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: number
  username: string
  rol: string
  fechaCreacion: string
}

// ── Datos temporales (conectar a backendService cuando exista POST /auth/users) ──
const usuarios = ref<AdminUser[]>([
  {
    id: 1,
    username: 'admin@epn.edu.ec',
    rol: 'Admin',
    fechaCreacion: '2026-01-23',
  },
  {
    id: 2,
    username: 'admin',
    rol: 'Admin',
    fechaCreacion: '2026-01-23',
  },
])

// ── Modal ─────────────────────────────────────────────────────────────────────
const modalAbierto  = ref(false)
const modoEdicion   = ref(false)
const verPassword   = ref(false)
const errorModal    = ref('')
const usuarioEditando = ref<AdminUser | null>(null)

const form = ref({ username: '', password: '' })

const abrirModalCrear = () => {
  modoEdicion.value     = false
  usuarioEditando.value = null
  form.value            = { username: '', password: '' }
  errorModal.value      = ''
  verPassword.value     = false
  modalAbierto.value    = true
}

const abrirModalEditar = (user: AdminUser) => {
  modoEdicion.value     = true
  usuarioEditando.value = user
  form.value            = { username: user.username, password: '' }
  errorModal.value      = ''
  verPassword.value     = false
  modalAbierto.value    = true
}

const cerrarModal = () => {
  modalAbierto.value = false
}

const guardar = () => {
  errorModal.value = ''

  if (!form.value.username.trim()) {
    errorModal.value = 'El usuario no puede estar vacío.'
    return
  }
  if (!modoEdicion.value && !form.value.password.trim()) {
    errorModal.value = 'La contraseña es obligatoria para nuevos usuarios.'
    return
  }

  if (modoEdicion.value && usuarioEditando.value) {
    // TODO: conectar con backendService.actualizarUsuario() cuando exista
    const idx = usuarios.value.findIndex(u => u.id === usuarioEditando.value!.id)
    if (idx !== -1) usuarios.value[idx].username = form.value.username
  } else {
    // TODO: conectar con backendService.crearUsuario() cuando exista
    usuarios.value.push({
      id:            Date.now(),
      username:      form.value.username,
      rol:           'Admin',
      fechaCreacion: new Date().toISOString().split('T')[0],
    })
  }

  cerrarModal()
}

const eliminar = (user: AdminUser) => {
  if (user.username === authStore.username) return
  if (!confirm(`¿Eliminar al usuario "${user.username}"?`)) return
  // TODO: conectar con backendService.eliminarUsuario() cuando exista
  usuarios.value = usuarios.value.filter(u => u.id !== user.id)
}
</script>