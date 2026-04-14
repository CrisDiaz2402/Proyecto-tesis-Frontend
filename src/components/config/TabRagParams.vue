<!-- src/components/config/TabRagParams.vue -->
<!--
  Sección de configuración avanzada de parámetros RAG.
  Carga valores actuales + defaults + límites desde el backend.
  Organiza los inputs en 3 grupos por nivel de impacto.
  Maneja guardado, reseteo, validación y advertencias de reindexado.
-->
<template>
  <div>

    <div class="mb-6">
      <h2 class="text-base font-semibold text-white">Parámetros RAG Avanzados</h2>
      <p class="text-gray-400 text-sm mt-1">
        Ajusta el comportamiento interno del sistema RAG. Cada cambio aplica la limpieza automática de caché y vectores que corresponda.
      </p>
    </div>

    <!-- Estado de carga -->
    <div v-if="cargando" class="flex justify-center py-16">
      <Icon icon="mdi:loading" class="animate-spin text-5xl text-blue-500" />
    </div>

    <!-- Error de carga -->
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

    <!-- Contenido principal -->
    <div v-else class="flex flex-col gap-5">

      <!-- ── Advertencia de reindexado pendiente ─────────────────────────────── -->
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

      <!-- ── Log de acciones de limpieza ────────────────────────────────────── -->
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

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!-- GRUPO 1: ALTO IMPACTO                                                 -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div class="px-5 py-3.5 border-b border-gray-700 flex items-center gap-2.5 bg-red-500/5">
          <div class="w-2 h-2 rounded-full bg-red-400 shrink-0"></div>
          <span class="text-xs font-bold text-red-300 uppercase tracking-wider">Alto Impacto</span>
          <span class="text-xs text-gray-500 ml-1">— afecta la calidad del retrieval y requiere reindexar</span>
        </div>

        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          <!-- Umbral de corte semántico -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="breakpoint_threshold_amount"
            label="Umbral de Corte Semántico"
            descripcion="Controla el tamaño de los fragmentos (chunks) al procesar documentos. Valores altos generan chunks más pequeños y precisos; valores bajos, chunks más grandes con más contexto. Recomendado: 70–80."
            recomendado="70–80. Cambiar requiere reindexar todos los documentos."
            :min="limites.breakpoint_threshold_amount.min"
            :max="limites.breakpoint_threshold_amount.max"
            tipo-campo="int"
            :valor-default="defaults.breakpoint_threshold_amount"
            v-model="form.breakpoint_threshold_amount"
            @validation-error="registrarError('breakpoint_threshold_amount', $event)"
          />

          <!-- Umbral de relevancia local -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="umbral_relevancia_local"
            label="Umbral de Relevancia Local"
            descripcion="Puntuación mínima de similitud (0–1) que debe tener un fragmento para pasar al contexto del LLM en modo local (nomic-embed-text produce scores naturalmente bajos). Recomendado: 0.15–0.25."
            recomendado="0.15–0.25. Subir si el sistema mezcla información incorrecta."
            :min="limites.umbral_relevancia_local.min"
            :max="limites.umbral_relevancia_local.max"
            tipo-campo="float"
            :valor-default="defaults.umbral_relevancia_local"
            v-model="form.umbral_relevancia_local"
            @validation-error="registrarError('umbral_relevancia_local', $event)"
          />

          <!-- Umbral de relevancia cloud -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="umbral_relevancia_cloud"
            label="Umbral de Relevancia Nube"
            descripcion="Puntuación mínima de similitud en modo cloud (Gemini Embedding produce scores más altos que nomic). Recomendado: 0.30–0.50."
            recomendado="0.30–0.50. Puede subirse con seguridad en modo cloud."
            :min="limites.umbral_relevancia_cloud.min"
            :max="limites.umbral_relevancia_cloud.max"
            tipo-campo="float"
            :valor-default="defaults.umbral_relevancia_cloud"
            v-model="form.umbral_relevancia_cloud"
            @validation-error="registrarError('umbral_relevancia_cloud', $event)"
          />

          <!-- K local -->
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

          <!-- K cloud -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="rag_k_cloud"
            label="Fragmentos a Recuperar (Nube)"
            descripcion="Número de fragmentos candidatos en modo cloud. Los chunks cloud son más grandes, por lo que se necesitan menos para cubrir el contexto necesario."
            recomendado="4–8. Los chunks cloud contienen más texto por fragmento."
            :min="limites.rag_k_cloud.min"
            :max="limites.rag_k_cloud.max"
            tipo-campo="int"
            :valor-default="defaults.rag_k_cloud"
            v-model="form.rag_k_cloud"
            @validation-error="registrarError('rag_k_cloud', $event)"
          />

        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!-- GRUPO 2: MEDIO IMPACTO                                                -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div class="px-5 py-3.5 border-b border-gray-700 flex items-center gap-2.5 bg-amber-500/5">
          <div class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
          <span class="text-xs font-bold text-amber-300 uppercase tracking-wider">Medio Impacto</span>
          <span class="text-xs text-gray-500 ml-1">— afecta tokens y caché semántico</span>
        </div>

        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          <!-- Tokens respuesta normal — local -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="num_tokens_normal_local"
            label="Tokens de Respuesta Normal (Local)"
            descripcion="Límite máximo de tokens que puede generar el LLM local en una respuesta de texto normal. Valores altos permiten respuestas más largas pero aumentan la latencia."
            recomendado="350–500. El modelo local es lento; no subir demasiado."
            :min="limites.num_tokens_normal_local.min"
            :max="limites.num_tokens_normal_local.max"
            tipo-campo="int"
            :valor-default="defaults.num_tokens_normal_local"
            v-model="form.num_tokens_normal_local"
            @validation-error="registrarError('num_tokens_normal_local', $event)"
          />

          <!-- Tokens respuesta lista — local -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="num_tokens_lista_local"
            label="Tokens de Respuesta Lista (Local)"
            descripcion="Límite de tokens cuando el sistema detecta que la respuesta requiere una lista o enumeración. Suele necesitar más espacio que una respuesta directa."
            recomendado="700–900. Las listas necesitan más tokens que el texto normal."
            :min="limites.num_tokens_lista_local.min"
            :max="limites.num_tokens_lista_local.max"
            tipo-campo="int"
            :valor-default="defaults.num_tokens_lista_local"
            v-model="form.num_tokens_lista_local"
            @validation-error="registrarError('num_tokens_lista_local', $event)"
          />

          <!-- Tokens respuesta normal — cloud -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="num_tokens_normal_cloud"
            label="Tokens de Respuesta Normal (Nube)"
            descripcion="Límite de tokens para el LLM cloud (Gemini Flash). Gemini es mucho más rápido, por lo que se pueden usar valores más altos sin penalizar la latencia."
            recomendado="600–800. Gemini Flash tolera bien valores altos."
            :min="limites.num_tokens_normal_cloud.min"
            :max="limites.num_tokens_normal_cloud.max"
            tipo-campo="int"
            :valor-default="defaults.num_tokens_normal_cloud"
            v-model="form.num_tokens_normal_cloud"
            @validation-error="registrarError('num_tokens_normal_cloud', $event)"
          />

          <!-- Tokens respuesta lista — cloud -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="num_tokens_lista_cloud"
            label="Tokens de Respuesta Lista (Nube)"
            descripcion="Límite de tokens para listas y enumeraciones en modo cloud. Gemini puede generar listas detalladas con un límite generoso."
            recomendado="1200–1500. Suficiente para listas largas de mallas curriculares."
            :min="limites.num_tokens_lista_cloud.min"
            :max="limites.num_tokens_lista_cloud.max"
            tipo-campo="int"
            :valor-default="defaults.num_tokens_lista_cloud"
            v-model="form.num_tokens_lista_cloud"
            @validation-error="registrarError('num_tokens_lista_cloud', $event)"
          />

          <!-- Sensibilidad de caché LL -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="cache_threshold_ll"
            label="Sensibilidad del Caché Local:Local"
            descripcion="Similitud semántica mínima para considerar dos preguntas como equivalentes en el caché del modo Todo Local. Valores más altos exigen mayor similitud antes de reutilizar una respuesta cacheada."
            recomendado="0.85–0.92. Equilibrio entre hits de caché y respuestas frescas."
            :min="limites.cache_threshold_ll.min"
            :max="limites.cache_threshold_ll.max"
            tipo-campo="float"
            :valor-default="defaults.cache_threshold_ll"
            v-model="form.cache_threshold_ll"
            @validation-error="registrarError('cache_threshold_ll', $event)"
          />

          <!-- Sensibilidad de caché LC -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="cache_threshold_lc"
            label="Sensibilidad del Caché Local:Nube"
            descripcion="Similitud mínima para el caché del modo Vectores Local + LLM Nube. Controla cuándo se reutiliza una respuesta anterior vs cuándo se genera una nueva."
            recomendado="0.85–0.92."
            :min="limites.cache_threshold_lc.min"
            :max="limites.cache_threshold_lc.max"
            tipo-campo="float"
            :valor-default="defaults.cache_threshold_lc"
            v-model="form.cache_threshold_lc"
            @validation-error="registrarError('cache_threshold_lc', $event)"
          />

          <!-- Sensibilidad de caché CC -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="cache_threshold_cc"
            label="Sensibilidad del Caché Nube:Nube"
            descripcion="Similitud mínima para el caché del modo Todo Nube. Gemini Embedding produce scores más altos, por lo que el umbral puede ser un poco más exigente."
            recomendado="0.88–0.95."
            :min="limites.cache_threshold_cc.min"
            :max="limites.cache_threshold_cc.max"
            tipo-campo="float"
            :valor-default="defaults.cache_threshold_cc"
            v-model="form.cache_threshold_cc"
            @validation-error="registrarError('cache_threshold_cc', $event)"
          />

          <!-- Umbral de similitud de caché -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="umbral_similitud"
            label="Umbral Mínimo de Similitud del Caché"
            descripcion="Distancia coseno mínima para que una entrada del caché sea siquiera considerada como candidata. Filtra ruido antes de aplicar el umbral principal."
            recomendado="0.05–0.10. Mantener bajo para no excluir candidatos válidos."
            :min="limites.umbral_similitud.min"
            :max="limites.umbral_similitud.max"
            tipo-campo="float"
            :valor-default="defaults.umbral_similitud"
            v-model="form.umbral_similitud"
            @validation-error="registrarError('umbral_similitud', $event)"
          />

        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!-- GRUPO 3: BAJO IMPACTO                                                 -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div class="px-5 py-3.5 border-b border-gray-700 flex items-center gap-2.5 bg-green-500/5">
          <div class="w-2 h-2 rounded-full bg-green-400 shrink-0"></div>
          <span class="text-xs font-bold text-green-300 uppercase tracking-wider">Bajo Impacto</span>
          <span class="text-xs text-gray-500 ml-1">— ajuste fino del LLM local y caché RAM</span>
        </div>

        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          <!-- Penalización de repetición -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="repeat_penalty"
            label="Penalización de Repetición (Local)"
            descripcion="Penaliza al LLM local por repetir las mismas frases o tokens. Valores más altos reducen los bucles de texto. Solo afecta al modo local (Llama 3.1)."
            recomendado="1.2–1.4. Valores muy altos pueden producir respuestas incoherentes."
            :min="limites.repeat_penalty.min"
            :max="limites.repeat_penalty.max"
            tipo-campo="float"
            :valor-default="defaults.repeat_penalty"
            v-model="form.repeat_penalty"
            @validation-error="registrarError('repeat_penalty', $event)"
          />

          <!-- Top-K LLM -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="top_k_llm"
            label="Top-K del LLM Local"
            descripcion="Restringe la generación de texto a los K tokens más probables en cada paso. Valores bajos generan texto más predecible; valores altos, más variado."
            recomendado="10–20. El valor por defecto (10) es conservador y estable."
            :min="limites.top_k_llm.min"
            :max="limites.top_k_llm.max"
            tipo-campo="int"
            :valor-default="defaults.top_k_llm"
            v-model="form.top_k_llm"
            @validation-error="registrarError('top_k_llm', $event)"
          />

          <!-- Top-P LLM -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="top_p_llm"
            label="Top-P del LLM Local (Nucleus Sampling)"
            descripcion="Selecciona tokens hasta cubrir la probabilidad acumulada P. Trabaja junto con Top-K. Valores bajos = texto más enfocado; valores altos = más diversidad."
            recomendado="0.5–0.7. Mantener bajo para respuestas factuales estables."
            :min="limites.top_p_llm.min"
            :max="limites.top_p_llm.max"
            tipo-campo="float"
            :valor-default="defaults.top_p_llm"
            v-model="form.top_p_llm"
            @validation-error="registrarError('top_p_llm', $event)"
          />

          <!-- HyDE tokens -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="hyde_num_predict"
            label="Tokens para HyDE (Local)"
            descripcion="Cuántos tokens genera el LLM para crear la 'respuesta hipotética' que mejora la búsqueda semántica (HyDE). Solo aplica en modos con vectores locales."
            recomendado="60–120. Suficiente para una oración descriptiva sin exceso de latencia."
            :min="limites.hyde_num_predict.min"
            :max="limites.hyde_num_predict.max"
            tipo-campo="int"
            :valor-default="defaults.hyde_num_predict"
            v-model="form.hyde_num_predict"
            @validation-error="registrarError('hyde_num_predict', $event)"
          />

          <!-- Tamaño caché L1 -->
          <RagParamInput
            v-if="form && limites && defaults"
            param-key="max_l1_entries"
            label="Tamaño del Caché RAM (L1)"
            descripcion="Número máximo de respuestas almacenadas en memoria RAM (caché L1). Es el caché más rápido pero se pierde al reiniciar el servidor. Se autogestiona (FIFO)."
            recomendado="300–700. Ajustar según la RAM disponible en el servidor."
            :min="limites.max_l1_entries.min"
            :max="limites.max_l1_entries.max"
            tipo-campo="int"
            :valor-default="defaults.max_l1_entries"
            v-model="form.max_l1_entries"
            @validation-error="registrarError('max_l1_entries', $event)"
          />

        </div>
      </div>

      <!-- ── Barra de acciones ─────────────────────────────────────────────── -->
      <div class="flex items-center justify-between gap-4 pt-2 pb-4">

        <!-- Botón Restablecer -->
        <button
          @click="confirmarReset = true"
          :disabled="guardando || reseteando"
          class="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 text-sm font-semibold rounded-lg transition-colors"
        >
          <Icon icon="mdi:restore" class="text-lg" />
          Restablecer valores por defecto
        </button>

        <!-- Botón Guardar -->
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

    <!-- ── Modal de confirmación para reset ───────────────────────────────── -->
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
import { Icon } from '@iconify/vue'
import { toast } from 'vue3-toastify'
import {
  obtenerRagParams,
  actualizarRagParams,
  resetearRagParams,
  type RagParams,
  type ParamLimit,
} from '@/services/backendService'
import RagParamInput from '@/components/config/RagParamInput.vue'

// ── Estado ───────────────────────────────────────────────────────────────────
const cargando      = ref(true)
const guardando     = ref(false)
const reseteando    = ref(false)
const confirmarReset = ref(false)
const errorCarga    = ref('')

const form     = ref<RagParams | null>(null)
const defaults = ref<RagParams | null>(null)
const limites  = ref<Record<keyof RagParams, ParamLimit> | null>(null)

// Advertencias y acciones de la última operación
const advertencias    = ref<string[]>([])
const accionesLimpieza = ref<string[]>([])

// Mapa de errores de validación por campo
const erroresValidacion = ref<Record<string, boolean>>({})

const hayErrores = computed(() =>
  Object.values(erroresValidacion.value).some(Boolean)
)

// ── Carga inicial ─────────────────────────────────────────────────────────────
async function cargar() {
  cargando.value  = true
  errorCarga.value = ''
  try {
    const res = await obtenerRagParams()
    // Copia profunda para no mutar la referencia del backend
    form.value     = { ...res.parametros_actuales }
    defaults.value = { ...res.defaults }
    limites.value  = res.limites
  } catch (e: any) {
    errorCarga.value = e.message || 'Error desconocido al conectar con el servidor.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

// ── Validación ────────────────────────────────────────────────────────────────
function registrarError(campo: string, tieneError: boolean) {
  erroresValidacion.value[campo] = tieneError
}

// ── Guardar ───────────────────────────────────────────────────────────────────
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

// ── Resetear ──────────────────────────────────────────────────────────────────
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
</script>