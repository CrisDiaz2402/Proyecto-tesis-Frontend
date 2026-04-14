<!-- src/components/config/TabPrompts.vue -->
<!--
  Pestaña de edición de prompts del sistema RAG.
  Permite personalizar el prompt_principal (instrucción al LLM) y
  el prompt_hyde (respuesta hipotética pre-retrieval).

  Reglas del backend:
    - Enviar texto completo → se persiste en BD y se usa en runtime.
    - Enviar cadena vacía "" → borra de BD (vuelve al prompt hardcodeado).
    - No enviar el campo → no se modifica.

  Los prompts hardcodeados se reciben en `prompts_default_texto` y se usan
  como placeholder de los textareas cuando el campo es null en BD.
-->
<template>
  <div class="space-y-8">

    <!-- Estado de carga inicial -->
    <div v-if="cargando" class="flex items-center gap-3 text-gray-400 py-12 justify-center">
      <Icon icon="mdi:loading" class="animate-spin text-2xl" />
      <span class="text-sm">Cargando prompts…</span>
    </div>

    <!-- Error de carga -->
    <div
      v-else-if="errorCarga"
      class="flex items-center gap-3 bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm"
    >
      <Icon icon="mdi:alert-circle-outline" class="text-xl shrink-0" />
      {{ errorCarga }}
    </div>

    <!-- Contenido principal -->
    <template v-else>

      <!-- Aviso informativo -->
      <div class="flex items-start gap-3 bg-blue-900/20 border border-blue-700/40 rounded-xl p-4">
        <Icon icon="mdi:information-outline" class="text-blue-400 text-xl shrink-0 mt-0.5" />
        <p class="text-blue-300 text-sm leading-relaxed">
          Los prompts personalizados se aplican en runtime sin necesidad de reiniciar el servidor.
          Deja el campo vacío y guarda para restaurar el comportamiento por defecto.
        </p>
      </div>

      <!-- ── Prompt Principal ──────────────────────────────────────────────── -->
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">

        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-white font-semibold flex items-center gap-2">
              <Icon icon="mdi:text-box-edit-outline" class="text-blue-400" />
              Prompt Principal
            </h3>
            <p class="text-gray-400 text-sm mt-1">
              Instrucción principal que recibe el LLM junto con el contexto recuperado y la pregunta.
              Debe incluir los placeholders
              <code class="bg-gray-700 px-1 rounded text-blue-300">{contexto}</code> y
              <code class="bg-gray-700 px-1 rounded text-blue-300">{pregunta}</code>.
            </p>
          </div>
          <!-- Badge de estado -->
          <span
            :class="[
              'shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border',
              estadoPrincipal === 'personalizado'
                ? 'bg-violet-900/30 border-violet-600/50 text-violet-300'
                : 'bg-gray-700/50 border-gray-600 text-gray-400',
            ]"
          >
            {{ estadoPrincipal === 'personalizado' ? 'Personalizado' : 'Por defecto' }}
          </span>
        </div>

        <textarea
          v-model="promptPrincipal"
          rows="12"
          :placeholder="placeholderPrincipal"
          class="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 text-sm
                 font-mono leading-relaxed resize-y focus:outline-none focus:border-blue-500
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
              v-if="estadoPrincipal === 'personalizado'"
              @click="resetearPrompt('principal')"
              :disabled="guardando"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     text-gray-400 hover:text-white hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              <Icon icon="mdi:restore" />
              Restaurar defecto
            </button>
            <button
              @click="guardarPrompt('principal')"
              :disabled="guardando || !puedoGuardarPrincipal"
              class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold
                     bg-blue-600 hover:bg-blue-500 text-white transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon v-if="guardando && guardandoCual === 'principal'" icon="mdi:loading" class="animate-spin" />
              <Icon v-else icon="mdi:content-save-outline" />
              Guardar
            </button>
          </div>
        </div>
      </div>

      <!-- ── Prompt HyDE ───────────────────────────────────────────────────── -->
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">

        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-white font-semibold flex items-center gap-2">
              <Icon icon="mdi:magnify-expand" class="text-emerald-400" />
              Prompt HyDE
              <span class="text-xs font-normal text-gray-500">(Hypothetical Document Embeddings)</span>
            </h3>
            <p class="text-gray-400 text-sm mt-1">
              Instrucción para generar una respuesta hipotética antes del retrieval,
              mejorando la calidad de la búsqueda semántica.
              Debe incluir el placeholder
              <code class="bg-gray-700 px-1 rounded text-emerald-300">{pregunta}</code>.
            </p>
          </div>
          <span
            :class="[
              'shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border',
              estadoHyde === 'personalizado'
                ? 'bg-violet-900/30 border-violet-600/50 text-violet-300'
                : 'bg-gray-700/50 border-gray-600 text-gray-400',
            ]"
          >
            {{ estadoHyde === 'personalizado' ? 'Personalizado' : 'Por defecto' }}
          </span>
        </div>

        <textarea
          v-model="promptHyde"
          rows="5"
          :placeholder="placeholderHyde"
          class="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 text-sm
                 font-mono leading-relaxed resize-y focus:outline-none focus:border-emerald-500
                 placeholder:text-gray-600 transition-colors"
        />

        <div class="flex items-center justify-between">
          <p class="text-gray-500 text-xs">
            {{ promptHyde.length }} caracteres
            <span v-if="promptHyde.length > 0 && promptHyde.length < 20" class="text-amber-400 ml-1">
              — mínimo 20 caracteres
            </span>
          </p>
          <div class="flex gap-2">
            <button
              v-if="estadoHyde === 'personalizado'"
              @click="resetearPrompt('hyde')"
              :disabled="guardando"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     text-gray-400 hover:text-white hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              <Icon icon="mdi:restore" />
              Restaurar defecto
            </button>
            <button
              @click="guardarPrompt('hyde')"
              :disabled="guardando || !puedoGuardarHyde"
              class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold
                     bg-emerald-600 hover:bg-emerald-500 text-white transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon v-if="guardando && guardandoCual === 'hyde'" icon="mdi:loading" class="animate-spin" />
              <Icon v-else icon="mdi:content-save-outline" />
              Guardar
            </button>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { toast } from 'vue3-toastify'
import { obtenerRagParams, actualizarPrompts } from '@/services/backendService'

// ── Estado ────────────────────────────────────────────────────────────────────

const cargando    = ref(true)
const errorCarga  = ref<string | null>(null)
const guardando   = ref(false)
const guardandoCual = ref<'principal' | 'hyde' | null>(null)

// Texto actual en los textareas (vacío = usar el hardcodeado)
const promptPrincipal = ref('')
const promptHyde      = ref('')

// Textos hardcodeados del backend — se usan como placeholder
const defaultPrincipal = ref('')
const defaultHyde      = ref('')

// Si el campo vino null de BD, el prompt activo es el hardcodeado
const estadoPrincipal = computed<'defecto' | 'personalizado'>(() =>
  promptPrincipal.value.trim() !== defaultPrincipal.value.trim() ? 'personalizado' : 'defecto',
)
const estadoHyde = computed<'defecto' | 'personalizado'>(() =>
  promptHyde.value.trim() !== defaultHyde.value.trim() ? 'personalizado' : 'defecto',
)

const placeholderPrincipal = 'Escribe aquí el prompt principal…'
const placeholderHyde      = 'Escribe aquí el prompt HyDE…'

// Validación básica para habilitar el botón Guardar
const puedoGuardarPrincipal = computed(() => {
  const t = promptPrincipal.value.trim()
  if (t.length === 0) return true                 // vacío = reset, siempre válido
  return t.length >= 50 && t.includes('{contexto}') && t.includes('{pregunta}')
})
const puedoGuardarHyde = computed(() => {
  const t = promptHyde.value.trim()
  if (t.length === 0) return true
  return t.length >= 20 && t.includes('{pregunta}')
})

// ── Carga inicial ─────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const data = await obtenerRagParams()
    // Los textos hardcodeados siempre vienen en prompts_default_texto
    defaultPrincipal.value = data.prompts_default_texto?.prompt_principal ?? ''
    defaultHyde.value      = data.prompts_default_texto?.prompt_hyde      ?? ''
    // Si hay un prompt personalizado en BD, lo mostramos en el textarea
    promptPrincipal.value  = data.parametros_actuales.prompt_principal ?? defaultPrincipal.value
    promptHyde.value       = data.parametros_actuales.prompt_hyde      ?? defaultHyde.value
  } catch (e: any) {
    errorCarga.value = e.message ?? 'Error al cargar los prompts.'
  } finally {
    cargando.value = false
  }
})

// ── Acciones ──────────────────────────────────────────────────────────────────

async function guardarPrompt(cual: 'principal' | 'hyde') {
  guardando.value   = true
  guardandoCual.value = cual
  try {
    const payload = cual === 'principal'
      ? { prompt_principal: promptPrincipal.value }
      : { prompt_hyde: promptHyde.value }

    const res = await actualizarPrompts(payload)

    // Sincronizar estado local con lo que devuelve el backend
    promptPrincipal.value = res.parametros_actuales.prompt_principal ?? defaultPrincipal.value
    promptHyde.value      = res.parametros_actuales.prompt_hyde      ?? defaultHyde.value

    toast.success('Prompt guardado correctamente.')
  } catch (e: any) {
    toast.error(e.message ?? 'Error al guardar el prompt.')
  } finally {
    guardando.value     = false
    guardandoCual.value = null
  }
}

async function resetearPrompt(cual: 'principal' | 'hyde') {
  guardando.value     = true
  guardandoCual.value = cual
  try {
    // Enviar cadena vacía → backend borra de BD y vuelve al hardcodeado
    const payload = cual === 'principal'
      ? { prompt_principal: '' }
      : { prompt_hyde: '' }

    await actualizarPrompts(payload)

    // Cargar el texto por defecto en el textarea
    if (cual === 'principal') promptPrincipal.value = defaultPrincipal.value
    else                      promptHyde.value      = defaultHyde.value

    toast.success('Prompt restaurado al valor por defecto.')
  } catch (e: any) {
    toast.error(e.message ?? 'Error al restaurar el prompt.')
  } finally {
    guardando.value     = false
    guardandoCual.value = null
  }
}
</script>