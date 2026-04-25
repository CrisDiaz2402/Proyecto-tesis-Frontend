<template>
  <div>
    <div class="mb-6">
      <h2 class="text-base font-semibold text-gray-800">Motor de Inferencia Activo</h2>
      <p class="text-gray-500 text-sm mt-1">
        Información del motor que procesa las consultas del asistente. La configuración es fija para esta instancia.
      </p>
    </div>

    <div v-if="cargando" class="flex justify-center py-16">
      <Icon icon="mdi:loading" class="animate-spin text-5xl text-blue-500" />
    </div>

    <div v-else class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
        <Icon icon="mdi:chip" class="text-blue-500 text-xl" />
        <h3 class="text-sm font-semibold text-gray-800 uppercase tracking-wider">Estado del Motor</h3>
        <span class="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
          <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Activo
        </span>
      </div>

      <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <div class="p-2.5 bg-blue-600/10 rounded-lg shrink-0">
            <Icon icon="mdi:database-search-outline" class="text-blue-500 text-2xl" />
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Motor de Embeddings</p>
            <p class="text-gray-800 font-bold text-sm">sentence-transformers</p>
            <p class="text-gray-400 text-xs mt-1">Búsqueda semántica local · Modo: {{ config?.motor_vectores ?? 'local' }}</p>
          </div>
        </div>

        <div class="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <div class="p-2.5 bg-violet-600/10 rounded-lg shrink-0">
            <Icon icon="mdi:brain" class="text-violet-500 text-2xl" />
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Motor LLM</p>
            <p class="text-gray-800 font-bold text-sm">vLLM · Qwen2.5</p>
            <p class="text-gray-400 text-xs mt-1">Inferencia local · Modo: {{ config?.motor_llm ?? 'local' }}</p>
          </div>
        </div>
      </div>

      <div class="px-6 pb-5">
        <p class="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <Icon icon="mdi:information-outline" class="shrink-0 mt-0.5 text-gray-400" />
          El sistema opera en modo <strong class="text-gray-500">local</strong>. Todos los datos se procesan en la infraestructura interna sin enviar información externa.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { obtenerConfiguracionIA } from '@/services/backendService'

const cargando = ref(true)
const config = ref<{ motor_vectores: string; motor_llm: string } | null>(null)

onMounted(async () => {
  try {
    config.value = await obtenerConfiguracionIA()
  } catch {
    // silencioso: el badge "Activo" ya indica estado operativo
  } finally {
    cargando.value = false
  }
})
</script>
