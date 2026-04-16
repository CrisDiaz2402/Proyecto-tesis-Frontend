<!-- src/components/monitor/MonitorConcurrencia.vue -->
<template>
  <div class="flex flex-col gap-6">

    <!-- ── Métricas globales ──────────────────────────────────────────────── -->
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

    <!-- ── Usuarios conectados ahora (sesiones WebSocket abiertas) ────────── -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
        <h3 class="text-sm font-semibold text-white uppercase tracking-wider">
          Usuarios conectados
        </h3>
        <span class="ml-auto px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded border border-gray-600">
          {{ estado.total_conexiones }} en línea
        </span>
      </div>

      <div class="p-4 flex flex-col gap-2 min-h-[80px]">
        <div
          v-if="estado.conexiones.length === 0"
          class="flex items-center justify-center py-4 text-gray-500 text-sm"
        >
          Ningún usuario conectado en este momento
        </div>
        <div
          v-for="c in estado.conexiones"
          :key="c.client_id"
          class="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
        >
          <Icon icon="mdi:account-circle-outline" class="text-emerald-400 text-xl shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white font-medium truncate">{{ c.username }}</p>
            <p class="text-[10px] text-gray-500 font-mono">{{ c.client_id }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xs text-emerald-400 font-mono">{{ tiempoConectado(c.conectado_en) }}</p>
            <p v-if="c.ip" class="text-[10px] text-gray-500">{{ c.ip }}</p>
          </div>
          <span
            v-if="tieneConsultaActiva(c.client_id)"
            class="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded border border-blue-500/30 shrink-0"
          >
            ⚙ procesando
          </span>
        </div>
      </div>
    </div>

    <!-- ── Consultas en proceso ahora mismo ──────────────────────────────── -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
        <h3 class="text-sm font-semibold text-white uppercase tracking-wider">
          Consultas en proceso
        </h3>
        <span class="ml-auto px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded border border-gray-600">
          {{ estado.total_activas }} activa(s)
        </span>
      </div>

      <div class="p-4 flex flex-col gap-2 min-h-[80px]">
        <div
          v-if="estado.activas.length === 0"
          class="flex items-center justify-center py-4 text-gray-500 text-sm"
        >
          Sin consultas activas en este momento
        </div>
        <div
          v-for="c in estado.activas"
          :key="c.id"
          class="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <Icon icon="mdi:loading" class="animate-spin text-blue-400 shrink-0" />
          <span class="text-[10px] font-mono text-gray-400 shrink-0 w-20 truncate">{{ c.client_id }}</span>
          <span class="text-xs font-mono text-blue-300 shrink-0 w-16">{{ c.motor }}</span>
          <span class="text-sm text-gray-200 flex-1 truncate">{{ c.pregunta }}</span>
          <span class="text-xs text-blue-400 font-mono shrink-0">{{ tiempoTranscurrido(c.inicio) }}s</span>
        </div>
      </div>
    </div>

    <!-- ── Historial reciente ─────────────────────────────────────────────── -->
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
              <th class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Usuario</th>
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
                <span class="text-[10px] font-mono text-gray-400">{{ r.client_id }}</span>
              </td>
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

    <!-- ── Banner de error / sin token ───────────────────────────────────── -->
    <div
      v-if="errorConexion"
      class="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm"
    >
      <Icon icon="mdi:wifi-off" class="text-xl shrink-0 mt-0.5" />
      <div class="flex flex-col gap-1">
        <span class="font-semibold">Sin conexión con el monitor</span>
        <span v-if="errorMsg" class="text-xs text-red-400/80">{{ errorMsg }}</span>
        <span v-else class="text-xs text-red-400/80">Reconectando automáticamente...</span>
      </div>
      <!-- Botón de reintento manual si la reconexión automática ya se agotó -->
      <button
        v-if="errorMsg && errorMsg.includes('varios intentos')"
        @click="conectar()"
        class="ml-auto px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
      >
        Reintentar
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useMonitorWebSocket } from '@/composables/useWebSocket'
import { getToken } from '@/services/authService'
import { BACKEND_URL } from '@/config/config'

// Convertir correctamente http → ws / https → wss
const WS_BASE = BACKEND_URL.replace(/^https/, 'wss').replace(/^http/, 'ws')

// Obtener token — si está vacío, useMonitorWebSocket lo detectará y reportará
const token = getToken() ?? ''

const { estado, conectado, errorConexion, errorMsg, conectar } =
  useMonitorWebSocket(WS_BASE, token)

onMounted(() => {
  // No conectar si no hay token — el composable ya pone errorConexion=true en ese caso
  if (token) {
    conectar()
  }
})

// ─── Helpers de tiempo ────────────────────────────────────────────────────────

function tiempoTranscurrido(inicio: number): string {
  const seg = Date.now() / 1000 - inicio
  return seg > 0 ? seg.toFixed(1) : '0.0'
}

function tiempoConectado(desde: number): string {
  const seg = Math.floor(Date.now() / 1000 - desde)
  if (seg < 0)    return '0s'
  if (seg < 60)   return `${seg}s`
  if (seg < 3600) return `${Math.floor(seg / 60)}m ${seg % 60}s`
  return `${Math.floor(seg / 3600)}h ${Math.floor((seg % 3600) / 60)}m`
}

function tieneConsultaActiva(clientId: string): boolean {
  return estado.value.activas.some(a => a.client_id === clientId)
}

// ─── Métricas de cabecera ─────────────────────────────────────────────────────

const metricas = computed(() => [
  {
    label: 'Usuarios en línea',
    value: estado.value.total_conexiones,
    icon:  'mdi:account-multiple',
    bg:    'bg-emerald-600/10',
    color: 'text-emerald-400',
  },
  {
    label: 'Consultas activas',
    value: estado.value.total_activas,
    icon:  'mdi:lightning-bolt',
    bg:    'bg-blue-600/10',
    color: 'text-blue-400',
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
</script>