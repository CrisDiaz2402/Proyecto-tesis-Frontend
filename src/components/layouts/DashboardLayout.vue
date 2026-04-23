<template>
  <div class="h-screen bg-gray-900 flex overflow-hidden">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-30 lg:hidden"
      @click="sidebarOpen = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0 overflow-y-auto transition-transform duration-200 lg:static lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="px-6 py-5 border-b border-gray-700 flex items-center gap-3">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <Icon icon="mdi:robot-outline" class="text-white text-lg" />
        </div>
        <div>
          <p class="text-white text-sm font-bold leading-tight">Asistente EPN</p>
          <p class="text-gray-500 text-xs">Panel Admin</p>
        </div>
        <button
          class="ml-auto text-gray-400 hover:text-white lg:hidden"
          @click="sidebarOpen = false"
        >
          <Icon icon="mdi:close" class="text-xl" />
        </button>
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
          @click="sidebarOpen = false"
        >
          <Icon :icon="item.icon" class="text-xl shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="px-4 py-4 border-t border-gray-700">
        <RouterLink
          to="/"
          class="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-900/20 transition-all"
          @click="sidebarOpen = false"
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
      <header class="h-14 bg-gray-800 border-b border-gray-700 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <button
            class="text-gray-400 hover:text-white lg:hidden"
            @click="sidebarOpen = true"
          >
            <Icon icon="mdi:menu" class="text-2xl" />
          </button>
          <h1 class="text-white text-sm font-semibold">{{ paginaActual }}</h1>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span class="text-gray-400 text-xs">Sistema RAG Online</span>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto">
        <RouterView v-slot="{ Component, route }">
          <template v-if="Component">
            <Suspense>
              <template #default>
                <component :is="Component" :key="route.path" />
              </template>
              <template #fallback>
                <div class="flex h-full items-center justify-center bg-gray-900">
                  <div class="flex flex-col items-center gap-3">
                    <Icon icon="mdi:loading" class="text-4xl text-blue-500 animate-spin" />
                    <span class="text-gray-400 text-sm animate-pulse">Cargando módulo...</span>
                  </div>
                </div>
              </template>
            </Suspense>
          </template>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarOpen = ref(false)

const navItems = [
  { to: '/admin/documents', label: 'Documentos', icon: 'mdi:file-document-outline' },
  { to: '/admin/config', label: 'Configuración IA', icon: 'mdi:brain' },
  { to: '/admin/nlu', label: 'Control de Intención', icon: 'mdi:message-cog-outline' },
  { to: '/admin/evaluacion', label: 'Evaluador RAG', icon: 'mdi:test-tube' },
  { to: '/admin/monitor', label: 'Monitor', icon: 'mdi:monitor-eye' },
  { to: '/admin/memoria', label: 'Memoria', icon: 'mdi:database-eye-outline' },
  { to: '/admin/users', label: 'Usuarios', icon: 'mdi:account-group-outline' },
]

const isActive = (path: string) => route.path.startsWith(path)

const paginaActual = computed(() => {
  const item = navItems.find((i) => isActive(i.to))
  return item ? item.label : 'Panel de Administración'
})

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>