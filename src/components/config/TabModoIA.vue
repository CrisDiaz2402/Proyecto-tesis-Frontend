<!-- src/components/config/TabModoIA.vue -->
<template>
  <div>

    <div class="mb-6">
      <h2 class="text-base font-semibold text-white">Modo de Inferencia</h2>
      <p class="text-gray-400 text-sm mt-1">
        Elige la combinación de motores que usará el asistente. Cada modo tiene un balance distinto de privacidad, velocidad y calidad.
      </p>
    </div>

    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
      <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
        <Icon icon="mdi:tune-variant" class="text-blue-400 text-xl" />
        <h3 class="text-sm font-semibold text-white uppercase tracking-wider">Motor RAG Activo</h3>
      </div>

      <div class="p-6">

        <div v-if="cargando" class="flex justify-center py-10">
          <Icon icon="mdi:loading" class="animate-spin text-5xl text-blue-500" />
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <label
            v-for="modo in MODOS_IA"
            :key="modo.id"
            :class="[
              'relative flex flex-col p-5 border rounded-xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg',
              modoSeleccionado === modo.id
                ? colorActivo(modo.color)
                : 'bg-gray-900/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
            ]"
          >
            <input type="radio" :value="modo.id" v-model="modoSeleccionado" class="sr-only" />

            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div :class="['p-2 rounded-lg', modoSeleccionado === modo.id ? iconColor(modo.color) : 'bg-gray-800 text-gray-500']">
                  <Icon :icon="modo.icono" class="text-2xl" />
                </div>
                <span class="text-white font-bold text-sm leading-tight">{{ modo.label }}</span>
              </div>
              <Icon
                v-if="modoSeleccionado === modo.id"
                icon="mdi:check-circle"
                :class="['text-2xl animate-pop-in', checkColor(modo.color)]"
              />
            </div>

            <p class="text-xs text-gray-400 leading-relaxed mb-3">{{ modo.descripcion }}</p>

            <div class="flex flex-wrap gap-2 mt-auto">
              <span class="flex items-center gap-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded-md text-[10px] font-semibold text-gray-300 uppercase">
                <Icon icon="mdi:database-search-outline" class="text-xs" />
                {{ modo.motor_vectores === 'cloud' ? 'Gemini Embed' : 'sentence-transformers' }}
              </span>
              <span class="flex items-center gap-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded-md text-[10px] font-semibold text-gray-300 uppercase">
                <Icon icon="mdi:brain" class="text-xs" />
                {{ modo.motor_llm === 'cloud' ? 'Gemini Flash' : 'vLLM (Qwen2.5)'}}
              </span>
            </div>
          </label>
        </div>

        <div class="flex justify-end pt-5 border-t border-gray-700">
          <button
            @click="guardar"
            :disabled="cargando || guardando"
            class="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all"
          >
            <Icon v-if="guardando" icon="mdi:loading" class="animate-spin text-lg" />
            <Icon v-else icon="mdi:content-save-outline" class="text-lg" />
            {{ guardando ? 'Aplicando cambios...' : 'Guardar Configuración' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import { toast } from 'vue3-toastify'
import {
  obtenerConfiguracionIA,
  actualizarConfiguracionIA,
  MODOS_IA,
  type MotorTipo,
} from '@/services/backendService'

const modoSeleccionado = ref<string>('local:local')
const cargando  = ref(true)
const guardando = ref(false)

const colorActivo = (color: string): string => ({
  blue:    'bg-blue-900/20 border-blue-500 ring-1 ring-blue-500',
  emerald: 'bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500',
  violet:  'bg-violet-900/20 border-violet-500 ring-1 ring-violet-500',
  amber:   'bg-amber-900/20 border-amber-500 ring-1 ring-amber-500',
}[color] ?? 'bg-blue-900/20 border-blue-500 ring-1 ring-blue-500')

const iconColor = (color: string): string => ({
  blue:    'bg-blue-600/20 text-blue-400',
  emerald: 'bg-emerald-600/20 text-emerald-400',
  violet:  'bg-violet-600/20 text-violet-400',
  amber:   'bg-amber-600/20 text-amber-400',
}[color] ?? 'bg-blue-600/20 text-blue-400')

const checkColor = (color: string): string => ({
  blue:    'text-blue-500',
  emerald: 'text-emerald-500',
  violet:  'text-violet-500',
  amber:   'text-amber-500',
}[color] ?? 'text-blue-500')

onMounted(async () => {
  try {
    const config = await obtenerConfiguracionIA()
    modoSeleccionado.value = `${config.motor_vectores}:${config.motor_llm}`
  } catch {
    toast.error('Error al cargar la configuración actual de la IA.')
  } finally {
    cargando.value = false
  }
})

const guardar = async () => {
  guardando.value = true
  try {
    const [motor_vectores, motor_llm] = modoSeleccionado.value.split(':') as [MotorTipo, MotorTipo]
    await actualizarConfiguracionIA({ motor_vectores, motor_llm })
    toast.success('Configuración guardada correctamente.')
  } catch (error: any) {
    toast.error(error.message || 'Error al guardar la configuración.')
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.animate-pop-in {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes popIn {
  0%   { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1);   opacity: 1; }
}
</style>