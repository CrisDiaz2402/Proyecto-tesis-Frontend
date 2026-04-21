<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">Administradores</h1>
        <p class="text-gray-400 text-sm mt-1">Gestión de usuarios con acceso al panel</p>
      </div>
      <button
        @click="abrirModalCrear"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors w-full sm:w-auto justify-center"
      >
        <Icon icon="mdi:plus" class="text-lg" />
        Nuevo usuario
      </button>
    </div>

    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
        <Icon icon="mdi:account-group-outline" class="text-blue-400 text-lg" />
        <h2 class="text-sm font-semibold text-white">Usuarios registrados</h2>
        <span class="ml-auto px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">
          {{ usuarios.length }} usuario(s)
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-900/50">
              <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Usuario</th>
              <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rol</th>
              <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Fecha Creación</th>
              <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            <tr v-for="user in usuarios" :key="user.id" class="hover:bg-gray-700/30 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {{ user.username.charAt(0) }}
                  </div>
                  <span class="text-sm font-medium text-gray-200">{{ user.username }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase rounded-md border border-blue-500/20">
                  {{ user.rol }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-400 hidden sm:table-cell">
                {{ new Date(user.fecha_creacion).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button 
                    @click="abrirModalEdicion(user)"
                    class="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Icon icon="mdi:pencil-outline" class="text-lg" />
                  </button>
                  <button 
                    @click="confirmarEliminacion(user)"
                    :disabled="user.username === authStore.username"
                    class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Eliminar"
                  >
                    <Icon icon="mdi:trash-can-outline" class="text-lg" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="modalAbierto" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Icon :icon="modoEdicion ? 'mdi:account-edit' : 'mdi:account-plus'" class="text-blue-500" />
          {{ modoEdicion ? 'Editar administrador' : 'Nuevo administrador' }}
        </h2>

        <form @submit.prevent="guardar" class="space-y-5">
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase mb-2">Nombre de usuario</label>
            <input 
              v-model="form.username"
              type="text"
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Ej: admin_central"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase mb-2">
              {{ modoEdicion ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña' }}
            </label>
            <div class="relative">
              <input 
                v-model="form.password"
                :type="verPassword ? 'text' : 'password'"
                class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
              <button 
                type="button"
                @click="verPassword = !verPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <Icon :icon="verPassword ? 'mdi:eye-off' : 'mdi:eye'" class="text-xl" />
              </button>
            </div>
          </div>

          <div v-if="errorModal" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <Icon icon="mdi:alert-circle" />
            {{ errorModal }}
          </div>

          <div class="flex gap-3 pt-4">
            <button 
              type="button"
              @click="cerrarModal" 
              class="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              :disabled="procesandoForm"
              class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              <Icon v-if="procesandoForm" icon="mdi:loading" class="animate-spin" />
              {{ modoEdicion ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <AppConfirmModal
      :isOpen="confirmModal.show"
      title="Eliminar administrador"
      :message="`¿Estás seguro de que deseas eliminar al usuario '${confirmModal.user?.username}'? Esta acción es irreversible.`"
      confirmText="Eliminar permanentemente"
      :isLoading="confirmModal.loading"
      isDestructive
      @confirm="ejecutarEliminacion"
      @cancel="cerrarModalConfirmacion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'

import { toast } from 'vue3-toastify'
import { useAuthStore } from '@/stores/auth'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import { 
  obtenerUsuarios, 
  crearUsuario, 
  actualizarUsuario, 
  eliminarUsuario,
  type Usuario 
} from '@/services/backendService'

const authStore = useAuthStore()
const usuarios = ref<Usuario[]>([])
const modalAbierto    = ref(false)
const modoEdicion     = ref(false)
const usuarioEditando = ref<Usuario | null>(null)
const errorModal      = ref('')
const verPassword     = ref(false)
const procesandoForm  = ref(false)

const form = ref({
  username: '',
  password: ''
})

const confirmModal = reactive({
  show: false,
  loading: false,
  user: null as Usuario | null
})

const cargarUsuarios = async () => {
  try {
    usuarios.value = await obtenerUsuarios()
  } catch (e: any) {
    toast.error("Error al conectar con el servidor.")
  }
}

onMounted(cargarUsuarios)

const abrirModalCrear = () => {
  modoEdicion.value     = false
  usuarioEditando.value = null
  form.value            = { username: '', password: '' }
  errorModal.value      = ''
  modalAbierto.value    = true
}

const abrirModalEdicion = (user: Usuario) => {
  modoEdicion.value     = true
  usuarioEditando.value = user
  form.value            = { username: user.username, password: '' }
  errorModal.value      = ''
  modalAbierto.value    = true
}

const cerrarModal = () => {
  modalAbierto.value = false
}

const guardar = async () => {
  errorModal.value = ''

  if (!form.value.username.trim()) {
    errorModal.value = 'El nombre de usuario es requerido.'
    return
  }
  if (!modoEdicion.value && !form.value.password.trim()) {
    errorModal.value = 'La contraseña es obligatoria para nuevos usuarios.'
    return
  }

  procesandoForm.value = true
  try {
    const payload: any = { username: form.value.username }
    if (form.value.password.trim()) payload.password = form.value.password

    if (modoEdicion.value && usuarioEditando.value) {
      await actualizarUsuario(usuarioEditando.value.id, payload)
      toast.success('Usuario actualizado correctamente')
    } else {
      payload.rol = 'Admin'
      await crearUsuario(payload)
      toast.success('Usuario creado exitosamente')
    }
    
    await cargarUsuarios()
    cerrarModal()
  } catch (e: any) {
    errorModal.value = e.message
  } finally {
    procesandoForm.value = false
  }
}

const confirmarEliminacion = (user: Usuario) => {
  confirmModal.user = user
  confirmModal.show = true
}

const cerrarModalConfirmacion = () => {
  if (!confirmModal.loading) {
    confirmModal.show = false
    confirmModal.user = null
  }
}

const ejecutarEliminacion = async () => {
  if (!confirmModal.user) return

  confirmModal.loading = true
  try {
    await eliminarUsuario(confirmModal.user.id)
    toast.success('Usuario eliminado permanentemente')
    await cargarUsuarios()
    confirmModal.show = false
  } catch (e: any) {
    toast.error(`Error: ${e.message}`)
  } finally {
    confirmModal.loading = false
    confirmModal.user = null
  }
}
</script>