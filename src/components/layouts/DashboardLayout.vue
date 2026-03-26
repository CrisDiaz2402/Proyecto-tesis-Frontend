<template>
  <div class="min-h-screen bg-gray-900 flex">

    <aside class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0">

      <div class="px-6 py-5 border-b border-gray-700 flex items-center gap-3">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <Icon icon="mdi:robot-outline" class="text-white text-lg" />
        </div>
        <div>
          <p class="text-white text-sm font-bold leading-tight">Asistente EPN</p>
          <p class="text-gray-500 text-xs">Panel Admin</p>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 flex flex-col gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          :class="isActive(item.to)
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:bg-gray-700 hover:text-white'"
        >
          <Icon :icon="item.icon" class="text-xl shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="px-4 py-4 border-t border-gray-700">
        <RouterLink
          to="/"
          class="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-900/20 transition-all"
        >
          <Icon icon="mdi:robot-3d" class="text-xl" />
          Ir al Asistente 3D
        </RouterLink>
      </div>

      <div class="px-4 py-4 border-t border-gray-700">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-300">
            A
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate">Administrador</p>
            <p class="text-gray-500 text-xs truncate">admin@epn.edu.ec</p>
          </div>
        </div>
        <button
          @click="logout"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Icon icon="mdi:logout" class="text-lg" />
          Cerrar sesión
        </button>
      </div>

    </aside>

    <div class="flex-1 flex flex-col min-w-0">

      <header class="h-14 bg-gray-800 border-b border-gray-700 px-6 flex items-center justify-between shrink-0">
        <h1 class="text-white text-sm font-semibold">{{ paginaActual }}</h1>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span class="text-gray-400 text-xs">Sistema RAG Online</span>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const navItems = [
  { to: '/admin/documents', label: 'Documentos', icon: 'mdi:file-document-outline' },
  { to: '/admin/metrics',   label: 'Métricas',   icon: 'mdi:chart-bar'             },
  { to: '/admin/users',     label: 'Usuarios',   icon: 'mdi:account-group-outline' },
]

const isActive = (path: string) => route.path.startsWith(path)

const paginaActual = computed(() => {
  const item = navItems.find(i => isActive(i.to))
  return item ? item.label : 'Panel de Administración'
})

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>