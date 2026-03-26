<template>
  <div class="p-8">

    <!-- Saludo -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Bienvenido, {{ authStore.username }} 👋</h1>
      <p class="text-gray-400 text-sm mt-1">Panel de administración — Asistente Virtual EPN</p>
    </div>

    <!-- Tarjetas de resumen -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4"
      >
        <div :class="`p-3 rounded-xl ${card.bg}`">
          <Icon :icon="card.icon" :class="`text-2xl ${card.color}`" />
        </div>
        <div>
          <p class="text-2xl font-bold text-white">{{ card.value }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ card.label }}</p>
        </div>
      </div>
    </div>

    <!-- Accesos rápidos -->
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Accesos rápidos</h2>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <RouterLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="bg-gray-800 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-700 rounded-xl p-5 flex items-center gap-4 transition-all group"
      >
        <div class="p-3 bg-blue-600/10 rounded-xl group-hover:bg-blue-600/20 transition-colors">
          <Icon :icon="link.icon" class="text-2xl text-blue-400" />
        </div>
        <div>
          <p class="text-sm font-semibold text-white">{{ link.label }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ link.desc }}</p>
        </div>
        <Icon icon="mdi:chevron-right" class="ml-auto text-gray-600 group-hover:text-gray-400 transition-colors" />
      </RouterLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const statCards = [
  { label: 'Consultas hoy',      value: '—', icon: 'mdi:chat-outline',             bg: 'bg-blue-600/10',   color: 'text-blue-400'   },
  { label: 'Documentos activos', value: '1', icon: 'mdi:file-document-outline',    bg: 'bg-green-600/10',  color: 'text-green-400'  },
  { label: 'Faithfulness avg',   value: '—', icon: 'mdi:chart-line',               bg: 'bg-purple-600/10', color: 'text-purple-400' },
  { label: 'Estado del sistema', value: 'OK',icon: 'mdi:check-circle-outline',     bg: 'bg-emerald-600/10',color: 'text-emerald-400' },
]

const quickLinks = [
  { to: '/dashboard/avatar',    label: 'Asistente Virtual', desc: 'Hablar con el avatar',          icon: 'mdi:robot-outline'          },
  { to: '/dashboard/metrics',   label: 'Métricas RAG',      desc: 'Ver Faithfulness y latencias',  icon: 'mdi:chart-bar'              },
  { to: '/dashboard/documents', label: 'Documentos',        desc: 'Gestionar la base de conocimiento', icon: 'mdi:file-document-outline' },
]
</script>