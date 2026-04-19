// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { hayTokenGuardado } from '@/services/authService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

    {
      path: '/',
      name: 'avatar',
      component: () => import('@/views/AvatarView.vue'),
    },

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
        {
          path: 'evaluacion',
          name: 'admin-evaluacion',
          component: () => import('@/views/EvaluacionView.vue'),
        },
        {
          path: 'monitor',
          name: 'admin-monitor',
          component: () => import('@/views/MonitorView.vue'),
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/UsersView.vue'),
        },
        {
          path: 'nlu',
          name: 'admin-nlu',
          component: () => import('@/views/NluConfigView.vue'),
        },
      ],
    },
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