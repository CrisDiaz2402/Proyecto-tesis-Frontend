<!-- src/components/evaluacion/Reporte/ReporteHeader.vue -->
<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div :class="['md:col-span-1 rounded-xl p-6 border flex flex-col items-center justify-center text-center gap-2', bgScore]">
        <p class="text-xs font-bold uppercase tracking-widest" :class="colorScore">Score Global</p>
        <p class="text-6xl font-black" :class="colorScore">{{ pctScore }}%</p>
        <span :class="['px-3 py-1 rounded-full text-xs font-bold border', badgeScore]">
          {{ nivelScore }}
        </span>
        <p class="text-xs text-gray-500 mt-1">
          {{ resultado.conteo_global.total }} pregunta{{ resultado.conteo_global.total !== 1 ? 's' : '' }} evaluadas
        </p>
      </div>

      <div class="md:col-span-1 bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col justify-center gap-3">
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Distribución de veredictos</p>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span class="text-xs text-gray-300">PASS</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-1.5 rounded-full bg-emerald-500/30" :style="{ width: `${barWidth(resultado.conteo_global.pass)}px` }"></div>
            <span class="text-sm font-bold text-emerald-400 w-6 text-right">{{ resultado.conteo_global.pass }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span class="text-xs text-gray-300">PARCIAL</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-1.5 rounded-full bg-yellow-500/30" :style="{ width: `${barWidth(resultado.conteo_global.parcial)}px` }"></div>
            <span class="text-sm font-bold text-yellow-400 w-6 text-right">{{ resultado.conteo_global.parcial }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span class="text-xs text-gray-300">FAIL</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-1.5 rounded-full bg-red-500/30" :style="{ width: `${barWidth(resultado.conteo_global.fail)}px` }"></div>
            <span class="text-sm font-bold text-red-400 w-6 text-right">{{ resultado.conteo_global.fail }}</span>
          </div>
        </div>

      </div>

      <div class="md:col-span-1 bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-2">
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Parámetros del experimento</p>

        <div v-for="p in parametros" :key="p.label" class="flex items-center justify-between">
          <span class="text-[11px] text-gray-500">{{ p.label }}</span>
          <span class="text-[11px] font-mono font-semibold" :class="p.color ?? 'text-gray-300'">{{ p.value }}</span>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResultadoEvaluacion } from '@/services/backendService'

const props = defineProps<{
  resultado: ResultadoEvaluacion
}>()

const pctScore = computed(() => Math.round(props.resultado.score_global * 100))

const nivelScore = computed(() => {
  if (pctScore.value >= 85) return 'EXCELENTE'
  if (pctScore.value >= 65) return 'ACEPTABLE'
  return 'REQUIERE MEJORAS'
})

const colorScore = computed(() => {
  if (pctScore.value >= 85) return 'text-emerald-400'
  if (pctScore.value >= 65) return 'text-yellow-400'
  return 'text-red-400'
})

const bgScore = computed(() => {
  if (pctScore.value >= 85) return 'bg-emerald-900/20 border-emerald-700/40'
  if (pctScore.value >= 65) return 'bg-yellow-900/20 border-yellow-700/40'
  return 'bg-red-900/20 border-red-700/40'
})

const badgeScore = computed(() => {
  if (pctScore.value >= 85) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  if (pctScore.value >= 65) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  return 'bg-red-500/15 text-red-400 border-red-500/30'
})

function barWidth(n: number): number {
  const total = props.resultado.conteo_global.total
  if (total === 0) return 0
  return Math.round((n / total) * 80)
}

const parametros = computed(() => {
  const r = props.resultado
  const fecha = new Date(r.timestamp).toLocaleString('es-EC', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  return [
    { label: 'Experimento',    value: r.experimento,                         color: 'text-blue-300' },
    { label: 'Motor',          value: r.motor,                               color: 'text-violet-300' },
    { label: 'Duración',       value: `${r.duracion_total_seg}s`,            color: null },
    { label: 'Fecha',          value: fecha,                                  color: null },
  ]
})
</script>