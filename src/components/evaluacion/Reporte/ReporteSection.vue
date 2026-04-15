<!-- src/components/evaluacion/Reporte/ReporteSection.vue -->
<!--
  Sección B del Evaluador RAG — Reporte completo.
  Orquesta los 3 subcomponentes: Header, Gráficas, Tabla.
  Se muestra con animación slide-down cuando llegan los resultados.
-->
<template>
  <Transition name="slide-down">
    <div v-if="resultado" class="flex flex-col gap-5">

      <!-- Cabecera del reporte: botones de exportación + título -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-1 h-5 bg-blue-500 rounded-full"></div>
          <h2 class="text-base font-bold text-white">Reporte de Evaluación</h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="onExportarHTML"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Icon icon="mdi:file-download-outline" class="text-base" />
            Exportar HTML
          </button>
          <button
            @click="onExportarCSV"
            class="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-semibold rounded-lg transition-colors"
          >
            <Icon icon="mdi:table-arrow-down" class="text-base" />
            Exportar CSV
          </button>
        </div>
      </div>

      <!-- Alerta si hay preguntas cacheadas -->
      <div
        v-if="alertaCaché"
        class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3"
      >
        <Icon icon="mdi:alert-outline" class="text-yellow-400 text-xl shrink-0 mt-0.5" />
        <div>
          <p class="text-yellow-300 text-sm font-semibold">Algunas respuestas vinieron del caché</p>
          <p class="text-yellow-400/70 text-xs mt-1 leading-relaxed">
            {{ preguntasCacheadas }} pregunta{{ preguntasCacheadas !== 1 ? 's' : '' }} tuvieron latencia &lt; 500 ms (caché hit). 
            Para resultados más precisos, limpia el caché desde Configuración IA antes de evaluar.
          </p>
        </div>
      </div>

      <!-- 1. Header: score global + conteo + parámetros -->
      <ReporteHeader :resultado="resultado" />

      <!-- 2. Gráficas -->
      <ReporteGraficas :resultado="resultado" />

      <!-- 3. Tabla detallada -->
      <ReporteTabla :resultado="resultado" />

    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { ResultadoEvaluacion } from '@/services/backendService'
import ReporteHeader   from './ReporteHeader.vue'
import ReporteGraficas from './ReporteGraficas.vue'
import ReporteTabla    from './ReporteTabla.vue'
import { exportarHTML, exportarCSV } from '@/services/exportService'

const props = defineProps<{
  resultado: ResultadoEvaluacion | null
}>()

const preguntasCacheadas = computed(() =>
  props.resultado
    ? props.resultado.resultados.filter(r => r.latencia_ms < 500).length
    : 0,
)

const alertaCaché = computed(() =>
  preguntasCacheadas.value > 0,
)

function onExportarHTML() {
  if (props.resultado) exportarHTML(props.resultado)
}

function onExportarCSV() {
  if (props.resultado) exportarCSV(props.resultado)
}
</script>

<style scoped>
.slide-down-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-16px);
}
</style>