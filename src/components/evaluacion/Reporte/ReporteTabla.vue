<!-- src/components/evaluacion/Reporte/ReporteTabla.vue -->
<!--
  Tabla detallada por caso.
  Columnas: ID, grupo, tipo, pregunta, veredicto/score, latencia.
  La respuesta del RAG se expande al hacer clic en la fila.
-->
<template>
  <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">

    <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon icon="mdi:table-large" class="text-blue-400 text-lg" />
        <h3 class="text-sm font-semibold text-white">Detalle por caso</h3>
      </div>
      <p class="text-xs text-gray-500">Haz clic en una fila para ver la respuesta completa</p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-gray-700 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <th class="px-4 py-3">ID</th>
            <th class="px-4 py-3">Grupo</th>
            <th class="px-4 py-3">Tipo</th>
            <th class="px-4 py-3">Pregunta</th>
            <th class="px-4 py-3 text-center">Score</th>
            <th class="px-4 py-3 text-right">Latencia</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in resultado.resultados" :key="r.id">

            <!-- Fila principal -->
            <tr
              @click="toggleExpandido(r.id)"
              :class="[
                'border-b border-gray-700/50 cursor-pointer transition-colors text-sm',
                expandido === r.id ? 'bg-gray-700/40' : 'hover:bg-gray-700/20',
              ]"
            >
              <td class="px-4 py-3 font-mono text-xs text-gray-400">{{ r.id }}</td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-300">{{ r.grupo }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="['px-2 py-0.5 rounded-full text-[10px] font-semibold border', colorTipo(r.tipo)]">
                  {{ r.tipo }}
                </span>
              </td>
              <td class="px-4 py-3 max-w-xs">
                <p class="text-xs text-gray-200 line-clamp-2 leading-relaxed">{{ r.pregunta }}</p>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex flex-col items-center gap-0.5">
                  <span :class="['px-2 py-0.5 rounded text-[10px] font-bold border', colorVeredicto(r.veredicto)]">
                    {{ r.veredicto }}
                  </span>
                  <span class="text-[10px] text-gray-500 font-mono">{{ r.score.toFixed(1) }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <span :class="['text-xs font-mono', r.latencia_ms < 500 ? 'text-emerald-400' : 'text-gray-400']">
                  {{ r.latencia_ms < 500 ? '⚡ caché' : `${r.latencia_ms} ms` }}
                </span>
              </td>
            </tr>

            <!-- Fila expandida: respuesta + detalle -->
            <tr v-if="expandido === r.id" class="bg-gray-700/20 border-b border-gray-700/50">
              <td colspan="6" class="px-6 py-4">
                <div class="flex flex-col gap-3">

                  <!-- Respuesta del RAG -->
                  <div>
                    <p class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Respuesta del RAG</p>
                    <p class="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-900/50 rounded-lg px-4 py-3 border border-gray-700">{{ r.respuesta }}</p>
                  </div>

                  <!-- Detalle de scoring -->
                  <div class="flex items-start gap-2">
                    <Icon
                      :icon="r.veredicto === 'PASS' ? 'mdi:check-circle' : r.veredicto === 'PARCIAL' ? 'mdi:alert-circle' : 'mdi:close-circle'"
                      :class="['text-base shrink-0 mt-0.5', r.veredicto === 'PASS' ? 'text-emerald-400' : r.veredicto === 'PARCIAL' ? 'text-yellow-400' : 'text-red-400']"
                    />
                    <p class="text-xs text-gray-400 font-mono leading-relaxed">{{ r.detalle }}</p>
                  </div>

                  <!-- Descripción del caso -->
                  <p v-if="r.descripcion" class="text-[11px] text-gray-500 italic">
                    📌 {{ r.descripcion }}
                  </p>

                </div>
              </td>
            </tr>

          </template>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { ResultadoEvaluacion, Veredicto } from '@/services/backendService'

defineProps<{
  resultado: ResultadoEvaluacion
}>()

const expandido = ref<string | null>(null)

function toggleExpandido(id: string) {
  expandido.value = expandido.value === id ? null : id
}

function colorVeredicto(v: Veredicto): string {
  const mapa: Record<Veredicto, string> = {
    PASS:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    PARCIAL: 'bg-yellow-500/15  text-yellow-400  border-yellow-500/30',
    FAIL:    'bg-red-500/15     text-red-400     border-red-500/30',
  }
  return mapa[v]
}

function colorTipo(tipo: string): string {
  const mapa: Record<string, string> = {
    contiene:    'bg-blue-500/10   text-blue-400   border-blue-500/30',
    no_contiene: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    corrige:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    no_alucina:  'bg-red-500/10    text-red-400    border-red-500/30',
  }
  return mapa[tipo] ?? 'bg-gray-700 text-gray-400 border-gray-600'
}
</script>