<!-- src/components/evaluacion/Reporte/ReportePhoenix.vue -->
<!--
  Bloque de métricas Phoenix + guía de interpretación.
  Si Phoenix no está disponible o solo hay caché, muestra el aviso correspondiente.
-->
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

    <!-- Métricas Phoenix -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div class="flex items-center gap-2 mb-4">
        <Icon icon="mdi:fire" class="text-orange-400 text-lg" />
        <h3 class="text-sm font-semibold text-white">Métricas Phoenix</h3>
        <span
          :class="[
            'ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold border',
            phoenix.disponible ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30',
          ]"
        >
          {{ phoenix.disponible ? '✓ conectado' : '✗ no disponible' }}
        </span>
      </div>

      <!-- Sin Phoenix -->
      <div v-if="!phoenix.disponible" class="flex items-start gap-2 text-xs text-gray-500">
        <Icon icon="mdi:alert-outline" class="text-yellow-500 shrink-0 mt-0.5" />
        <p>Phoenix no respondió durante la evaluación. Verifica que el servidor FastAPI esté corriendo (Phoenix se lanza desde él).</p>
      </div>

      <!-- Solo caché (no hubo spans RAG_REAL) -->
      <div v-else-if="phoenix.nota && !phoenix.spans_analizados" class="flex items-start gap-2 text-xs text-yellow-400/80">
        <Icon icon="mdi:information-outline" class="shrink-0 mt-0.5" />
        <p>{{ phoenix.nota }}</p>
      </div>

      <!-- Métricas disponibles -->
      <div v-else class="flex flex-col gap-2.5">

        <div class="flex items-center justify-between py-1.5 border-b border-gray-700/50">
          <span class="text-xs text-gray-500">Spans RAG analizados</span>
          <span class="text-xs font-bold text-gray-200 font-mono">{{ phoenix.spans_analizados ?? '—' }}</span>
        </div>
        <div class="flex items-center justify-between py-1.5 border-b border-gray-700/50">
          <span class="text-xs text-gray-500">Modelo LLM</span>
          <span class="text-[11px] font-mono text-blue-300">{{ phoenix.modelo_llm ?? '—' }}</span>
        </div>
        <div class="flex items-center justify-between py-1.5 border-b border-gray-700/50">
          <span class="text-xs text-gray-500">Modelo Embedding</span>
          <span class="text-[11px] font-mono text-violet-300">{{ phoenix.modelo_embed ?? '—' }}</span>
        </div>
        <div class="flex items-center justify-between py-1.5 border-b border-gray-700/50">
          <span class="text-xs text-gray-500">K retrieval</span>
          <span class="text-xs font-bold font-mono text-gray-200">{{ phoenix.k_retrieval ?? '—' }}</span>
        </div>
        <div class="flex items-center justify-between py-1.5 border-b border-gray-700/50">
          <span class="text-xs text-gray-500">Umbral relevancia</span>
          <span class="text-xs font-bold font-mono text-gray-200">{{ phoenix.umbral_relevancia ?? '—' }}</span>
        </div>
        <div class="flex items-center justify-between py-1.5 border-b border-gray-700/50">
          <span class="text-xs text-gray-500">HyDE activo</span>
          <span :class="['text-xs font-bold', phoenix.hyde_aplicado ? 'text-emerald-400' : 'text-gray-500']">
            {{ phoenix.hyde_aplicado == null ? '—' : phoenix.hyde_aplicado ? 'Sí' : 'No' }}
          </span>
        </div>

        <p class="text-[10px] font-bold text-gray-500 uppercase tracking-wider pt-1">Latencias promedio</p>

        <div class="flex flex-col gap-1.5 pl-2 border-l-2 border-gray-700">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">Total avg</span>
            <span class="text-xs font-mono text-gray-200">{{ fmtMs(phoenix.latencia_total_ms_avg) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">└ LLM generación</span>
            <span class="text-xs font-mono text-gray-400">{{ fmtMs(phoenix.latencia_llm_ms_avg) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">└ Retrieval + overhead</span>
            <span class="text-xs font-mono text-gray-400">{{ fmtMs(phoenix.latencia_retrieval_avg) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">Fragmentos usados avg</span>
            <span class="text-xs font-mono text-gray-200">{{ phoenix.fragmentos_usados_avg ?? '—' }}</span>
          </div>
        </div>

      </div>
    </div>

    <!-- Guía de interpretación -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div class="flex items-center gap-2 mb-4">
        <Icon icon="mdi:book-open-variant-outline" class="text-blue-400 text-lg" />
        <h3 class="text-sm font-semibold text-white">Guía de interpretación</h3>
      </div>

      <div class="flex flex-col gap-3">
        <div v-for="g in guia" :key="g.grupo" class="flex flex-col gap-1">
          <p class="text-[11px] font-bold text-gray-300">{{ g.grupo }}</p>
          <p class="text-[11px] text-gray-500 leading-relaxed">
            <span class="text-red-400 font-semibold">Si falla:</span> {{ g.siFalla }}
          </p>
          <p class="text-[11px] text-emerald-400/80 leading-relaxed">
            <span class="font-semibold">Acción:</span> {{ g.accion }}
          </p>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { MetricasPhoenix } from '@/services/backendService'

const props = defineProps<{
  phoenix: MetricasPhoenix
}>()

function fmtMs(v?: number | null): string {
  return v != null ? `${v} ms` : '—'
}

const guia = [
  {
    grupo:    'TP Directo',
    siFalla:  'Problema de retrieval — umbral muy alto, k muy bajo, o chunking fragmenta el dato en dos chunks.',
    accion:   'Bajar UMBRAL_RELEVANCIA o aumentar breakpoint_threshold.',
  },
  {
    grupo:    'TP Razonamiento',
    siFalla:  'El LLM no sintetiza múltiples fragmentos, o los fragmentos parciales no llegaron juntos.',
    accion:   'Subir K. Revisar si HyDE mejora el match semántico.',
  },
  {
    grupo:    'TN Fuera dominio',
    siFalla:  'El sistema alucinó o el umbral está demasiado bajo (entra contexto irrelevante).',
    accion:   'Subir UMBRAL_RELEVANCIA.',
  },
  {
    grupo:    'Corrección',
    siFalla:  'El LLM confirma el error del usuario (sycophancy). Depende del modelo, no de parámetros RAG.',
    accion:   'Límite del modelo 8b — no tiene solución de parámetro.',
  },
  {
    grupo:    'Anti-alucinación',
    siFalla:  'ALUCINACIÓN CRÍTICA. El LLM usó conocimiento de preentrenamiento ignorando el prompt.',
    accion:   'Verificar repeat_penalty, top_k, top_p. Considerar modelo más grande.',
  },
  {
    grupo:    'Interpretación',
    siFalla:  'Zona gris — preguntas ambiguas con múltiples respuestas válidas.',
    accion:   'Un PARCIAL aquí es aceptable.',
  },
]
</script>