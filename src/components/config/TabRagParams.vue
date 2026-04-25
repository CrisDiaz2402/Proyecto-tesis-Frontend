<template>
  <div>

    <div class="mb-6">
      <h2 class="text-base font-semibold text-gray-800">Parámetros de Búsqueda</h2>
      <p class="text-gray-500 text-sm mt-1">
        Solo los 4 parámetros que realmente afectan la calidad de la búsqueda. El resto se maneja automáticamente con valores optimizados.
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

      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div class="px-5 py-3.5 border-b border-gray-200 flex items-center gap-2.5 bg-blue-50">
          <div class="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
          <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">Parámetros Esenciales</span>
          <span class="text-xs text-gray-500 ml-1">— los únicos que afectan significativamente la calidad de búsqueda</span>
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

      <div class="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-gray-800 font-semibold flex items-center gap-2">
              <Icon icon="mdi:text-box-edit-outline" class="text-green-500" />
              Prompt Principal
            </h3>
            <p class="text-gray-500 text-sm mt-1">
              Instrucción principal que recibe el LLM junto con el contexto recuperado y la pregunta.
              Debe incluir los placeholders
              <code class="bg-gray-100 px-1 rounded text-green-700">{contexto}</code> y
              <code class="bg-gray-100 px-1 rounded text-green-700">{pregunta}</code>.
            </p>
          </div>
          <span
            :class="[
              'shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border',
              estadoPrompt === 'personalizado'
                ? 'bg-violet-50 border-violet-300 text-violet-700'
                : 'bg-gray-100 border-gray-200 text-gray-500',
            ]"
          >
            {{ estadoPrompt === 'personalizado' ? 'Personalizado' : 'Por defecto' }}
          </span>
        </div>

        <textarea
          v-model="promptPrincipal"
          rows="10"
          :placeholder="placeholderPrompt"
          :maxlength="promptLimites?.max_chars ?? 3100"
          @input="limitarEntrada"
          class="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 text-sm
                 font-mono leading-relaxed resize-y focus:outline-none focus:border-green-500
                 placeholder:text-gray-400 transition-colors"
          :class="{ 'border-red-400 focus:border-red-400': charCount > 0 && !promptValido }"
        />

        <div class="mt-2 space-y-1">
          <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-200"
              :class="colorBarra"
              :style="{ width: porcentajeUso + '%' }"
            />
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span
                v-if="charsRestantes < 200 && charsRestantes > 0 && charCount > 0"
                class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300"
              >
                <Icon icon="mdi:alert-outline" class="text-sm" />
                Quedan {{ charsRestantes }} caracteres
              </span>
              <span
                v-else-if="charsRestantes <= 0"
                class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300"
              >
                <Icon icon="mdi:block-helper" class="text-sm" />
                Límite alcanzado
              </span>
            </div>
            <p class="text-gray-400 text-xs text-right">
              {{ charCount }} / {{ promptLimites?.max_chars ?? 3100 }} caracteres
            </p>
          </div>
          <p v-if="mensajeValidacionPrompt" class="flex items-center gap-1 text-xs text-red-500">
            <Icon icon="mdi:alert-circle" class="shrink-0" />
            {{ mensajeValidacionPrompt }}
          </p>
        </div>

        <div v-if="promptLimites?.suffix_fijo" class="mt-3 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
          <div class="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
            <Icon icon="mdi:code-braces" class="text-gray-400 text-sm" />
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sufijo automático (no editable)</span>
            <span class="ml-auto text-xs text-gray-400">{{ promptLimites.suffix_fijo_chars }} caracteres</span>
          </div>
          <pre class="px-3 py-2.5 text-xs text-gray-400 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{{ promptLimites.suffix_fijo }}</pre>
        </div>

        <p class="flex items-start gap-1.5 text-xs text-gray-400 mt-2">
          <Icon icon="mdi:information-outline" class="shrink-0 mt-0.5" />
          <span>
            El límite es de <strong class="text-gray-500">{{ promptLimites?.max_chars ?? 3100 }} caracteres</strong>.
            El modelo tiene un contexto máximo de {{ promptLimites?.max_tokens_modelo ?? 2048 }} tokens,
            de los cuales 512 se reservan para la respuesta y ~630 para el contexto RAG recuperado.
          </span>
        </p>

        <div class="flex items-center justify-end mt-2">
          <span
            v-if="promptCambiado"
            class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-700"
          >
            <span class="text-amber-500">•</span>
            Cambios sin guardar
          </span>
          <span
            v-else-if="estadoPrompt === 'personalizado'"
            class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 border border-green-300 text-green-700"
          >
            <Icon icon="mdi:check" class="text-sm" />
            Guardado
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-500"
          >
            Por defecto
          </span>
        </div>
      </div>

    </div>

    <div
      v-if="confirmarReset"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="confirmarReset = false"
    >
      <div class="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div class="flex items-center gap-3 mb-4">
          <Icon icon="mdi:restore" class="text-amber-500 text-2xl" />
          <h3 class="text-gray-800 font-semibold">Restablecer</h3>
        </div>
        <p class="text-gray-500 text-sm mb-6 leading-relaxed">
          Se restaurarán <strong class="text-gray-800">todos</strong> los parámetros de búsqueda a sus valores originales.
          El sistema ejecutará la limpieza automática de caché que corresponda.
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
import { ref, computed, onMounted } from 'vue'

import { toast } from 'vue3-toastify'
import {
  obtenerRagParams,
  actualizarRagParams,
  resetearRagParams,
  type RagParams,
  type ParamLimit,
  type PromptLimites,
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

const originalForm    = ref<RagParams | null>(null)
const originalPrompt  = ref('')
const promptPrincipal = ref('')
const defaultPrompt   = ref('')
const placeholderPrompt = 'Escribe aquí el prompt principal…'
const promptLimites   = ref<PromptLimites | null>(null)

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

const charCount = computed(() => promptPrincipal.value.length)
const charsRestantes = computed(() => (promptLimites.value?.max_chars ?? 3100) - charCount.value)
const porcentajeUso = computed(() => Math.min(100, (charCount.value / (promptLimites.value?.max_chars ?? 3100)) * 100))

const promptValido = computed(() => {
  const len = charCount.value
  if (len === 0) return true
  const min = promptLimites.value?.min_chars ?? 50
  const max = promptLimites.value?.max_chars ?? 3100
  return len >= min && len <= max
})

const mensajeValidacionPrompt = computed(() => {
  const len = charCount.value
  if (len === 0) return ''
  const min = promptLimites.value?.min_chars ?? 50
  const max = promptLimites.value?.max_chars ?? 3100
  if (len < min) return `Mínimo ${min} caracteres (faltan ${min - len})`
  if (len > max) return `Límite superado: máximo ${max} caracteres. El modelo no puede procesar prompts más largos.`
  return ''
})

const colorBarra = computed(() => {
  const pct = porcentajeUso.value
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 85) return 'bg-amber-500'
  if (pct >= 70) return 'bg-yellow-400'
  return 'bg-green-500'
})

const parametrosCambiados = computed(() => {
  if (!form.value || !originalForm.value) return false
  return form.value.umbral_relevancia_local !== originalForm.value.umbral_relevancia_local ||
         form.value.rag_k_local !== originalForm.value.rag_k_local
})

const promptCambiado = computed(() =>
  promptPrincipal.value.trim() !== originalPrompt.value.trim()
)

const hayCambios = computed(() => parametrosCambiados.value || promptCambiado.value)

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
    promptLimites.value   = res.prompt_limites ?? null
    originalForm.value    = { ...res.parametros_actuales }
    originalPrompt.value  = res.parametros_actuales.prompt_principal ?? defaultPrompt.value
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

async function guardarTodo() {
  if (!form.value) return
  if (hayErrores.value) {
    toast.error('Corrige los errores de validación antes de guardar.')
    return
  }
  if (promptCambiado.value && !promptValido.value && promptPrincipal.value.trim().length > 0) {
    toast.error('El prompt no cumple con los requisitos de longitud.')
    return
  }

  guardando.value = true
  advertencias.value = []
  accionesLimpieza.value = []

  try {
    const payload: any = {}

    if (parametrosCambiados.value) {
      payload.umbral_relevancia_local = form.value.umbral_relevancia_local
      payload.rag_k_local = form.value.rag_k_local
    }

    if (promptCambiado.value) {
      payload.prompt_principal = promptPrincipal.value
    }

    const res = await actualizarRagParams(payload)

    form.value = { ...res.parametros_actuales }
    originalForm.value = { ...res.parametros_actuales }
    const promptActualizado = (res.parametros_actuales as any).prompt_principal
    promptPrincipal.value = promptActualizado ?? promptPrincipal.value
    originalPrompt.value = promptPrincipal.value

    if (res.advertencias?.length) advertencias.value = res.advertencias
    if (res.acciones_limpieza?.length) accionesLimpieza.value = res.acciones_limpieza

    const cambiados = res.params_cambiados?.length ?? 0
    if (cambiados > 0) {
      toast.success(`${cambiados} cambio(s) guardado(s) correctamente.`)
    } else {
      toast.info('No se detectaron cambios respecto a los valores actuales.')
    }
  } catch (e: any) {
    toast.error(e.message || 'Error al guardar.')
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
    originalForm.value = { ...res.parametros_actuales }
    defaults.value = { ...res.defaults }
    confirmarReset.value = false
    erroresValidacion.value = {}
    promptPrincipal.value = defaultPrompt.value
    originalPrompt.value  = defaultPrompt.value

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

function limitarEntrada(event: Event) {
  const max = promptLimites.value?.max_chars ?? 3100
  const el = event.target as HTMLTextAreaElement
  if (el.value.length > max) {
    el.value = el.value.slice(0, max)
    promptPrincipal.value = el.value
  }
}

defineExpose({ guardarTodo, guardando, reseteando, hayErrores, hayCambios, confirmarReset, cargando })
</script>