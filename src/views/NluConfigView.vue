<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col gap-6 max-w-5xl mx-auto">

      <div>
        <h1 class="text-2xl font-bold text-white">Control de Intención NLU</h1>
        <p class="text-gray-400 text-sm mt-1">
          Configura las palabras clave y mensajes del sistema para la detección de intenciones.
        </p>
      </div>

      <div v-if="cargando" class="flex flex-col items-center justify-center py-16 gap-3">
        <Icon icon="mdi:loading" class="animate-spin text-5xl text-blue-500" />
        <p class="text-gray-400 text-sm">Cargando configuración NLU...</p>
      </div>

      <div v-else-if="errorCarga" class="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start gap-3">
        <Icon icon="mdi:alert-circle-outline" class="text-red-400 text-xl shrink-0 mt-0.5" />
        <div>
          <p class="text-red-300 text-sm font-semibold">No se pudo cargar la configuración NLU</p>
          <p class="text-red-400/80 text-xs mt-1">{{ errorCarga }}</p>
          <button @click="cargar" class="mt-3 text-xs text-red-400 hover:text-red-300 underline">
            Reintentar
          </button>
        </div>
      </div>

      <template v-else-if="form">

        <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:tag-multiple-outline" class="text-blue-400 text-xl" />
            <h2 class="text-white font-semibold">Palabras clave por intención</h2>
          </div>
          <NluTagListEditor
            v-model="form.palabras_saludo"
            label="Saludos"
            descripcion="El asistente responderá con el mensaje de saludo cuando detecte estas palabras."
          />
          <NluTagListEditor
            v-model="form.frases_despedida"
            label="Despedidas"
            descripcion="Frases que activan la respuesta de despedida."
          />
          <NluTagListEditor
            v-model="form.frases_agradecimiento"
            label="Agradecimientos"
            descripcion="Frases que activan la respuesta de agradecimiento."
          />
        </div>

        <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:format-list-bulleted" class="text-yellow-400 text-xl" />
            <h2 class="text-white font-semibold">Palabras de lista larga</h2>
          </div>
          <NluTagListEditor
            v-model="form.palabras_lista_larga"
            label="Frases de lista larga"
            descripcion="Cuando el usuario incluye estas frases, el sistema recupera más fragmentos del conocimiento para dar respuestas más completas."
          />
        </div>

        <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:cancel" class="text-red-400 text-xl" />
            <h2 class="text-white font-semibold">Frases de rechazo</h2>
          </div>
          <NluTagListEditor
            v-model="form.frases_rechazo"
            label="Frases de rechazo"
            descripcion="El evaluador usa estas frases para detectar si el asistente no encontró información. No incluir 'mi base de datos'."
          />
        </div>

        <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:message-text-outline" class="text-green-400 text-xl" />
            <h2 class="text-white font-semibold">Mensajes del sistema</h2>
          </div>
          <NluMensajeEditor
            v-model="form.mensaje_saludo"
            label="Mensaje de saludo"
            placeholder="¡Hola! ..."
            :defaultValue="defaults?.mensaje_saludo"
          />
          <NluMensajeEditor
            v-model="form.mensaje_despedida"
            label="Mensaje de despedida"
            placeholder="¡Hasta luego! ..."
            :defaultValue="defaults?.mensaje_despedida"
          />
          <NluMensajeEditor
            v-model="form.mensaje_agradecimiento"
            label="Mensaje de agradecimiento"
            placeholder="Con gusto. ..."
            :defaultValue="defaults?.mensaje_agradecimiento"
          />
          <NluMensajeEditor
            v-model="form.mensaje_fuera_de_tema"
            label="Mensaje fuera de tema"
            placeholder="Solo puedo ayudarte con..."
            :defaultValue="defaults?.mensaje_fuera_de_tema"
          />
          <NluMensajeEditor
            v-model="form.mensaje_sin_resultados"
            label="Mensaje sin resultados"
            placeholder="No encontré información..."
            :defaultValue="defaults?.mensaje_sin_resultados"
          />
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 pb-4">
          <button
            @click="confirmarReset = true"
            :disabled="guardando || reseteando"
            class="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 text-sm font-semibold rounded-lg transition-colors"
          >
            <Icon icon="mdi:restore" class="text-lg" />
            Restablecer valores por defecto
          </button>

          <button
            @click="guardar"
            :disabled="guardando || reseteando"
            class="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all"
          >
            <Icon v-if="guardando" icon="mdi:loading" class="animate-spin text-lg" />
            <Icon v-else icon="mdi:content-save-outline" class="text-lg" />
            {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>

      </template>

    </div>

    <div
      v-if="confirmarReset"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="confirmarReset = false"
    >
      <div class="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div class="flex items-center gap-3 mb-4">
          <Icon icon="mdi:restore" class="text-amber-400 text-2xl" />
          <h3 class="text-white font-semibold">Restablecer valores por defecto</h3>
        </div>
        <p class="text-gray-400 text-sm mb-6 leading-relaxed">
          Se restaurarán <strong class="text-white">todos</strong> los valores de intención NLU a sus valores originales.
        </p>
        <div class="flex gap-3">
          <button
            @click="confirmarReset = false"
            :disabled="reseteando"
            class="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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
  cargando.value  = true
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
</script>
