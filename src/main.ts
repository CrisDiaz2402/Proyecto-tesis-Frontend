// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'

// --- Importaciones de Toastify ---
import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// --- Configuración Global de Toasts ---
app.use(Vue3Toastify, {
  autoClose: 2500,           // 2.5 segundos de duración
  position: 'bottom-right',  // No estorba la navegación superior
  theme: 'dark',             // Combina con el diseño de tu panel
  clearOnUrlChange: false,
} as ToastContainerOptions)

app.mount('#app')