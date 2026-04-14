// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { hayTokenGuardado } from '@/services/authService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

    // ─── SUBSISTEMA 1: AVATAR PÚBLICO ─────────────────────────────────────────
    {
      path: '/',
      name: 'avatar',
      component: () => import('@/views/AvatarView.vue'),
    },

    // ─── SUBSISTEMA 2: PANEL ADMIN ────────────────────────────────────────────
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/admin',
      component: () => import('@/components/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: { name: 'admin-documents' },
        },
        {
          path: 'documents',
          name: 'admin-documents',
          component: () => import('@/views/DocumentsView.vue'),
        },
        {
          path: 'config',
          name: 'admin-config',
          component: () => import('@/views/ConfiguracionView.vue'),
        },
        // ── EVALUADOR RAG ──────────────────────────────────────────────────────
        {
          path: 'evaluacion',
          name: 'admin-evaluacion',
          component: () => import('@/views/EvaluacionView.vue'),
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/UsersView.vue'),
        },
        // ── MONITOR DE CONCURRENCIA ────────────────────────────────────────────
        {
          path: 'monitor',
          name: 'admin-monitor',
          component: () => import('@/views/MonitorView.vue'),
        },
      ],
    },

    // ─── FALLBACK ─────────────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  const autenticado = authStore.isLoggedIn || hayTokenGuardado()

  if (to.meta.requiresAuth && !autenticado) {
    return { name: 'login' }
  }

  if (to.name === 'login' && autenticado) {
    return { name: 'admin-documents' }
  }
})

export default router