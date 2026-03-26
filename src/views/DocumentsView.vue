<template>
  <div class="p-8">

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

    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-8">
      <div class="px-6 py-4 border-b border-gray-700">
        <h2 class="text-sm font-semibold text-white flex items-center gap-2">
          <Icon icon="mdi:shield-alert-outline" class="text-orange-400 text-lg" />
          Administración Global del Sistema RAG
        </h2>
      </div>
      <div class="p-6 flex flex-wrap gap-4 items-center bg-gray-800/50">
        <button 
          @click="handleLimpiarCache" 
          :disabled="procesandoGlobal"
          class="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-500 border border-yellow-600/50 rounded-lg text-sm transition-colors"
        >
          <Icon icon="mdi:broom" />
          Limpiar Caché
        </button>

        <button 
          @click="handleLimpiarVectores" 
          :disabled="procesandoGlobal"
          class="flex items-center gap-2 px-4 py-2 bg-orange-600/20 hover:bg-orange-600/40 text-orange-500 border border-orange-600/50 rounded-lg text-sm transition-colors"
        >
          <Icon icon="mdi:database-remove-outline" />
          Reiniciar Vectores
        </button>

        <button 
          @click="handleProcesarTodos" 
          :disabled="procesandoGlobal"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/50 rounded-lg text-sm transition-colors"
        >
          <Icon icon="mdi:sync" :class="{ 'animate-spin': procesandoGlobal }" />
          Sincronizar Conocimiento
        </button>

        <div class="flex-1"></div>

        <button 
          @click="handleEliminarTodo" 
          :disabled="procesandoGlobal"
          class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-900/20 transition-colors"
        >
          <Icon icon="mdi:delete-alert" />
          Formatear Sistema (Eliminar TODO)
        </button>
      </div>
    </div>

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
                  {{ doc.subido_por.charAt(0) }}
                </div>
                {{ doc.subido_por }}
              </div>
            </td>
            <td class="px-6 py-4 text-gray-400">
              {{ formatearFecha(doc.fecha_subida) }}
            </td>
            <td class="px-6 py-4">
              <span class="px-2.5 py-1 bg-green-900/30 text-green-400 text-xs rounded-full border border-green-800 flex items-center gap-1.5 w-fit">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {{ doc.estado }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click="descargar(doc)"
                  class="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Descargar documento"
                >
                  <Icon icon="mdi:download-outline" class="text-lg" />
                </button>
                <button
                  @click="eliminar(doc)"
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

    <div v-if="modalAbierto" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl relative">
        <button @click="cerrarModal" class="absolute top-4 right-4 text-gray-400 hover:text-white">
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

        <div v-if="mensajeModal" :class="[
          'p-4 rounded-lg text-sm mb-6 flex items-start gap-3',
          mensajeModal.tipo === 'error' ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-green-900/30 text-green-400 border border-green-800'
        ]">
          <Icon :icon="mensajeModal.tipo === 'error' ? 'mdi:alert-circle' : 'mdi:check-circle'" class="text-xl shrink-0" />
          <p>{{ mensajeModal.texto }}</p>
        </div>

        <div class="flex justify-end gap-3">
          <button @click="cerrarModal" class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Cancelar
          </button>
          <button 
            @click="confirmarSubida"
            :disabled="!archivoSeleccionado || subiendo || mensajeModal?.tipo === 'error'"
            class="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Icon v-if="subiendo" icon="mdi:loading" class="animate-spin text-lg" />
            {{ subiendo ? 'Procesando...' : 'Subir y Procesar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { MAX_DOCUMENTOS, LIMITE_TAMANO_BYTES, LIMITE_TAMANO_MB, EXTENSIONES_PERMITIDAS } from '@/config/config'
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
} from '../services/backendService'

const documentos = ref<Documento[]>([])
const cargando = ref(true)
const procesandoGlobal = ref(false)

const modalAbierto = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const archivoSeleccionado = ref<File | null>(null)
const subiendo = ref(false)
const mensajeModal = ref<{tipo: 'ok'|'error', texto: string} | null>(null)

onMounted(async () => {
  await cargarDocumentos()
})

const cargarDocumentos = async () => {
  cargando.value = true
  try {
    documentos.value = await obtenerDocumentos()
  } catch (e) {
    console.error('Error cargando documentos', e)
  } finally {
    cargando.value = false
  }
}

const handleLimpiarCache = async () => {
  procesandoGlobal.value = true
  try {
    const res = await limpiarSoloCache()
    alert(`✅ ${res.mensaje}`)
  } catch (e: any) {
    alert(`❌ Error: ${e.message}`)
  } finally {
    procesandoGlobal.value = false
  }
}

const handleLimpiarVectores = async () => {
  if (!confirm('¿Estás seguro de reiniciar los vectores? Esto borrará la base de conocimiento y el caché actual.')) return
  procesandoGlobal.value = true
  try {
    const res = await limpiarVectoresYCache()
    alert(`✅ ${res.mensaje}\nRecuerda usar "Sincronizar Conocimiento" para volver a procesar los archivos.`)
  } catch (e: any) {
    alert(`❌ Error: ${e.message}`)
  } finally {
    procesandoGlobal.value = false
  }
}

const handleProcesarTodos = async () => {
  procesandoGlobal.value = true
  try {
    const res = await procesarTodosLosDocumentos()
    alert(`✅ ${res.mensaje}`)
    await cargarDocumentos()
  } catch (e: any) {
    alert(`❌ Error: ${e.message}`)
  } finally {
    procesandoGlobal.value = false
  }
}

const handleEliminarTodo = async () => {
  if (!confirm('🚨 ¡ADVERTENCIA CRÍTICA! 🚨\n\n¿Estás absolutamente seguro de querer ELIMINAR TODOS los documentos, archivos físicos, vectores y caché?\n\nEsta acción NO se puede deshacer.')) return
  if (!confirm('¿Confirmas que deseas formatear completamente la base de conocimiento?')) return

  procesandoGlobal.value = true
  try {
    const res = await eliminarTodosLosDocumentos()
    alert(`✅ ${res.mensaje}`)
    await cargarDocumentos()
  } catch (e: any) {
    alert(`❌ Error: ${e.message}`)
  } finally {
    procesandoGlobal.value = false
  }
}

const abrirModal = () => {
  if (documentos.value.length >= MAX_DOCUMENTOS) {
    alert(`Límite máximo de documentos (${MAX_DOCUMENTOS}) alcanzado.`)
    return
  }
  modalAbierto.value = true
  archivoSeleccionado.value = null
  mensajeModal.value = null
}

const cerrarModal = () => {
  if (subiendo.value) return
  modalAbierto.value = false
}

const abrirSelectorArchivos = () => {
  fileInput.value?.click()
}

const manejarArchivo = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  
  if (file) {
    if (file.size > LIMITE_TAMANO_BYTES) {
      mensajeModal.value = { tipo: 'error', texto: `El archivo supera el límite de ${LIMITE_TAMANO_MB} MB.` }
      archivoSeleccionado.value = null
      return
    }
  }
  
  archivoSeleccionado.value = file
  mensajeModal.value = null
}

const confirmarSubida = async () => {
  if (!archivoSeleccionado.value) return
  subiendo.value     = true
  mensajeModal.value = null

  try {
    await subirDocumento(archivoSeleccionado.value)
    mensajeModal.value = { tipo: 'ok', texto: '¡Documento subido y procesado correctamente!' }
    await cargarDocumentos()
    setTimeout(cerrarModal, 1500)
  } catch (e: any) {
    mensajeModal.value = { tipo: 'error', texto: e.message ?? 'Error al subir el archivo.' }
  } finally {
    subiendo.value = false
  }
}

const descargar = async (doc: Documento) => {
  try {
    await descargarDocumento(doc.id, doc.nombre_archivo)
  } catch (e: any) {
    alert(`Error al descargar: ${e.message}`)
  }
}

const eliminar = async (doc: Documento) => {
  if (!confirm(`¿Seguro que deseas eliminar el documento "${doc.nombre_archivo}" y todo su conocimiento asociado?`)) return
  try {
    await eliminarDocumento(doc.id)
    await cargarDocumentos()
  } catch (e: any) {
    alert(`Error al eliminar: ${e.message}`)
  }
}

const formatearFecha = (fechaStr: string) => {
  const f = new Date(fechaStr)
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(f)
}

const getIconoExtension = (nombre: string) => {
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