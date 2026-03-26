// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
          redirect: { name: 'admin-documents' },   // /admin → documentos directo
        },
        {
          path: 'documents',
          name: 'admin-documents',
          component: () => import('@/views/DocumentsView.vue'),
        },
        {
          path: 'metrics',
          name: 'admin-metrics',
          component: () => import('@/views/MetricsView.vue'),
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/UsersView.vue'),
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

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isLoggedIn) {
    return { name: 'admin-documents' }
  }
})

export default router