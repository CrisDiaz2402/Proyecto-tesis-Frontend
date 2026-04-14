<!-- src/components/monitor/MonitorConcurrencia.vue -->
<template>
  <div class="flex flex-col gap-6">

    <!-- Métricas globales -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div
        v-for="m in metricas"
        :key="m.label"
        class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4"
      >
        <div :class="`p-3 rounded-xl ${m.bg}`">
          <Icon :icon="m.icon" :class="`text-2xl ${m.color}`" />
        </div>
        <div>
          <p class="text-2xl font-bold text-white font-mono">{{ m.value }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ m.label }}</p>
        </div>
      </div>
    </div>

    <!-- Consultas activas ahora mismo -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
        <h3 class="text-sm font-semibold text-white uppercase tracking-wider">
          En proceso ahora
        </h3>
        <span class="ml-auto px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded border border-gray-600">
          {{ estado.total_activas }} activa(s)
        </span>
      </div>

      <div class="p-4 flex flex-col gap-2 min-h-[80px]">
        <div v-if="estado.activas.length === 0" class="flex items-center justify-center py-4 text-gray-500 text-sm">
          Sin consultas activas en este momento
        </div>
        <div
          v-for="c in estado.activas"
          :key="c.id"
          class="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <Icon icon="mdi:loading" class="animate-spin text-blue-400 shrink-0" />
          <span class="text-xs font-mono text-blue-300 shrink-0 w-16">{{ c.motor }}</span>
          <span class="text-sm text-gray-200 flex-1 truncate">{{ c.pregunta }}</span>
          <span class="text-xs text-blue-400 font-mono shrink-0">{{ tiempoTranscurrido(c.inicio) }}s</span>
        </div>
      </div>
    </div>

    <!-- Historial reciente -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
        <Icon icon="mdi:history" class="text-gray-400 text-lg" />
        <h3 class="text-sm font-semibold text-white uppercase tracking-wider">Historial reciente</h3>
        <span class="ml-auto px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded border border-gray-600">
          últimas {{ estado.historial.length }}
        </span>
      </div>

      <div v-if="estado.historial.length === 0" class="p-8 text-center text-gray-500 text-sm">
        Aún no hay consultas procesadas
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-gray-900/50">
              <th class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Motor</th>
              <th class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Pregunta</th>
              <th class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Latencia</th>
              <th class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Caché</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            <tr
              v-for="r in estado.historial"
              :key="r.id + r.fin"
              class="hover:bg-gray-700/30 transition-colors"
            >
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] font-mono text-blue-300">
                  {{ r.motor }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{{ r.pregunta }}</td>
              <td class="px-4 py-3 text-right">
                <span class="text-sm font-mono" :class="r.cache ? 'text-green-400' : 'text-gray-300'">
                  {{ r.latencia_ms }} ms
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span v-if="r.cache" class="text-green-400 text-xs font-semibold">⚡ Sí</span>
                <span v-else class="text-gray-500 text-xs">🤖 No</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Error de conexión -->
    <div
      v-if="errorConexion"
      class="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm"
    >
      <Icon icon="mdi:wifi-off" class="text-xl shrink-0" />
      No se pudo conectar al backend. Reintentando cada {{ POLL_MS / 1000 }}s...
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { obtenerEstadoMonitor, type EstadoMonitor } from '@/services/backendService'

const POLL_MS = 2000

const estado = ref<EstadoMonitor>({
  activas: [],
  total_activas: 0,
  historial: [],
  latencia_avg_ms: 0,
  cache_hits: 0,
  total_consultas: 0,
  timestamp: 0,
})

const errorConexion = ref(false)
let intervalo: ReturnType<typeof setInterval>

function tiempoTranscurrido(inicio: number): string {
  return (Date.now() / 1000 - inicio).toFixed(1)
}

const metricas = computed(() => [
  {
    label: 'Consultas activas',
    value: estado.value.total_activas,
    icon:  'mdi:lightning-bolt',
    bg:    'bg-blue-600/10',
    color: 'text-blue-400',
  },
  {
    label: 'Total procesadas',
    value: estado.value.total_consultas,
    icon:  'mdi:chat-processing-outline',
    bg:    'bg-violet-600/10',
    color: 'text-violet-400',
  },
  {
    label: 'Latencia avg LLM',
    value: `${estado.value.latencia_avg_ms} ms`,
    icon:  'mdi:timer-outline',
    bg:    'bg-amber-600/10',
    color: 'text-amber-400',
  },
  {
    label: 'Cache hits',
    value: estado.value.cache_hits,
    icon:  'mdi:database-check-outline',
    bg:    'bg-green-600/10',
    color: 'text-green-400',
  },
])

async function fetchEstado() {
  try {
    estado.value = await obtenerEstadoMonitor()
    errorConexion.value = false
  } catch {
    errorConexion.value = true
  }
}

onMounted(() => {
  fetchEstado()
  intervalo = setInterval(fetchEstado, POLL_MS)
})

onUnmounted(() => clearInterval(intervalo))
</script>