<!-- src/components/evaluacion/Reporte/ReporteGraficas.vue -->

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

    <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div class="flex items-center gap-2 mb-4">
        <Icon icon="mdi:chart-bar" class="text-blue-400 text-lg" />
        <h3 class="text-sm font-semibold text-white">Score por grupo</h3>
      </div>
      <Bar :data="barData" :options="barOptions" class="max-h-64" />
    </div>

    <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col">
      <div class="flex items-center gap-2 mb-4">
        <Icon icon="mdi:chart-donut" class="text-blue-400 text-lg" />
        <h3 class="text-sm font-semibold text-white">Distribución de veredictos</h3>
      </div>
      <div class="flex-1 flex items-center justify-center gap-8">
        <Doughnut :data="donutData" :options="donutOptions" class="max-h-52 max-w-52" />
        <div class="flex flex-col gap-3">
          <div v-for="item in leyendaDonut" :key="item.label" class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: item.color }"></div>
            <div>
              <p class="text-xs font-bold" :style="{ color: item.color }">{{ item.count }}</p>
              <p class="text-[10px] text-gray-500">{{ item.label }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'
import type { ResultadoEvaluacion } from '@/services/backendService'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps<{
  resultado: ResultadoEvaluacion
}>()


function colorPorScore(score: number): string {
  if (score >= 0.85) return 'rgba(52, 211, 153, 0.85)'   
  if (score >= 0.65) return 'rgba(251, 191, 36, 0.85)'   
  return 'rgba(248, 113, 113, 0.85)'                    
}

function colorBordePorScore(score: number): string {
  if (score >= 0.85) return 'rgb(52, 211, 153)'
  if (score >= 0.65) return 'rgb(251, 191, 36)'
  return 'rgb(248, 113, 113)'
}

const barData = computed(() => {
  const grupos  = Object.keys(props.resultado.resumen_por_grupo)
  const scores  = grupos.map(g => Math.round((props.resultado.resumen_por_grupo[g]?.promedio ?? 0) * 100))

  return {
    labels: grupos,
    datasets: [
      {
        label: 'Score (%)',
        data:  scores,
        backgroundColor: scores.map(s => colorPorScore(s / 100)),
        borderColor:     scores.map(s => colorBordePorScore(s / 100)),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }
})

const barOptions = computed(() => ({
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.raw}%`,
      },
    },
  },
  scales: {
    x: {
      min: 0,
      max: 100,
      grid:  { color: 'rgba(75, 85, 99, 0.3)' },
      ticks: { color: '#9ca3af', font: { size: 11 }, callback: (v: any) => `${v}%` },
    },
    y: {
      grid:  { display: false },
      ticks: { color: '#d1d5db', font: { size: 11 } },
    },
  },
}))

const donutData = computed(() => ({
  labels: ['PASS', 'PARCIAL', 'FAIL'],
  datasets: [
    {
      data: [
        props.resultado.conteo_global.pass,
        props.resultado.conteo_global.parcial,
        props.resultado.conteo_global.fail,
      ],
      backgroundColor: [
        'rgba(52, 211, 153, 0.85)',
        'rgba(251, 191, 36, 0.85)',
        'rgba(248, 113, 113, 0.85)',
      ],
      borderColor: [
        'rgb(52, 211, 153)',
        'rgb(251, 191, 36)',
        'rgb(248, 113, 113)',
      ],
      borderWidth: 2,
      hoverOffset: 6,
    },
  ],
}))

const donutOptions = {
  responsive: true,
  maintainAspectRatio: true,
  cutout: '68%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}`,
      },
    },
  },
}

const leyendaDonut = computed(() => [
  { label: 'PASS',    count: props.resultado.conteo_global.pass,    color: 'rgb(52, 211, 153)' },
  { label: 'PARCIAL', count: props.resultado.conteo_global.parcial, color: 'rgb(251, 191, 36)' },
  { label: 'FAIL',    count: props.resultado.conteo_global.fail,    color: 'rgb(248, 113, 113)' },
])
</script>