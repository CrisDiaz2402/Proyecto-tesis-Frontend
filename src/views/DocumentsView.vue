<template>
  <div class="p-8">

    <!-- ── CABECERA ──────────────────────────────────────────────────────── -->
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
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors shadow-lg',
            documentos.length >= MAX_DOCUMENTOS
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
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

    <!-- ── PANEL DE ADMINISTRACIÓN GLOBAL ────────────────────────────────── -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-8 shadow-lg">
      <div class="px-6 py-4 border-b border-gray-700 flex flex-wrap justify-between items-center gap-3 bg-gray-800/80">
        <h2 class="text-sm font-semibold text-white flex items-center gap-2">
          <Icon icon="mdi:shield-alert-outline" class="text-orange-400 text-lg" />
          Administración Global del Sistema RAG
        </h2>

        <!-- Selector de ecosistema objetivo (3 opciones) -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400 uppercase tracking-wider font-semibold">Ecosistema:</span>
          <div class="flex bg-gray-900 border border-gray-700 rounded-lg p-1 gap-0.5">
            <button
              @click="motorGlobal = 'local'"
              :class="['px-3 py-1 text-xs font-bold rounded transition-colors', motorGlobal === 'local' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white']"
            >🖥️ Local</button>
            <button
              @click="motorGlobal = 'cloud'"
              :class="['px-3 py-1 text-xs font-bold rounded transition-colors', motorGlobal === 'cloud' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-white']"
            >☁️ Nube</button>
            <button
              @click="motorGlobal = 'all'"
              :class="['px-3 py-1 text-xs font-bold rounded transition-colors', motorGlobal === 'all' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white']"
            >🔁 Ambos</button>
          </div>
        </div>
      </div>

      <div class="p-6 flex flex-wrap gap-4 items-center bg-gray-800/30">

        <!-- Limpiar Caché -->
        <button
          @click="pedirConfirmacion('cache')"
          :disabled="procesandoGlobal"
          class="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-500 border border-yellow-600/50 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:broom" />
          Limpiar Caché
          <span class="text-yellow-400/70 text-xs">({{ motorGlobal === 'all' ? 'll + lc + cc' : motorGlobal === 'local' ? 'll + lc' : 'cc' }})</span>
        </button>

        <!-- Reiniciar Vectores -->
        <button
          @click="pedirConfirmacion('vectores')"
          :disabled="procesandoGlobal"
          class="flex items-center gap-2 px-4 py-2 bg-orange-600/20 hover:bg-orange-600/40 text-orange-500 border border-orange-600/50 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:database-remove-outline" />
          Reiniciar Vectores
          <span class="text-orange-400/70 text-xs">({{ motorGlobal === 'all' ? 'Local + Nube' : motorGlobal === 'local' ? 'Local' : 'Nube' }})</span>
        </button>

        <!-- Sincronizar -->
        <button
          @click="pedirConfirmacion('sincronizar')"
          :disabled="procesandoGlobal || motorGlobal === 'all'"
          :title="motorGlobal === 'all' ? 'Selecciona Local o Nube para sincronizar' : ''"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/50 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:sync" :class="{ 'animate-spin': procesandoGlobal }" />
          Sincronizar
          <span class="text-blue-400/70 text-xs">({{ motorGlobal === 'local' ? 'Local' : motorGlobal === 'cloud' ? 'Nube' : '—' }})</span>
        </button>

        <div class="flex-1"></div>

        <!-- Formatear TODO -->
        <button
          @click="pedirConfirmacion('formatear')"
          :disabled="procesandoGlobal"
          class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:delete-alert" />
          Formatear TODO el Sistema
        </button>

      </div>
    </div>

    <!-- ── TABLA DE DOCUMENTOS ────────────────────────────────────────────── -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
      <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
        <Icon icon="mdi:file-document-multiple-outline" class="text-blue-400 text-lg" />
        <h2 class="text-sm font-semibold text-white">Base de Conocimiento</h2>
        <span class="ml-auto px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded border border-gray-600">
          {{ documentos.length }} / {{ MAX_DOCUMENTOS }} archivo(s)
        </span>
      </div>

      <div v-if="cargando" class="p-12 flex justify-center items-center">
        <Icon icon="mdi:loading" class="animate-spin text-4xl text-blue-500" />
      </div>

      <div v-else-if="documentos.length === 0" class="p-12 text-center">
        <Icon icon="mdi:file-hidden" class="text-6xl text-gray-600 mx-auto mb-4" />
        <p class="text-gray-400">No hay documentos en el sistema.</p>
        <p class="text-gray-500 text-sm mt-1">Sube archivos PDF, Word, TXT o Markdown para empezar.</p>
      </div>

      <table v-else class="w-full text-left text-sm text-gray-300">
        <thead class="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
          <tr>
            <th class="px-6 py-4 font-medium">Archivo</th>
            <th class="px-6 py-4 font-medium">Subido por</th>
            <th class="px-6 py-4 font-medium">Estado en Ecosistemas</th>
            <th class="px-6 py-4 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-700">
          <tr v-for="doc in documentos" :key="doc.id" class="hover:bg-gray-750 transition-colors group">
            <td class="px-6 py-4 font-medium text-white flex items-center gap-3">
              <Icon :icon="getIconoExtension(doc.nombre_archivo)" class="text-xl text-gray-400" />
              <div class="flex flex-col">
                <span>{{ doc.nombre_archivo }}</span>
                <span class="text-[10px] text-gray-500">{{ formatearFecha(doc.fecha_subida) }}</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-300">
                  {{ doc.subido_por.charAt(0).toUpperCase() }}
                </div>
                {{ doc.subido_por }}
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-col gap-1.5">
                <span v-if="doc.procesado_local" class="px-2 py-1 bg-blue-900/30 text-blue-400 text-[10px] uppercase font-bold rounded border border-blue-800 w-fit flex items-center gap-1">
                  🖥️ {{ doc.estado_local }}
                </span>
                <span v-else class="px-2 py-1 bg-gray-700 text-gray-500 text-[10px] uppercase font-bold rounded border border-gray-600 w-fit flex items-center gap-1">
                  🖥️ No en Local
                </span>
                <span v-if="doc.procesado_cloud" class="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-[10px] uppercase font-bold rounded border border-emerald-800 w-fit flex items-center gap-1">
                  ☁️ {{ doc.estado_cloud }}
                </span>
                <span v-else class="px-2 py-1 bg-gray-700 text-gray-500 text-[10px] uppercase font-bold rounded border border-gray-600 w-fit flex items-center gap-1">
                  ☁️ No en Nube
                </span>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-3">
                <button v-if="doc.procesado_local" @click="descargar(doc, 'local')" class="text-blue-400 hover:text-blue-300 transition-colors" title="Descargar de Local">
                  <Icon icon="mdi:monitor-arrow-down" class="text-xl" />
                </button>
                <button v-if="doc.procesado_cloud" @click="descargar(doc, 'cloud')" class="text-emerald-400 hover:text-emerald-300 transition-colors" title="Descargar de Nube">
                  <Icon icon="mdi:cloud-download-outline" class="text-xl" />
                </button>

                <div class="w-px h-5 bg-gray-600 mx-1"></div>

                <button @click="abrirModalEliminarDoc(doc)" class="text-red-400 hover:text-red-300 transition-colors" title="Eliminar documento">
                  <Icon icon="mdi:trash-can-outline" class="text-xl" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── MODAL SUBIR DOCUMENTO ──────────────────────────────────────────── -->
    <div v-if="modalSubirAbierto" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl relative animate-pop-in">
        <button @click="cerrarModalSubir" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <Icon icon="mdi:close" class="text-xl" />
        </button>

        <h3 class="text-xl font-bold text-white mb-1">Subir Documento</h3>
        <p class="text-gray-400 text-sm mb-5">Añade información a la base de conocimiento.</p>

        <div class="mb-5 bg-gray-900 border border-gray-700 rounded-lg p-1 flex">
          <button
            @click="motorSubida = 'local'"
            :class="['flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors', motorSubida === 'local' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300']"
          >🖥️ Destino Local</button>
          <button
            @click="motorSubida = 'cloud'"
            :class="['flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors', motorSubida === 'cloud' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-300']"
          >☁️ Destino Nube</button>
        </div>

        <div
          class="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center bg-gray-900/50 hover:bg-gray-900 hover:border-gray-500 transition-colors cursor-pointer mb-5"
          @click="abrirSelectorArchivos"
        >
          <input type="file" ref="fileInput" class="hidden" :accept="EXTENSIONES_PERMITIDAS.join(',')" @change="manejarArchivo">
          <div v-if="!archivoSeleccionado">
            <Icon :icon="motorSubida === 'cloud' ? 'mdi:cloud-upload-outline' : 'mdi:upload-network-outline'" :class="['text-4xl mx-auto mb-3', motorSubida === 'cloud' ? 'text-emerald-500' : 'text-blue-500']" />
            <p class="text-white font-medium">Haz clic para buscar</p>
            <p class="text-gray-500 text-xs mt-1">Formatos admitidos (Max. {{ LIMITE_TAMANO_MB }}MB)</p>
          </div>
          <div v-else class="flex flex-col items-center gap-2">
            <Icon icon="mdi:file-check" class="text-4xl text-green-500" />
            <p class="text-white font-medium truncate w-full px-4">{{ archivoSeleccionado.name }}</p>
            <p class="text-gray-400 text-xs">{{ (archivoSeleccionado.size / 1024 / 1024).toFixed(2) }} MB</p>
          </div>
        </div>

        <div v-if="mensajeModalSubir" :class="[
          'p-4 rounded-lg text-sm mb-5 flex items-start gap-3',
          mensajeModalSubir.tipo === 'error' ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-green-900/30 text-green-400 border border-green-800'
        ]">
          <Icon :icon="mensajeModalSubir.tipo === 'error' ? 'mdi:alert-circle' : 'mdi:check-circle'" class="text-xl shrink-0" />
          <p>{{ mensajeModalSubir.texto }}</p>
        </div>

        <div class="flex justify-end gap-3">
          <button @click="cerrarModalSubir" class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancelar</button>
          <button
            @click="confirmarSubida"
            :disabled="!archivoSeleccionado || subiendo || mensajeModalSubir?.tipo === 'error'"
            :class="['flex items-center gap-2 px-6 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed', motorSubida === 'cloud' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500']"
          >
            <Icon v-if="subiendo" icon="mdi:loading" class="animate-spin text-lg" />
            {{ subiendo ? 'Vectorizando...' : `Procesar en ${motorSubida === 'local' ? 'Local' : 'Nube'}` }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── MODAL ELIMINAR DOCUMENTO INDIVIDUAL ────────────────────────────── -->
    <div v-if="modalEliminarDoc.show" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-gray-800 border border-red-700/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-pop-in">
        <h3 class="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Icon icon="mdi:alert-circle-outline" class="text-red-500 text-xl" /> Eliminar Documento
        </h3>

        <p class="text-gray-400 text-sm mb-4">
          Selecciona de qué ecosistema deseas eliminar <strong class="text-white">{{ modalEliminarDoc.doc?.nombre_archivo }}</strong>:
        </p>

        <!-- Info sobre implicaciones del borrado -->
        <div class="bg-gray-900/60 border border-gray-700 rounded-lg p-3 mb-4 text-xs text-gray-400 space-y-1">
          <p class="text-gray-300 font-semibold mb-1">⚠️ Al eliminar de un ecosistema se borra:</p>
          <p>• El archivo físico de esa carpeta</p>
          <p>• Los vectores de ChromaDB de ese motor</p>
          <p>• El caché asociado (todas las combis del motor)</p>
          <p v-if="modalEliminarDoc.doc?.procesado_local && modalEliminarDoc.doc?.procesado_cloud" class="text-yellow-400 mt-1">
            ✔ Si eliminas de ambos, se borra el registro completo de la BD.
          </p>
        </div>

        <div class="space-y-3 mb-6">
          <label
            v-if="modalEliminarDoc.doc?.procesado_local"
            class="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer hover:border-red-500 transition-colors"
            :class="{ 'border-red-500 bg-red-900/10': eliminarOpciones.local }"
          >
            <input type="checkbox" v-model="eliminarOpciones.local" class="w-4 h-4 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-600 focus:ring-2">
            <span class="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Icon icon="mdi:monitor-off" class="text-blue-400"/>
              Eliminar de Local (Ollama)
            </span>
            <span class="ml-auto text-[10px] text-blue-400/70">cache_ll + cache_lc</span>
          </label>

          <label
            v-if="modalEliminarDoc.doc?.procesado_cloud"
            class="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer hover:border-red-500 transition-colors"
            :class="{ 'border-red-500 bg-red-900/10': eliminarOpciones.cloud }"
          >
            <input type="checkbox" v-model="eliminarOpciones.cloud" class="w-4 h-4 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-600 focus:ring-2">
            <span class="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Icon icon="mdi:cloud-off-outline" class="text-emerald-400"/>
              Eliminar de Nube (Gemini)
            </span>
            <span class="ml-auto text-[10px] text-emerald-400/70">cache_cc</span>
          </label>

          <!-- Si solo existe en uno, muestra mensaje informativo -->
          <div
            v-if="!modalEliminarDoc.doc?.procesado_local && modalEliminarDoc.doc?.procesado_cloud"
            class="p-3 bg-blue-900/20 border border-blue-700/40 rounded-lg text-xs text-blue-300"
          >
            🖥️ Este documento no existe en el ecosistema Local.
          </div>
          <div
            v-if="modalEliminarDoc.doc?.procesado_local && !modalEliminarDoc.doc?.procesado_cloud"
            class="p-3 bg-emerald-900/20 border border-emerald-700/40 rounded-lg text-xs text-emerald-300"
          >
            ☁️ Este documento no existe en el ecosistema Nube.
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="cerrarModalEliminarDoc"
            :disabled="modalEliminarDoc.loading"
            class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >Cancelar</button>
          <button
            @click="ejecutarEliminarDoc"
            :disabled="(!eliminarOpciones.local && !eliminarOpciones.cloud) || modalEliminarDoc.loading"
            class="flex-1 flex justify-center items-center gap-2 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon v-if="modalEliminarDoc.loading" icon="mdi:loading" class="animate-spin text-lg" />
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- ── MODAL CONFIRMACIÓN GENÉRICO (caché / vectores / sincronizar) ───── -->
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

    <!-- ── MODAL FORMATEAR SISTEMA ────────────────────────────────────────── -->
    <div v-if="modalFormatear.show" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] px-4" @click.self="cerrarModalFormatear">
      <div class="bg-gray-800 border border-red-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-pop-in">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
            <Icon icon="mdi:delete-alert" class="text-red-500 text-xl" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">Formatear Sistema</h3>
            <p class="text-red-400 text-xs font-medium">Acción irreversible en AMBOS ecosistemas</p>
          </div>
          <button @click="cerrarModalFormatear" :disabled="modalFormatear.loading" class="ml-auto text-gray-500 hover:text-gray-300">
            <Icon icon="mdi:close" class="text-xl" />
          </button>
        </div>
        <div class="bg-red-900/20 border border-red-800/50 rounded-xl p-4 mb-5">
          <p class="text-red-300 text-xs font-semibold uppercase tracking-wider mb-2">Se eliminará permanentemente:</p>
          <ul class="space-y-1.5">
            <li class="flex items-center gap-2 text-gray-300 text-sm"><Icon icon="mdi:circle-small" class="text-red-500" /> Todos los documentos de Nube y Local</li>
            <li class="flex items-center gap-2 text-gray-300 text-sm"><Icon icon="mdi:circle-small" class="text-red-500" /> Vectores de ChromaDB (Local + Nube)</li>
            <li class="flex items-center gap-2 text-gray-300 text-sm"><Icon icon="mdi:circle-small" class="text-red-500" /> Caché semántico completo (ll + lc + cc)</li>
          </ul>
        </div>
        <div class="mb-5">
          <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirma tu contraseña</label>
          <div class="relative">
            <Icon icon="mdi:lock-alert-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
            <input
              v-model="modalFormatear.password"
              :type="modalFormatear.verPassword ? 'text' : 'password'"
              :disabled="modalFormatear.loading"
              placeholder="Contraseña de admin"
              @keyup.enter="ejecutarFormatear"
              class="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button type="button" @click="modalFormatear.verPassword = !modalFormatear.verPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <Icon :icon="modalFormatear.verPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="text-lg" />
            </button>
          </div>
        </div>
        <div class="flex gap-3">
          <button @click="cerrarModalFormatear" :disabled="modalFormatear.loading" class="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold rounded-lg">Cancelar</button>
          <button
            @click="ejecutarFormatear"
            :disabled="!modalFormatear.password.trim() || modalFormatear.loading"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg disabled:opacity-40"
          >
            <Icon v-if="modalFormatear.loading" icon="mdi:loading" class="animate-spin text-lg" />
            <Icon v-else icon="mdi:delete-forever" class="text-lg" />
            {{ modalFormatear.loading ? 'Formateando...' : 'Formatear' }}
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
  obtenerDocumentos, subirDocumento, eliminarDocumento, descargarDocumento,
  limpiarSoloCache, limpiarVectoresYCache, procesarTodosLosDocumentos,
  eliminarTodosLosDocumentos,
  type Documento, type MotorTipo, type MotorScope,
} from '@/services/backendService'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const authStore = useAuthStore()

// ── Estado general ────────────────────────────────────────────────────────────
const documentos       = ref<Documento[]>([])
const cargando         = ref(true)
const procesandoGlobal = ref(false)

// ── Selectores de Motor ───────────────────────────────────────────────────────
// motorGlobal: para acciones globales (cache/vectores) — puede ser 'local' | 'cloud' | 'all'
// motorSubida: para subir documentos — solo 'local' | 'cloud'
const motorGlobal = ref<MotorScope>('local')
const motorSubida = ref<MotorTipo>('local')

// ── Modal subir documento ─────────────────────────────────────────────────────
const modalSubirAbierto   = ref(false)
const fileInput           = ref<HTMLInputElement | null>(null)
const archivoSeleccionado = ref<File | null>(null)
const subiendo            = ref(false)
const mensajeModalSubir   = ref<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

// ── Modal confirmación genérico ───────────────────────────────────────────────
type AccionGlobal = 'cache' | 'vectores' | 'sincronizar' | 'formatear'
const modalConfirm = reactive({
  show: false, accion: '' as AccionGlobal, titulo: '', mensaje: '', textoConfirmar: '', destructivo: false,
})

// ── Modal eliminar documento individual ──────────────────────────────────────
const modalEliminarDoc = reactive({
  show: false, loading: false, doc: null as Documento | null,
})
const eliminarOpciones = reactive({ local: false, cloud: false })

// ── Modal Formatear ───────────────────────────────────────────────────────────
const modalFormatear = reactive({
  show: false, loading: false, password: '', verPassword: false,
})

// ── CARGA DE DATOS ────────────────────────────────────────────────────────────
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

// ── HELPERS DE ETIQUETAS ──────────────────────────────────────────────────────
function etiquetaMotor(m: MotorScope): string {
  return { local: 'Local', cloud: 'Nube', all: 'Local + Nube' }[m] ?? m
}

function detalleCacheMotor(m: MotorScope): string {
  return {
    local: 'cache_ll (local:local) y cache_lc (local:cloud)',
    cloud: 'cache_cc (cloud:cloud)',
    all:   'cache_ll, cache_lc y cache_cc (todos los cachés)',
  }[m] ?? m
}

// ── ACCIONES GLOBALES ─────────────────────────────────────────────────────────
function pedirConfirmacion(accion: AccionGlobal) {
  if (accion === 'formatear') {
    modalFormatear.show       = true
    modalFormatear.password   = ''
    modalFormatear.verPassword = false
    return
  }

  // Sincronizar no soporta "all" — requiere elegir un motor concreto
  if (accion === 'sincronizar' && motorGlobal.value === 'all') {
    toast.warning('Selecciona "Local" o "Nube" para sincronizar. No puedes sincronizar ambos a la vez.')
    return
  }

  const motor = motorGlobal.value
  const etiqueta = etiquetaMotor(motor)

  const config = {
    cache: {
      titulo:          `Limpiar Caché — ${etiqueta}`,
      mensaje:
        `Se eliminará el caché semántico de: ${detalleCacheMotor(motor)}.\n\n` +
        `Los documentos físicos y los vectores de ChromaDB NO se ven afectados.`,
      textoConfirmar:  'Limpiar Caché',
      destructivo:     false,
    },
    vectores: {
      titulo:          `Reiniciar Vectores — ${etiqueta}`,
      mensaje:
        `Se eliminarán los vectores de ChromaDB y el caché de [${etiqueta}].\n\n` +
        `Los documentos físicos NO se borran, pero el asistente quedará sin base de conocimiento ` +
        `en este motor hasta que uses "Sincronizar".\n\n` +
        `⚠️ El estado de los documentos en BD se actualizará a "No subido".`,
      textoConfirmar:  'Reiniciar Vectores',
      destructivo:     true,
    },
    sincronizar: {
      titulo:          `Sincronizar Conocimiento — ${etiqueta}`,
      mensaje:
        `Se re-vectorizarán todos los documentos físicos del ecosistema ${etiqueta}.\n\n` +
        `Los vectores anteriores se borrarán primero para evitar duplicados.`,
      textoConfirmar:  'Sincronizar',
      destructivo:     false,
    },
  }[accion]

  modalConfirm.accion         = accion
  modalConfirm.titulo         = config.titulo
  modalConfirm.mensaje        = config.mensaje
  modalConfirm.textoConfirmar = config.textoConfirmar
  modalConfirm.destructivo    = config.destructivo
  modalConfirm.show           = true
}

function cerrarModalConfirm() {
  if (!procesandoGlobal.value) modalConfirm.show = false
}

async function ejecutarAccionConfirmada() {
  procesandoGlobal.value = true
  try {
    const motor = motorGlobal.value

    if (modalConfirm.accion === 'cache') {
      // motor puede ser 'local' | 'cloud' | 'all' — el backend sabe qué cachés borrar
      const res = await limpiarSoloCache(motor)
      toast.success(res.mensaje)

    } else if (modalConfirm.accion === 'vectores') {
      // motor puede ser 'local' | 'cloud' | 'all'
      // El backend actualiza la BD, así que recargamos documentos
      const res = await limpiarVectoresYCache(motor)
      toast.success(res.mensaje)
      await cargarDocumentos()

    } else if (modalConfirm.accion === 'sincronizar') {
      // sincronizar solo acepta 'local' | 'cloud'
      const res = await procesarTodosLosDocumentos(motor as MotorTipo)
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

// ── FORMATEAR SISTEMA ─────────────────────────────────────────────────────────
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
    // Verificar contraseña antes de formatear
    const verificacion = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username: authStore.username, password: modalFormatear.password }),
    })
    if (!verificacion.ok) {
      toast.error('Contraseña incorrecta. Operación cancelada.')
      modalFormatear.password = ''
      return
    }
    const res = await eliminarTodosLosDocumentos()
    toast.success(res.mensaje)
    await cargarDocumentos()
    modalFormatear.show = false
  } catch {
    toast.error('Error de conexión.')
  } finally {
    modalFormatear.loading  = false
    modalFormatear.password = ''
  }
}

// ── ELIMINAR DOCUMENTO INDIVIDUAL ─────────────────────────────────────────────
function abrirModalEliminarDoc(doc: Documento) {
  modalEliminarDoc.doc    = doc
  eliminarOpciones.local  = false
  eliminarOpciones.cloud  = false
  // Pre-seleccionar automáticamente si solo existe en un ecosistema
  if (doc.procesado_local  && !doc.procesado_cloud) eliminarOpciones.local = true
  if (doc.procesado_cloud  && !doc.procesado_local) eliminarOpciones.cloud = true
  modalEliminarDoc.show   = true
}

function cerrarModalEliminarDoc() {
  if (!modalEliminarDoc.loading) modalEliminarDoc.show = false
}

async function ejecutarEliminarDoc() {
  if (!modalEliminarDoc.doc) return
  modalEliminarDoc.loading = true
  try {
    // Ejecutar las eliminaciones en secuencia según lo que seleccionó el usuario.
    // Cada llamada al backend borra: archivo físico + vectores de la colección
    // + caché en todos los modos que usan ese motor_vectores.
    if (eliminarOpciones.local) {
      await eliminarDocumento(modalEliminarDoc.doc.id, 'local')
    }
    if (eliminarOpciones.cloud) {
      await eliminarDocumento(modalEliminarDoc.doc.id, 'cloud')
    }

    const partes: string[] = []
    if (eliminarOpciones.local) partes.push('Local')
    if (eliminarOpciones.cloud) partes.push('Nube')
    toast.success(`Eliminación completada en: ${partes.join(' + ')}.`)

    await cargarDocumentos()
    modalEliminarDoc.show = false
  } catch (e: any) {
    toast.error(e.message ?? 'Error al eliminar el documento.')
  } finally {
    modalEliminarDoc.loading = false
  }
}

// ── SUBIR DOCUMENTO ───────────────────────────────────────────────────────────
function abrirModal() {
  modalSubirAbierto.value   = true
  archivoSeleccionado.value = null
  mensajeModalSubir.value   = null
}
function cerrarModalSubir() {
  if (!subiendo.value) modalSubirAbierto.value = false
}
function abrirSelectorArchivos() { fileInput.value?.click() }
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
  subiendo.value        = true
  mensajeModalSubir.value = null
  try {
    await subirDocumento(archivoSeleccionado.value, motorSubida.value)
    mensajeModalSubir.value = { tipo: 'ok', texto: `¡Procesado exitosamente en ${motorSubida.value.toUpperCase()}!` }
    toast.success(`Subido a ${motorSubida.value.toUpperCase()}`)
    await cargarDocumentos()
    setTimeout(cerrarModalSubir, 1500)
  } catch (e: any) {
    mensajeModalSubir.value = { tipo: 'error', texto: e.message ?? 'Error al subir el archivo.' }
    toast.error(e.message ?? 'Error al subir el archivo.')
  } finally {
    subiendo.value = false
  }
}

// ── DESCARGAR DOCUMENTO ───────────────────────────────────────────────────────
async function descargar(doc: Documento, motor: MotorTipo) {
  try {
    await descargarDocumento(doc.id, doc.nombre_archivo, motor)
    toast.success(`Descargando versión ${motor.toUpperCase()}...`)
  } catch (e: any) {
    toast.error(e.message ?? `Error al descargar de ${motor}.`)
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatearFecha(fechaStr: string) {
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fechaStr))
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