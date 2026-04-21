<!-- src/components/config/TabRagParams.vue -->
<template>
  <div>

    <div class="mb-6">
      <h2 class="text-base font-semibold text-white">Parámetros RAG Esenciales</h2>
      <p class="text-gray-400 text-sm mt-1">
        Solo los 4 parámetros que realmente afectan la calidad del retrieval. El resto se maneja automáticamente con valores optimizados.
      </p>
    </div>

    <div v-if="cargando" class="flex justify-center py-16">
      <Icon icon="mdi:loading" class="animate-spin text-5xl text-blue-500" />
    </div>

    <div v-else-if="errorCarga" class="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start gap-3">
      <Icon icon="mdi:alert-circle-outline" class="text-red-400 text-xl shrink-0 mt-0.5" />
      <div>
        <p class="text-red-300 text-sm font-semibold">No se pudieron cargar los parámetros</p>
        <p class="text-red-400/80 text-xs mt-1">{{ errorCarga }}</p>
        <button @click="cargar" class="mt-3 text-xs text-red-400 hover:text-red-300 underline">
          Reintentar
        </button>
      </div>
    </div>

    <div v-else-if="datosListos" class="flex flex-col gap-5">

      <div
        v-if="advertencias.length"
        class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"
      >
        <Icon icon="mdi:alert-outline" class="text-amber-400 text-xl shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-amber-300 text-sm font-semibold mb-1">Acción requerida</p>
          <p v-for="(adv, i) in advertencias" :key="i" class="text-amber-400/80 text-xs leading-relaxed">
            {{ adv }}
          </p>
        </div>
        <button @click="advertencias = []" class="text-amber-500/50 hover:text-amber-400 shrink-0">
          <Icon icon="mdi:close" />
        </button>
      </div>

      <div
        v-if="accionesLimpieza.length"
        class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3"
      >
        <Icon icon="mdi:broom" class="text-blue-400 text-lg shrink-0 mt-0.5" />
        <div>
          <p class="text-blue-300 text-xs font-semibold mb-1">Limpieza automática ejecutada</p>
          <ul class="space-y-0.5">
            <li v-for="(acc, i) in accionesLimpieza" :key="i" class="text-blue-400/70 text-xs flex items-center gap-1.5">
              <Icon icon="mdi:check" class="text-blue-500 shrink-0" />
              {{ acc }}
            </li>
          </ul>
        </div>
      </div>

      <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div class="px-5 py-3.5 border-b border-gray-700 flex items-center gap-2.5 bg-blue-500/5">
          <div class="w-2 h-2 rounded-full bg-blue-400 shrink-0"></div>
          <span class="text-xs font-bold text-blue-300 uppercase tracking-wider">Parámetros Esenciales</span>
          <span class="text-xs text-gray-500 ml-1">— los únicos que afectan significativamente la calidad RAG</span>
        </div>

        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">

          <RagParamInput
            v-if="form && limites && defaults"
            param-key="umbral_relevancia_local"
            label="Umbral de Relevancia Local"
            descripcion="Puntuación mínima de similitud (0–1) que debe tener un fragmento para pasar al contexto del LLM en modo local (sentence-transformers produce scores en el rango 0–1). Recomendado: 0.15–0.25."
            recomendado="0.15–0.25. Subir si el sistema mezcla información incorrecta."
            :min="limites.umbral_relevancia_local.min"
            :max="limites.umbral_relevancia_local.max"
            tipo-campo="float"
            :valor-default="defaults.umbral_relevancia_local"
            v-model="form.umbral_relevancia_local"
            @validation-error="registrarError('umbral_relevancia_local', $event)"
          />

          <RagParamInput
            v-if="form && limites && defaults"
            param-key="rag_k_local"
            label="Fragmentos a Recuperar (Local)"
            descripcion="Número de fragmentos candidatos que se recuperan por búsqueda en modo local antes de aplicar el filtro de umbral. Más fragmentos = mayor cobertura, pero mayor latencia."
            recomendado="8–12. Subir si hay preguntas que no encuentran respuesta."
            :min="limites.rag_k_local.min"
            :max="limites.rag_k_local.max"
            tipo-campo="int"
            :valor-default="defaults.rag_k_local"
            v-model="form.rag_k_local"
            @validation-error="registrarError('rag_k_local', $event)"
          />

        </div>
      </div>

      <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-white font-semibold flex items-center gap-2">
              <Icon icon="mdi:text-box-edit-outline" class="text-green-400" />
              Prompt Principal
            </h3>
            <p class="text-gray-400 text-sm mt-1">
              Instrucción principal que recibe el LLM junto con el contexto recuperado y la pregunta.
              Debe incluir los placeholders
              <code class="bg-gray-700 px-1 rounded text-green-300">{contexto}</code> y
              <code class="bg-gray-700 px-1 rounded text-green-300">{pregunta}</code>.
            </p>
          </div>
          <span
            :class="[
              'shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border',
              estadoPrompt === 'personalizado'
                ? 'bg-violet-900/30 border-violet-600/50 text-violet-300'
                : 'bg-gray-700/50 border-gray-600 text-gray-400',
            ]"
          >
            {{ estadoPrompt === 'personalizado' ? 'Personalizado' : 'Por defecto' }}
          </span>
        </div>

        <textarea
          v-model="promptPrincipal"
          rows="10"
          :placeholder="placeholderPrompt"
          class="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 text-sm
                 font-mono leading-relaxed resize-y focus:outline-none focus:border-green-500
                 placeholder:text-gray-600 transition-colors"
        />

        <div class="flex items-center justify-between">
          <p class="text-gray-500 text-xs">
            {{ promptPrincipal.length }} caracteres
            <span v-if="promptPrincipal.length > 0 && promptPrincipal.length < 50" class="text-amber-400 ml-1">
              — mínimo 50 caracteres
            </span>
          </p>
          <div class="flex gap-2">
            <button
              v-if="estadoPrompt === 'personalizado'"
              @click="resetearPrompt"
              :disabled="guardandoPrompt"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     text-gray-400 hover:text-white hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              <Icon icon="mdi:restore" />
              Restaurar defecto
            </button>
            <button
              @click="guardarPrompt"
              :disabled="guardandoPrompt || !puedoGuardarPrompt"
              class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold
                     bg-green-600 hover:bg-green-500 text-white transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon v-if="guardandoPrompt" icon="mdi:loading" class="animate-spin" />
              <Icon v-else icon="mdi:content-save-outline" />
              Guardar Prompt
            </button>
          </div>
        </div>
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
          :disabled="guardando || reseteando || hayErrores"
          class="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all"
        >
          <Icon v-if="guardando" icon="mdi:loading" class="animate-spin text-lg" />
          <Icon v-else icon="mdi:content-save-outline" class="text-lg" />
          {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
        </button>

      </div>

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
          Se restaurarán <strong class="text-white">todos</strong> los parámetros RAG a sus valores originales.
          El sistema ejecutará la limpieza automática de caché que corresponda.
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
import { ref, computed, onMounted } from 'vue'

import { toast } from 'vue3-toastify'
import {
  obtenerRagParams,
  actualizarRagParams,
  resetearRagParams,
  actualizarPrompts,
  type RagParams,
  type ParamLimit,
} from '@/services/backendService'
import RagParamInput from '@/components/config/RagParamInput.vue'

const cargando      = ref(true)
const guardando     = ref(false)
const reseteando    = ref(false)
const confirmarReset = ref(false)
const errorCarga    = ref('')

const form     = ref<RagParams | null>(null)
const defaults = ref<RagParams | null>(null)
const limites  = ref<Record<keyof RagParams, ParamLimit> | null>(null)

const advertencias    = ref<string[]>([])
const accionesLimpieza = ref<string[]>([])

const guardandoPrompt = ref(false)
const promptPrincipal = ref('')
const defaultPrompt   = ref('')
const placeholderPrompt = 'Escribe aquí el prompt principal…'

const erroresValidacion = ref<Record<string, boolean>>({})

const datosListos = computed(() =>
  !!form.value && !!limites.value && !!defaults.value
)

const hayErrores = computed(() =>
  Object.values(erroresValidacion.value).some(Boolean)
)

const estadoPrompt = computed<'defecto' | 'personalizado'>(() =>
  promptPrincipal.value.trim() !== defaultPrompt.value.trim() ? 'personalizado' : 'defecto'
)

const puedoGuardarPrompt = computed(() => {
  const t = promptPrincipal.value.trim()
  if (t.length === 0) return true 
  return t.length >= 50 && t.includes('{contexto}') && t.includes('{pregunta}')
})

async function cargar() {
  cargando.value  = true
  errorCarga.value = ''
  try {
    const res = await obtenerRagParams()
    form.value     = { ...res.parametros_actuales }
    defaults.value = { ...res.defaults }
    limites.value  = res.limites
    defaultPrompt.value   = res.prompts_default_texto?.prompt_principal ?? ''
    promptPrincipal.value = res.parametros_actuales.prompt_principal ?? defaultPrompt.value
  } catch (e: any) {
    errorCarga.value = e.message || 'Error desconocido al conectar con el servidor.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

function registrarError(campo: string, tieneError: boolean) {
  erroresValidacion.value[campo] = tieneError
}

async function guardar() {
  if (!form.value) return
  if (hayErrores.value) {
    toast.error('Corrige los errores de validación antes de guardar.')
    return
  }

  guardando.value = true
  advertencias.value = []
  accionesLimpieza.value = []

  try {
    const res = await actualizarRagParams(form.value)
    form.value = { ...res.parametros_actuales }

    if (res.advertencias?.length) {
      advertencias.value = res.advertencias
    }
    if (res.acciones_limpieza?.length) {
      accionesLimpieza.value = res.acciones_limpieza
    }

    const cambiados = res.params_cambiados?.length ?? 0
    if (cambiados > 0) {
      toast.success(`${cambiados} parámetro(s) actualizado(s) correctamente.`)
    } else {
      toast.info('No se detectaron cambios respecto a los valores actuales.')
    }
  } catch (e: any) {
    toast.error(e.message || 'Error al guardar los parámetros RAG.')
  } finally {
    guardando.value = false
  }
}

async function resetear() {
  reseteando.value = true
  advertencias.value = []
  accionesLimpieza.value = []

  try {
    const res = await resetearRagParams()
    form.value     = { ...res.parametros_actuales }
    defaults.value = { ...res.defaults }
    confirmarReset.value = false
    erroresValidacion.value = {}

    if (res.advertencias?.length) {
      advertencias.value = res.advertencias
    }
    if (res.acciones_limpieza?.length) {
      accionesLimpieza.value = res.acciones_limpieza
    }

    toast.success('Parámetros restaurados a valores por defecto.')
  } catch (e: any) {
    toast.error(e.message || 'Error al restaurar los parámetros RAG.')
  } finally {
    reseteando.value = false
  }
}

async function guardarPrompt() {
  if (!puedoGuardarPrompt.value) return
  
  guardandoPrompt.value = true
  try {
    const res = await actualizarPrompts({ prompt_principal: promptPrincipal.value })
    promptPrincipal.value = res.parametros_actuales.prompt_principal ?? defaultPrompt.value
    toast.success('Prompt guardado correctamente.')
  } catch (e: any) {
    toast.error(e.message ?? 'Error al guardar el prompt.')
  } finally {
    guardandoPrompt.value = false
  }
}

async function resetearPrompt() {
  guardandoPrompt.value = true
  try {
    await actualizarPrompts({ prompt_principal: '' })
    promptPrincipal.value = defaultPrompt.value
    toast.success('Prompt restaurado al valor por defecto.')
  } catch (e: any) {
    toast.error(e.message ?? 'Error al restaurar el prompt.')
  } finally {
    guardandoPrompt.value = false
  }
}
</script>