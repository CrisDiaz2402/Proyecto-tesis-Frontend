// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

import './style.css'
import App from './App.vue'
import router from './router'

import { Icon } from '@iconify/vue' 

const app = createApp(App)
app.component('Icon', Icon)
app.use(createPinia())
app.use(router)

app.use(Vue3Toastify, {
  autoClose: 2500,           
  position: 'bottom-right',  
  theme: 'dark',             
  clearOnUrlChange: false,
} as ToastContainerOptions)

app.mount('#app')