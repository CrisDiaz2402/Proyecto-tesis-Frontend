<template>
  <div class="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div class="bg-gray-800 border border-gray-700 rounded-2xl p-10 max-w-md">
      <Icon icon="mdi:test-tube" class="text-5xl text-blue-400 mb-4 mx-auto" />
      <h1 class="text-xl font-bold text-white mb-2">Vista reemplazada</h1>
      <p class="text-gray-400 text-sm mb-6 leading-relaxed">
        El evaluador de métricas fue reemplazado por el
        <strong class="text-white">Evaluador RAG</strong>, que ejecuta evaluaciones
        en tiempo real con tu banco de preguntas.
      </p>
      <RouterLink
        to="/admin/evaluacion"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <Icon icon="mdi:arrow-right" class="text-lg" />
        Ir al Evaluador RAG
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
</script>