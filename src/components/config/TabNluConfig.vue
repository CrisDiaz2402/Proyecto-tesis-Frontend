<template>
  <div>

    <div v-if="cargando" class="flex flex-col items-center justify-center py-24 gap-3">
      <Icon icon="mdi:loading" class="animate-spin text-5xl text-blue-500" />
      <p class="text-gray-500 text-sm">Cargando configuración NLU...</p>
    </div>

    <div
      v-else-if="errorCarga"
      class="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3 max-w-xl"
    >
      <Icon icon="mdi:alert-circle-outline" class="text-red-500 text-xl shrink-0 mt-0.5" />
      <div>
        <p class="text-red-700 text-sm font-semibold">No se pudo cargar la configuración NLU</p>
        <p class="text-red-500 text-xs mt-1">{{ errorCarga }}</p>
        <button @click="cargar" class="mt-3 text-xs text-red-600 hover:text-red-700 font-medium underline underline-offset-2">
          Reintentar
        </button>
      </div>
    </div>

    <div
      v-else-if="!form"
      class="flex flex-col items-center justify-center py-24 gap-4 text-center"
    >
      <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon icon="mdi:tag-off-outline" class="text-3xl text-gray-400" />
      </div>
      <div>
        <p class="text-gray-700 font-semibold">Sin configuración disponible</p>
        <p class="text-gray-400 text-sm mt-1">No se encontraron intenciones NLU configuradas en el sistema.</p>
      </div>
      <button
        @click="cargar"
        class="mt-1 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <Icon icon="mdi:refresh" class="text-base" />
        Recargar
      </button>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        <div class="flex flex-col gap-5">

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <div class="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Icon icon="mdi:tag-multiple-outline" class="text-blue-600 text-sm" />
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Palabras clave</p>
                <p class="text-sm font-semibold text-gray-800 leading-tight">Intenciones principales</p>
              </div>
            </div>
            <div class="p-5 space-y-5">
              <NluTagListEditor
                v-model="form.palabras_saludo"
                label="Saludos"
                descripcion="El asistente responderá con el mensaje de saludo cuando detecte estas palabras."
              />
              <div class="border-t border-gray-100" />
              <NluTagListEditor
                v-model="form.frases_despedida"
                label="Despedidas"
                descripcion="Frases que activan la respuesta de despedida."
              />
              <div class="border-t border-gray-100" />
              <NluTagListEditor
                v-model="form.frases_agradecimiento"
                label="Agradecimientos"
                descripcion="Frases que activan la respuesta de agradecimiento."
              />
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <div class="w-7 h-7 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                <Icon icon="mdi:format-list-bulleted" class="text-yellow-600 text-sm" />
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recuperación extendida</p>
                <p class="text-sm font-semibold text-gray-800 leading-tight">Palabras de lista larga</p>
              </div>
            </div>
            <div class="p-5">
              <NluTagListEditor
                v-model="form.palabras_lista_larga"
                label="Frases de lista larga"
                descripcion="Cuando el usuario incluye estas frases, el sistema recupera más fragmentos del conocimiento para dar respuestas más completas."
              />
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <div class="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <Icon icon="mdi:cancel" class="text-red-500 text-sm" />
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Evaluador</p>
                <p class="text-sm font-semibold text-gray-800 leading-tight">Frases de rechazo</p>
              </div>
            </div>
            <div class="p-5">
              <NluTagListEditor
                v-model="form.frases_rechazo"
                label="Frases de rechazo"
                descripcion="El evaluador usa estas frases para detectar si el asistente no encontró información. No incluir 'mi base de datos'."
              />
            </div>
          </div>

        </div>

        <div class="flex flex-col gap-5">

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <div class="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Icon icon="mdi:message-text-outline" class="text-green-600 text-sm" />
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Respuestas automáticas</p>
                <p class="text-sm font-semibold text-gray-800 leading-tight">Mensajes del sistema</p>
              </div>
            </div>
            <div class="p-5 space-y-5">
              <NluMensajeEditor
                v-model="form.mensaje_saludo"
                label="Mensaje de saludo"
                placeholder="¡Hola! ..."
                :defaultValue="defaults?.mensaje_saludo"
              />
              <div class="border-t border-gray-100" />
              <NluMensajeEditor
                v-model="form.mensaje_despedida"
                label="Mensaje de despedida"
                placeholder="¡Hasta luego! ..."
                :defaultValue="defaults?.mensaje_despedida"
              />
              <div class="border-t border-gray-100" />
              <NluMensajeEditor
                v-model="form.mensaje_agradecimiento"
                label="Mensaje de agradecimiento"
                placeholder="Con gusto. ..."
                :defaultValue="defaults?.mensaje_agradecimiento"
              />
              <div class="border-t border-gray-100" />
              <NluMensajeEditor
                v-model="form.mensaje_fuera_de_tema"
                label="Mensaje fuera de tema"
                placeholder="Solo puedo ayudarte con..."
                :defaultValue="defaults?.mensaje_fuera_de_tema"
              />
              <div class="border-t border-gray-100" />
              <NluMensajeEditor
                v-model="form.mensaje_sin_resultados"
                label="Mensaje sin resultados"
                placeholder="No encontré información..."
                :defaultValue="defaults?.mensaje_sin_resultados"
              />
            </div>
          </div>

          <p class="text-xs text-gray-400 text-right px-1">
            Usa el botón <span class="font-semibold text-gray-500">Guardar</span> de arriba para confirmar todas las ediciones.
          </p>

        </div>
      </div>
    </template>

    <div
      v-if="confirmarReset"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="confirmarReset = false"
    >
      <div class="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Icon icon="mdi:restore" class="text-amber-600 text-lg" />
          </div>
          <h3 class="text-gray-800 font-semibold">Restablecer</h3>
        </div>
        <p class="text-gray-500 text-sm mb-6 leading-relaxed">
          Se restaurarán <strong class="text-gray-800">todos</strong> los valores de intención NLU a sus valores originales. Esta acción no se puede deshacer.
        </p>
        <div class="flex gap-3">
          <button
            @click="confirmarReset = false"
            :disabled="reseteando"
            class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            @click="resetear"
            :disabled="reseteando"
            class="flex-1 flex justify-center items-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <Icon v-if="reseteando" icon="mdi:loading" class="animate-spin" />
            {{ reseteando ? 'Restaurando...' : 'Restablecer' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import { toast } from 'vue3-toastify'
import {
  obtenerNluConfig,
  actualizarNluConfig,
  resetearNluConfig,
  obtenerNluDefaults,
  type NluConfig,
} from '@/services/backendService'
import NluTagListEditor from '@/components/nlu/NluTagListEditor.vue'
import NluMensajeEditor from '@/components/nlu/NluMensajeEditor.vue'

const cargando       = ref(true)
const guardando      = ref(false)
const reseteando     = ref(false)
const confirmarReset = ref(false)
const errorCarga     = ref('')

const form     = ref<NluConfig | null>(null)
const defaults = ref<NluConfig | null>(null)
const original = ref<NluConfig | null>(null)

async function cargar() {
  cargando.value   = true
  errorCarga.value = ''
  try {
    const [config, defDefaults] = await Promise.all([
      obtenerNluConfig(),
      obtenerNluDefaults(),
    ])
    form.value     = { ...config }
    original.value = { ...config }
    defaults.value = { ...defDefaults }
  } catch (e: any) {
    errorCarga.value = e.message || 'Error desconocido al conectar con el servidor.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

function contarCambios(): number {
  if (!form.value || !original.value) return 0
  const keys: (keyof NluConfig)[] = [
    'palabras_saludo', 'frases_despedida', 'frases_agradecimiento',
    'palabras_lista_larga', 'frases_rechazo',
    'mensaje_saludo', 'mensaje_despedida', 'mensaje_agradecimiento',
    'mensaje_fuera_de_tema', 'mensaje_sin_resultados',
  ]
  let count = 0
  for (const k of keys) {
    const a = form.value[k]
    const b = original.value[k]
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length || a.some((v, i) => v !== b[i])) count++
    } else if (a !== b) {
      count++
    }
  }
  return count
}

async function guardar() {
  if (!form.value) return
  guardando.value = true
  try {
    const cambios = contarCambios()
    const res = await actualizarNluConfig(form.value)
    form.value     = { ...res }
    original.value = { ...res }

    if (cambios > 0) {
      toast.success(`${cambios} campo(s) actualizado(s) correctamente.`)
    } else {
      toast.info('No se detectaron cambios respecto a los valores actuales.')
    }
  } catch (e: any) {
    toast.error(e.message || 'Error al guardar la configuración NLU.')
  } finally {
    guardando.value = false
  }
}

async function resetear() {
  reseteando.value = true
  try {
    const res = await resetearNluConfig()
    form.value           = { ...res }
    original.value       = { ...res }
    confirmarReset.value = false
    toast.success('Configuración NLU restaurada a valores por defecto.')
  } catch (e: any) {
    toast.error(e.message || 'Error al restaurar la configuración NLU.')
  } finally {
    reseteando.value = false
  }
}

defineExpose({ guardar, guardando, reseteando, confirmarReset, cargando, errorCarga, form })
</script>
