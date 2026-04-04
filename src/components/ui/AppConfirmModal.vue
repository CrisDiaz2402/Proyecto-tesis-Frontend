<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
    @click.self="cancelar"
  >
    <div class="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-pop-in">
      
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white flex items-center gap-2">
          <Icon v-if="isDestructive" icon="mdi:alert-circle-outline" class="text-red-500 text-xl" />
          <Icon v-else icon="mdi:help-circle-outline" class="text-blue-500 text-xl" />
          {{ title }}
        </h3>
        <button @click="cancelar" :disabled="isLoading" class="text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50">
          <Icon icon="mdi:close" class="text-xl" />
        </button>
      </div>

      <p class="text-gray-400 text-sm mb-6 whitespace-pre-wrap leading-relaxed">
        {{ message }}
      </p>

      <div class="flex gap-3">
        <button
          @click="cancelar"
          :disabled="isLoading"
          class="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {{ cancelText }}
        </button>
        <button
          @click="confirmar"
          :disabled="isLoading"
          :class="[
            'flex-1 flex justify-center items-center gap-2 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50',
            isDestructive ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
          ]"
        >
          <Icon v-if="isLoading" icon="mdi:loading" class="animate-spin text-lg" />
          {{ confirmText }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

// ── Props (Datos que recibe el modal) ──
const props = withDefaults(defineProps<{
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
}>(), {
  title: 'Confirmar acción',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
  isDestructive: true,
  isLoading: false
})

// ── Emits (Eventos que dispara hacia la vista padre) ──
const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const confirmar = () => emit('confirm')
const cancelar  = () => {
  if (!props.isLoading) emit('cancel')
}
</script>

<style scoped>
.animate-pop-in {
  animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes popIn {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>