<template>
  <div class="h-screen bg-gray-50 flex overflow-hidden">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/40 z-30 lg:hidden"
      @click="sidebarOpen = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto transition-transform duration-200 lg:static lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="px-6 py-5 border-b border-gray-200 flex items-center gap-3">
        <img src="/logo.svg" alt="Logo sistema" class="w-10 h-10 object-contain" />
        <div>
          <p class="text-gray-800 text-sm font-bold leading-tight">FisBot</p>
          <p class="text-gray-500 text-xs">Panel Admin</p>
        </div>
        <button
          class="ml-auto text-gray-500 hover:text-gray-900 lg:hidden"
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
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
          @click="sidebarOpen = false"
        >
          <Icon :icon="item.icon" class="text-xl shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="px-4 py-4 border-t border-gray-200">
        <RouterLink
          to="/"
          class="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all"
          @click="sidebarOpen = false"
        >
          <Icon icon="tabler:message-chatbot-filled" width="24" height="24" />
          Ir al Asistente
        </RouterLink>
      </div>

      <div class="px-4 py-4 border-t border-gray-200">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
            A
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-gray-800 text-sm font-medium truncate">Administrador</p>
            <p class="text-gray-500 text-xs truncate">admin@epn.edu.ec</p>
          </div>
        </div>
        <button
          @click="logout"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Icon icon="mdi:logout" class="text-lg" />
          Cerrar sesión
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <button
        class="fixed top-3 left-3 z-50 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm lg:hidden"
        @click="sidebarOpen = true"
      >
        <Icon icon="mdi:menu" class="text-xl" />
      </button>

      <main class="flex-1 overflow-y-auto">
        <RouterView v-slot="{ Component, route }">
          <template v-if="Component">
            <Suspense>
              <template #default>
                <component :is="Component" :key="route.path" />
              </template>
              <template #fallback>
                <div class="flex h-full items-center justify-center bg-gray-50">
                  <div class="flex flex-col items-center gap-3">
                    <Icon icon="mdi:loading" class="text-4xl text-blue-500 animate-spin" />
                    <span class="text-gray-500 text-sm animate-pulse">Cargando módulo...</span>
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
import { ref } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarOpen = ref(false)

const navItems = [
  { to: '/admin/documents', label: 'Documentos', icon: 'mdi:file-document-outline' },
  { to: '/admin/config', label: 'Configuraciones', icon: 'mdi:cog-outline' },
  { to: '/admin/monitor', label: 'Monitor', icon: 'mdi:monitor-eye' },
  { to: '/admin/memoria', label: 'Memoria', icon: 'mdi:database-eye-outline' },
  { to: '/admin/users', label: 'Usuarios', icon: 'mdi:account-group-outline' },
]

const isActive = (path: string) => route.path.startsWith(path)

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>