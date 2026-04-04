<template>
  <div class="p-8">

    <!-- ── CABECERA ──────────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Gestión de Documentos</h1>
        <p class="text-gray-400 text-sm mt-1">Base de conocimiento del asistente virtual</p>
      </div>

      <div class="flex flex-col items-end">
        <button
          @click="abrirModal"
          :disabled="documentos.length >= MAX_DOCUMENTOS"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors',
            documentos.length >= MAX_DOCUMENTOS ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'
          ]"
        >
          <Icon icon="mdi:plus" class="text-lg" />
          Subir documento
        </button>
        <span v-if="documentos.length >= MAX_DOCUMENTOS" class="text-xs text-red-400 mt-2">
          Límite máximo de {{ MAX_DOCUMENTOS }} documentos alcanzado.
        </span>
      </div>
    </div>

    <!-- ── PANEL DE ADMINISTRACIÓN GLOBAL ────────────────────────────────────── -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-8">
      <div class="px-6 py-4 border-b border-gray-700">
        <h2 class="text-sm font-semibold text-white flex items-center gap-2">
          <Icon icon="mdi:shield-alert-outline" class="text-orange-400 text-lg" />
          Administración Global del Sistema RAG
        </h2>
      </div>
      <div class="p-6 flex flex-wrap gap-4 items-center bg-gray-800/50">

        <button
          @click="pedirConfirmacion('cache')"
          :disabled="procesandoGlobal"
          class="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-500 border border-yellow-600/50 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:broom" />
          Limpiar Caché
        </button>

        <button
          @click="pedirConfirmacion('vectores')"
          :disabled="procesandoGlobal"
          class="flex items-center gap-2 px-4 py-2 bg-orange-600/20 hover:bg-orange-600/40 text-orange-500 border border-orange-600/50 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:database-remove-outline" />
          Reiniciar Vectores
        </button>

        <button
          @click="pedirConfirmacion('sincronizar')"
          :disabled="procesandoGlobal"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/50 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:sync" :class="{ 'animate-spin': procesandoGlobal }" />
          Sincronizar Conocimiento
        </button>

        <div class="flex-1"></div>

        <button
          @click="pedirConfirmacion('formatear')"
          :disabled="procesandoGlobal"
          class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:delete-alert" />
          Formatear Sistema (Eliminar TODO)
        </button>

      </div>
    </div>

    <!-- ── TABLA DE DOCUMENTOS ────────────────────────────────────────────────── -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
        <Icon icon="mdi:file-document-multiple-outline" class="text-blue-400 text-lg" />
        <h2 class="text-sm font-semibold text-white">Documentos ingresados</h2>
        <span class="ml-auto px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">
          {{ documentos.length }} / {{ MAX_DOCUMENTOS }} archivo(s)
        </span>
      </div>

      <div v-if="cargando" class="p-12 flex justify-center items-center">
        <Icon icon="mdi:loading" class="animate-spin text-4xl text-blue-500" />
      </div>

      <div v-else-if="documentos.length === 0" class="p-12 text-center">
        <Icon icon="mdi:file-hidden" class="text-6xl text-gray-600 mx-auto mb-4" />
        <p class="text-gray-400">No hay documentos en la base de conocimiento.</p>
        <p class="text-gray-500 text-sm mt-1">Sube archivos PDF, Word, TXT o Markdown para empezar.</p>
      </div>

      <table v-else class="w-full text-left text-sm text-gray-300">
        <thead class="bg-gray-900/50 text-gray-400 text-xs uppercase">
          <tr>
            <th class="px-6 py-4 font-medium">Archivo</th>
            <th class="px-6 py-4 font-medium">Subido por</th>
            <th class="px-6 py-4 font-medium">Fecha</th>
            <th class="px-6 py-4 font-medium">Estado</th>
            <th class="px-6 py-4 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-700">
          <tr v-for="doc in documentos" :key="doc.id" class="hover:bg-gray-750 transition-colors group">
            <td class="px-6 py-4 font-medium text-white flex items-center gap-3">
              <Icon :icon="getIconoExtension(doc.nombre_archivo)" class="text-xl text-gray-400" />
              {{ doc.nombre_archivo }}
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center text-xs text-blue-300">
                  {{ doc.subido_por.charAt(0).toUpperCase() }}
                </div>
                {{ doc.subido_por }}
              </div>
            </td>
            <td class="px-6 py-4 text-gray-400">{{ formatearFecha(doc.fecha_subida) }}</td>
            <td class="px-6 py-4">
              <span class="px-2.5 py-1 bg-green-900/30 text-green-400 text-xs rounded-full border border-green-800 flex items-center gap-1.5 w-fit">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {{ doc.estado }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="descargar(doc)"
                  class="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Descargar documento"
                >
                  <Icon icon="mdi:download-outline" class="text-lg" />
                </button>
                <button
                  @click="confirmarEliminarDoc(doc)"
                  class="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Eliminar documento"
                >
                  <Icon icon="mdi:trash-can-outline" class="text-lg" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════════
         MODAL: SUBIR DOCUMENTO
    ══════════════════════════════════════════════════════════════════════════ -->
    <div v-if="modalSubirAbierto" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl relative">
        <button @click="cerrarModalSubir" class="absolute top-4 right-4 text-gray-400 hover:text-white">
          <Icon icon="mdi:close" class="text-xl" />
        </button>

        <h3 class="text-xl font-bold text-white mb-2">Subir Documento</h3>
        <p class="text-gray-400 text-sm mb-6">Añade información a la base de conocimiento del asistente.</p>

        <div
          class="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center bg-gray-900/50 hover:bg-gray-900 transition-colors cursor-pointer mb-6"
          @click="abrirSelectorArchivos"
        >
          <input
            type="file"
            ref="fileInput"
            class="hidden"
            :accept="EXTENSIONES_PERMITIDAS.join(',')"
            @change="manejarArchivo"
          >
          <div v-if="!archivoSeleccionado">
            <Icon icon="mdi:cloud-upload-outline" class="text-4xl text-blue-500 mx-auto mb-3" />
            <p class="text-white font-medium">Haz clic para buscar</p>
            <p class="text-gray-500 text-xs mt-1">Formatos admitidos (Max. {{ LIMITE_TAMANO_MB }}MB)</p>
          </div>
          <div v-else class="flex flex-col items-center gap-2">
            <Icon icon="mdi:file-check" class="text-4xl text-green-500" />
            <p class="text-white font-medium">{{ archivoSeleccionado.name }}</p>
            <p class="text-gray-400 text-xs">{{ (archivoSeleccionado.size / 1024 / 1024).toFixed(2) }} MB</p>
          </div>
        </div>

        <div v-if="mensajeModalSubir" :class="[
          'p-4 rounded-lg text-sm mb-6 flex items-start gap-3',
          mensajeModalSubir.tipo === 'error' ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-green-900/30 text-green-400 border border-green-800'
        ]">
          <Icon :icon="mensajeModalSubir.tipo === 'error' ? 'mdi:alert-circle' : 'mdi:check-circle'" class="text-xl shrink-0" />
          <p>{{ mensajeModalSubir.texto }}</p>
        </div>

        <div class="flex justify-end gap-3">
          <button @click="cerrarModalSubir" class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            @click="confirmarSubida"
            :disabled="!archivoSeleccionado || subiendo || mensajeModalSubir?.tipo === 'error'"
            class="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Icon v-if="subiendo" icon="mdi:loading" class="animate-spin text-lg" />
            {{ subiendo ? 'Procesando...' : 'Subir y Procesar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════════
         MODAL: CONFIRMACIÓN ACCIONES GLOBALES (caché / vectores / sincronizar)
    ══════════════════════════════════════════════════════════════════════════ -->
    <AppConfirmModal
      :isOpen="modalConfirm.show"
      :title="modalConfirm.titulo"
      :message="modalConfirm.mensaje"
      :confirmText="modalConfirm.textoConfirmar"
      cancelText="Cancelar"
      :isDestructive="modalConfirm.destructivo"
      :isLoading="procesandoGlobal"
      @confirm="ejecutarAccionConfirmada"
      @cancel="cerrarModalConfirm"
    />

    <!-- ══════════════════════════════════════════════════════════════════════════
         MODAL: ELIMINAR DOCUMENTO INDIVIDUAL
    ══════════════════════════════════════════════════════════════════════════ -->
    <AppConfirmModal
      :isOpen="modalEliminarDoc.show"
      title="Eliminar documento"
      :message="`¿Estás seguro de que deseas eliminar '${modalEliminarDoc.doc?.nombre_archivo}'?\n\nSe eliminará el archivo físico, sus vectores en ChromaDB y el caché asociado. Esta acción no se puede deshacer.`"
      confirmText="Eliminar"
      cancelText="Cancelar"
      :isDestructive="true"
      :isLoading="modalEliminarDoc.loading"
      @confirm="ejecutarEliminarDoc"
      @cancel="modalEliminarDoc.show = false"
    />

    <!-- ══════════════════════════════════════════════════════════════════════════
         MODAL ESPECIAL: FORMATEAR SISTEMA — requiere contraseña
    ══════════════════════════════════════════════════════════════════════════ -->
    <div
      v-if="modalFormatear.show"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
      @click.self="cerrarModalFormatear"
    >
      <div class="bg-gray-800 border border-red-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-pop-in">

        <!-- Cabecera -->
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
            <Icon icon="mdi:delete-alert" class="text-red-500 text-xl" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">Formatear Sistema</h3>
            <p class="text-red-400 text-xs font-medium">Acción irreversible</p>
          </div>
          <button
            @click="cerrarModalFormatear"
            :disabled="modalFormatear.loading"
            class="ml-auto text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <Icon icon="mdi:close" class="text-xl" />
          </button>
        </div>

        <!-- Consecuencias -->
        <div class="bg-red-900/20 border border-red-800/50 rounded-xl p-4 mb-5">
          <p class="text-red-300 text-xs font-semibold uppercase tracking-wider mb-2">Se eliminará permanentemente:</p>
          <ul class="space-y-1.5">
            <li class="flex items-center gap-2 text-gray-300 text-sm">
              <Icon icon="mdi:circle-small" class="text-red-500 shrink-0" />
              Todos los documentos físicos del servidor
            </li>
            <li class="flex items-center gap-2 text-gray-300 text-sm">
              <Icon icon="mdi:circle-small" class="text-red-500 shrink-0" />
              Toda la base vectorial de ChromaDB
            </li>
            <li class="flex items-center gap-2 text-gray-300 text-sm">
              <Icon icon="mdi:circle-small" class="text-red-500 shrink-0" />
              El caché semántico completo
            </li>
            <li class="flex items-center gap-2 text-gray-300 text-sm">
              <Icon icon="mdi:circle-small" class="text-red-500 shrink-0" />
              Todos los registros en la base de datos
            </li>
          </ul>
        </div>

        <!-- Input de contraseña -->
        <div class="mb-5">
          <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Confirma tu contraseña para continuar
          </label>
          <div class="relative">
            <Icon
              icon="mdi:lock-alert-outline"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none"
            />
            <input
              v-model="modalFormatear.password"
              :type="modalFormatear.verPassword ? 'text' : 'password'"
              :disabled="modalFormatear.loading"
              placeholder="Ingresa tu contraseña"
              @keyup.enter="ejecutarFormatear"
              class="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500 transition-all disabled:opacity-50"
            />
            <button
              type="button"
              @click="modalFormatear.verPassword = !modalFormatear.verPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Icon :icon="modalFormatear.verPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="text-lg" />
            </button>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex gap-3">
          <button
            @click="cerrarModalFormatear"
            :disabled="modalFormatear.loading"
            class="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            @click="ejecutarFormatear"
            :disabled="!modalFormatear.password.trim() || modalFormatear.loading"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon v-if="modalFormatear.loading" icon="mdi:loading" class="animate-spin text-lg" />
            <Icon v-else icon="mdi:delete-forever" class="text-lg" />
            {{ modalFormatear.loading ? 'Eliminando...' : 'Formatear Sistema' }}
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import { toast } from 'vue3-toastify'
import { MAX_DOCUMENTOS, LIMITE_TAMANO_BYTES, LIMITE_TAMANO_MB, EXTENSIONES_PERMITIDAS } from '@/config/config'
import { useAuthStore } from '@/stores/auth'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import {
  obtenerDocumentos,
  subirDocumento,
  eliminarDocumento,
  descargarDocumento,
  limpiarSoloCache,
  limpiarVectoresYCache,
  procesarTodosLosDocumentos,
  eliminarTodosLosDocumentos,
  type Documento
} from '@/services/backendService'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const authStore = useAuthStore()

// ── Estado general ────────────────────────────────────────────────────────────
const documentos      = ref<Documento[]>([])
const cargando        = ref(true)
const procesandoGlobal = ref(false)

// ── Modal subir documento ─────────────────────────────────────────────────────
const modalSubirAbierto   = ref(false)
const fileInput           = ref<HTMLInputElement | null>(null)
const archivoSeleccionado = ref<File | null>(null)
const subiendo            = ref(false)
const mensajeModalSubir   = ref<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

// ── Modal confirmación genérico (caché / vectores / sincronizar) ──────────────
type AccionGlobal = 'cache' | 'vectores' | 'sincronizar' | 'formatear'

const modalConfirm = reactive({
  show:           false,
  accion:         '' as AccionGlobal,
  titulo:         '',
  mensaje:        '',
  textoConfirmar: '',
  destructivo:    false,
})

// ── Modal eliminar documento individual ──────────────────────────────────────
const modalEliminarDoc = reactive({
  show:    false,
  loading: false,
  doc:     null as Documento | null,
})

// ── Modal especial: formatear sistema con contraseña ─────────────────────────
const modalFormatear = reactive({
  show:        false,
  loading:     false,
  password:    '',
  verPassword: false,
})

// ─────────────────────────────────────────────────────────────────────────────
// CARGA DE DATOS
// ─────────────────────────────────────────────────────────────────────────────

onMounted(cargarDocumentos)

async function cargarDocumentos() {
  cargando.value = true
  try {
    documentos.value = await obtenerDocumentos()
  } catch {
    toast.error('No se pudo cargar la lista de documentos.')
  } finally {
    cargando.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCIONES GLOBALES — apertura de modales
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG_MODALES: Record<Exclude<AccionGlobal, 'formatear'>, {
  titulo: string
  mensaje: string
  textoConfirmar: string
  destructivo: boolean
}> = {
  cache: {
    titulo:         'Limpiar Caché',
    mensaje:        'Se eliminará el caché semántico temporal.\n\nEl asistente procesará cada pregunta nueva desde cero hasta que el caché se regenere de forma automática. Los documentos y vectores no se ven afectados.',
    textoConfirmar: 'Limpiar Caché',
    destructivo:    false,
  },
  vectores: {
    titulo:         'Reiniciar Vectores',
    mensaje:        'Se eliminarán todos los vectores de ChromaDB y el caché semántico.\n\nEl asistente quedará sin base de conocimiento hasta que uses "Sincronizar Conocimiento". Los archivos físicos no se eliminan.',
    textoConfirmar: 'Reiniciar Vectores',
    destructivo:    true,
  },
  sincronizar: {
    titulo:         'Sincronizar Conocimiento',
    mensaje:        'Se reiniciarán los vectores y el caché, y luego se reprocesarán todos los documentos físicos existentes.\n\nEsta operación puede tardar varios minutos dependiendo de la cantidad de archivos.',
    textoConfirmar: 'Sincronizar',
    destructivo:    false,
  },
}

function pedirConfirmacion(accion: AccionGlobal) {
  if (accion === 'formatear') {
    modalFormatear.show        = true
    modalFormatear.password    = ''
    modalFormatear.verPassword = false
    return
  }
  const cfg = CONFIG_MODALES[accion]
  modalConfirm.accion         = accion
  modalConfirm.titulo         = cfg.titulo
  modalConfirm.mensaje        = cfg.mensaje
  modalConfirm.textoConfirmar = cfg.textoConfirmar
  modalConfirm.destructivo    = cfg.destructivo
  modalConfirm.show           = true
}

function cerrarModalConfirm() {
  if (!procesandoGlobal.value) modalConfirm.show = false
}

// ─────────────────────────────────────────────────────────────────────────────
// EJECUTAR ACCIÓN CONFIRMADA (caché / vectores / sincronizar)
// ─────────────────────────────────────────────────────────────────────────────

async function ejecutarAccionConfirmada() {
  procesandoGlobal.value = true
  try {
    if (modalConfirm.accion === 'cache') {
      const res = await limpiarSoloCache()
      toast.success(res.mensaje)
    } else if (modalConfirm.accion === 'vectores') {
      const res = await limpiarVectoresYCache()
      toast.success(res.mensaje)
    } else if (modalConfirm.accion === 'sincronizar') {
      const res = await procesarTodosLosDocumentos()
      toast.success(res.mensaje)
      await cargarDocumentos()
    }
    modalConfirm.show = false
  } catch (e: any) {
    toast.error(e.message ?? 'Ocurrió un error inesperado.')
  } finally {
    procesandoGlobal.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATEAR SISTEMA — verificación de contraseña en el backend
// ─────────────────────────────────────────────────────────────────────────────

function cerrarModalFormatear() {
  if (!modalFormatear.loading) {
    modalFormatear.show     = false
    modalFormatear.password = ''
  }
}

async function ejecutarFormatear() {
  if (!modalFormatear.password.trim()) return

  modalFormatear.loading = true
  try {
    // Verificamos la contraseña haciendo login real al backend
    const verificacion = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        username: authStore.username,
        password: modalFormatear.password,
      }),
    })

    if (!verificacion.ok) {
      // Contraseña incorrecta → toast de error, limpiamos el campo
      toast.error('Contraseña incorrecta. La operación fue cancelada.')
      modalFormatear.password = ''
      return
    }

    // Contraseña correcta → ejecutamos el formateo
    const res = await eliminarTodosLosDocumentos()
    toast.success(res.mensaje)
    await cargarDocumentos()
    modalFormatear.show = false

  } catch {
    toast.error('Error de conexión al verificar la contraseña.')
  } finally {
    modalFormatear.loading  = false
    modalFormatear.password = ''
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ELIMINAR DOCUMENTO INDIVIDUAL
// ─────────────────────────────────────────────────────────────────────────────

function confirmarEliminarDoc(doc: Documento) {
  modalEliminarDoc.doc  = doc
  modalEliminarDoc.show = true
}

async function ejecutarEliminarDoc() {
  if (!modalEliminarDoc.doc) return
  modalEliminarDoc.loading = true
  try {
    await eliminarDocumento(modalEliminarDoc.doc.id)
    toast.success(`Documento '${modalEliminarDoc.doc.nombre_archivo}' eliminado correctamente.`)
    await cargarDocumentos()
    modalEliminarDoc.show = false
  } catch (e: any) {
    toast.error(e.message ?? 'Error al eliminar el documento.')
  } finally {
    modalEliminarDoc.loading = false
    modalEliminarDoc.doc     = null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBIR DOCUMENTO
// ─────────────────────────────────────────────────────────────────────────────

function abrirModal() {
  modalSubirAbierto.value   = true
  archivoSeleccionado.value = null
  mensajeModalSubir.value   = null
}

function cerrarModalSubir() {
  if (subiendo.value) return
  modalSubirAbierto.value = false
}

function abrirSelectorArchivos() {
  fileInput.value?.click()
}

function manejarArchivo(e: Event) {
  const input = e.target as HTMLInputElement
  const file  = input.files?.[0] ?? null
  if (file && file.size > LIMITE_TAMANO_BYTES) {
    mensajeModalSubir.value   = { tipo: 'error', texto: `El archivo supera el límite de ${LIMITE_TAMANO_MB} MB.` }
    archivoSeleccionado.value = null
    return
  }
  archivoSeleccionado.value = file
  mensajeModalSubir.value   = null
}

async function confirmarSubida() {
  if (!archivoSeleccionado.value) return
  subiendo.value          = true
  mensajeModalSubir.value = null
  try {
    await subirDocumento(archivoSeleccionado.value)
    mensajeModalSubir.value = { tipo: 'ok', texto: '¡Documento subido y procesado correctamente!' }
    toast.success(`'${archivoSeleccionado.value.name}' procesado correctamente.`)
    await cargarDocumentos()
    setTimeout(cerrarModalSubir, 1500)
  } catch (e: any) {
    mensajeModalSubir.value = { tipo: 'error', texto: e.message ?? 'Error al subir el archivo.' }
    toast.error(e.message ?? 'Error al subir el archivo.')
  } finally {
    subiendo.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DESCARGAR DOCUMENTO
// ─────────────────────────────────────────────────────────────────────────────

async function descargar(doc: Documento) {
  try {
    await descargarDocumento(doc.id, doc.nombre_archivo)
    toast.success(`Descargando '${doc.nombre_archivo}'...`)
  } catch (e: any) {
    toast.error(e.message ?? 'Error al descargar el archivo.')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatearFecha(fechaStr: string) {
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(fechaStr))
}

function getIconoExtension(nombre: string) {
  const ext = nombre.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':  return 'mdi:file-pdf-box'
    case 'docx': return 'mdi:file-word-box'
    case 'txt':  return 'mdi:file-document-outline'
    case 'md':   return 'mdi:language-markdown'
    default:     return 'mdi:file-outline'
  }
}
</script>

<style scoped>
.animate-pop-in {
  animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes popIn {
  0%   { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1);   opacity: 1; }
}
</style>