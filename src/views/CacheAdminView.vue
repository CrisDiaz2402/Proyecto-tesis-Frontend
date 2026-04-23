<template>
  <div class="p-4 sm:p-6 lg:p-8">

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Gestión del Caché</h1>
        <p class="text-gray-400 text-sm mt-1">Edita o elimina respuestas almacenadas en caché</p>
      </div>
      <div class="flex items-center gap-3">
        <select
          v-model="motorLlm"
          @change="cargarEntradas"
          class="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="local">Motor: Local</option>
          <option value="cloud">Motor: Cloud</option>
        </select>
        <button
          @click="cargarEntradas"
          :disabled="cargando"
          class="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:refresh" :class="{ 'animate-spin': cargando }" class="text-lg" />
          Recargar
        </button>
      </div>
    </div>

    <div class="relative mb-4">
      <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Icon
          v-if="!buscando"
          icon="mdi:magnify"
          class="text-gray-500 text-lg"
        />
        <Icon
          v-else
          icon="mdi:loading"
          class="text-gray-500 text-lg animate-spin"
        />
      </div>
      <input
        v-model="textoBusqueda"
        type="text"
        placeholder="Buscar por pregunta..."
        class="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-gray-500"
      />
    </div>

    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-700 bg-gray-800/80">
              <th class="text-left px-4 py-3 text-gray-400 font-semibold">Pregunta</th>
              <th class="text-left px-4 py-3 text-gray-400 font-semibold hidden md:table-cell">Vista previa</th>
              <th class="text-left px-4 py-3 text-gray-400 font-semibold hidden lg:table-cell">Documento origen</th>
              <th class="text-left px-4 py-3 text-gray-400 font-semibold hidden sm:table-cell whitespace-nowrap">Fecha</th>
              <th class="text-right px-4 py-3 text-gray-400 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>

            <template v-if="cargando">
              <tr v-for="i in 3" :key="`sk-${i}`" class="border-b border-gray-700/50">
                <td class="px-4 py-3"><div class="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div></td>
                <td class="px-4 py-3 hidden md:table-cell"><div class="h-4 bg-gray-700 rounded animate-pulse w-2/3"></div></td>
                <td class="px-4 py-3 hidden lg:table-cell"><div class="h-4 bg-gray-700 rounded animate-pulse w-1/2"></div></td>
                <td class="px-4 py-3 hidden sm:table-cell"><div class="h-4 bg-gray-700 rounded animate-pulse w-24"></div></td>
                <td class="px-4 py-3"><div class="h-4 bg-gray-700 rounded animate-pulse w-16 ml-auto"></div></td>
              </tr>
            </template>

            <tr v-else-if="entradas.length === 0">
              <td colspan="5" class="px-4 py-16 text-center">
                <div class="flex flex-col items-center gap-3">
                  <Icon icon="mdi:database-off-outline" class="text-gray-600 text-5xl" />
                  <p class="text-gray-500">No hay entradas en el caché</p>
                </div>
              </td>
            </tr>

            <tr
              v-else
              v-for="entrada in entradas"
              :key="entrada.clave"
              class="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
            >
              <td class="px-4 py-3 text-gray-200">{{ truncar(entrada.pregunta, 80) }}</td>
              <td class="px-4 py-3 text-gray-400 hidden md:table-cell">{{ truncar(entrada.respuesta_preview, 60) }}</td>
              <td class="px-4 py-3 text-gray-400 hidden lg:table-cell">{{ entrada.documento_origen }}</td>
              <td class="px-4 py-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">{{ formatearFecha(entrada.timestamp) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="abrirEdicion(entrada)"
                    class="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Editar respuesta"
                  >
                    <Icon icon="mdi:pencil-outline" class="text-lg" />
                  </button>
                  <button
                    @click="pedirEliminacion(entrada)"
                    class="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Eliminar entrada"
                  >
                    <Icon icon="mdi:delete-outline" class="text-lg" />
                  </button>
                </div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="modalEdicion.abierto"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
      @click.self="cerrarEdicion"
    >
      <div class="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl">

        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-semibold text-white flex items-center gap-2">
            <Icon icon="mdi:pencil-outline" class="text-blue-400 text-xl" />
            Editar respuesta
          </h3>
          <button
            @click="cerrarEdicion"
            :disabled="modalEdicion.guardando"
            class="text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <Icon icon="mdi:close" class="text-xl" />
          </button>
        </div>

        <div v-if="modalEdicion.cargandoDetalle" class="py-10 flex justify-center">
          <Icon icon="mdi:loading" class="animate-spin text-gray-400 text-3xl" />
        </div>

        <template v-else>
          <div class="mb-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1.5">Pregunta (referencia)</p>
            <p class="text-gray-400 text-sm bg-gray-900/50 rounded-lg px-3 py-2.5 border border-gray-700 leading-relaxed">
              {{ modalEdicion.pregunta }}
            </p>
          </div>

          <div class="mb-6">
            <label class="text-xs text-gray-500 uppercase tracking-wide font-semibold block mb-1.5">
              Respuesta corregida
            </label>
            <textarea
              v-model="modalEdicion.nuevaRespuesta"
              rows="8"
              class="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 resize-y placeholder-gray-500"
              placeholder="Escribe la respuesta corregida..."
            ></textarea>
          </div>

          <div class="flex gap-3">
            <button
              @click="cerrarEdicion"
              :disabled="modalEdicion.guardando"
              class="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              @click="guardarEdicion"
              :disabled="modalEdicion.guardando"
              class="flex-1 flex justify-center items-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <Icon v-if="modalEdicion.guardando" icon="mdi:loading" class="animate-spin text-lg" />
              Guardar cambios
            </button>
          </div>
        </template>

      </div>
    </div>

    <AppConfirmModal
      :is-open="modalEliminar.abierto"
      title="Eliminar entrada del caché"
      :message="`¿Estás seguro de que deseas eliminar esta entrada?\n\n&quot;${truncar(modalEliminar.pregunta, 60)}&quot;`"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      :is-destructive="true"
      :is-loading="modalEliminar.eliminando"
      @confirm="confirmarEliminacion"
      @cancel="modalEliminar.abierto = false"
    />

  </div>
</template>

<script setup lang="ts">
// 1. Añadimos nextTick aquí
import { ref, watch, onMounted, nextTick } from 'vue' 
import { toast } from 'vue3-toastify'
import { useAuthStore } from '@/stores/auth'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import {
  listarEntradasCache,
  buscarEntradasCache,
  obtenerEntradaCache,
  corregirEntradaCache,
  eliminarEntradaCache,
} from '@/services/backendService'
import type { EntradaResumen } from '@/services/backendService'

// ── Estado general ──────────────────────────────────────────────────────────
const authStore      = useAuthStore()
const motorLlm       = ref<'local' | 'cloud'>('local')
const textoBusqueda  = ref('')
const entradas       = ref<EntradaResumen[]>([])
const cargando       = ref(false)
const buscando       = ref(false)

// ── Modal edición ────────────────────────────────────────────────────────────
const modalEdicion = ref({
  abierto:         false,
  clave:           '',
  pregunta:        '',
  nuevaRespuesta:  '',
  cargandoDetalle: false,
  guardando:       false,
})

// ── Modal eliminación ────────────────────────────────────────────────────────
const modalEliminar = ref({
  abierto:    false,
  pregunta:   '',
  clave:      '',
  eliminando: false,
})

// ── Helpers ──────────────────────────────────────────────────────────────────
function truncar(texto: string, max: number): string {
  if (!texto) return ''
  return texto.length > max ? texto.slice(0, max) + '…' : texto
}

function formatearFecha(timestamp: string): string {
  const num  = Number(timestamp)
  const date = isNaN(num) ? new Date(timestamp) : new Date(num * 1000)
  return date.toLocaleDateString('es-EC', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Carga principal ──────────────────────────────────────────────────────────
async function cargarEntradas() {
  cargando.value = true
  try {
    entradas.value = await listarEntradasCache(motorLlm.value)
  } catch (err: any) {
    toast.error(err.message ?? 'Error al cargar el caché')
  } finally {
    cargando.value = false
  }
}

// ── Búsqueda con debounce ────────────────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(textoBusqueda, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    if (!val.trim()) {
      await cargarEntradas()
      return
    }
    buscando.value = true
    try {
      entradas.value = await buscarEntradasCache(val.trim())
    } catch (err: any) {
      toast.error(err.message ?? 'Error al buscar entradas')
    } finally {
      buscando.value = false
    }
  }, 400)
})

// ── Edición ──────────────────────────────────────────────────────────────────
async function abrirEdicion(entrada: EntradaResumen) {
  modalEdicion.value = {
    abierto:         true,
    clave:           entrada.clave,
    pregunta:        entrada.pregunta,
    nuevaRespuesta:  '',
    cargandoDetalle: true,
    guardando:       false,
  }
  try {
    const detalle = await obtenerEntradaCache(entrada.clave)
    modalEdicion.value.nuevaRespuesta = detalle.respuesta
  } catch (err: any) {
    toast.error(err.message ?? 'Error al obtener el detalle de la entrada')
    modalEdicion.value.abierto = false
  } finally {
    modalEdicion.value.cargandoDetalle = false
  }
}

function cerrarEdicion() {
  if (!modalEdicion.value.guardando) {
    modalEdicion.value.abierto = false
  }
}

async function guardarEdicion() {
  modalEdicion.value.guardando = true
  try {
    const actualizado = await corregirEntradaCache(
      modalEdicion.value.clave,
      modalEdicion.value.nuevaRespuesta,
      authStore.username,
    )
    // Actualizar la fila en la lista local sin recargar todo
    const idx = entradas.value.findIndex(e => e.clave === modalEdicion.value.clave)
    const entradaActualizar = idx !== -1 ? entradas.value[idx] : undefined
    if (entradaActualizar) {
      entradaActualizar.respuesta_preview = truncar(actualizado.respuesta, 100)
    }
    toast.success('Respuesta actualizada correctamente')
    modalEdicion.value.abierto = false
  } catch (err: any) {
    toast.error(err.message ?? 'Error al guardar la respuesta')
  } finally {
    modalEdicion.value.guardando = false
  }
}

// ── Eliminación ──────────────────────────────────────────────────────────────
function pedirEliminacion(entrada: EntradaResumen) {
  modalEliminar.value = {
    abierto:    true,
    pregunta:   entrada.pregunta,
    clave:      entrada.clave,
    eliminando: false,
  }
}

async function confirmarEliminacion() {
  modalEliminar.value.eliminando = true
  try {
    await eliminarEntradaCache(modalEliminar.value.clave)
    entradas.value = entradas.value.filter(e => e.clave !== modalEliminar.value.clave)
    toast.success('Entrada eliminada del caché')
    modalEliminar.value.abierto = false
  } catch (err: any) {
    toast.error(err.message ?? 'Error al eliminar la entrada')
  } finally {
    modalEliminar.value.eliminando = false
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
// 2. Modificamos el hook onMounted para evitar la colisión con la limpieza del canvas 3D
onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      cargarEntradas()
    }, 100)
  })
})
</script>