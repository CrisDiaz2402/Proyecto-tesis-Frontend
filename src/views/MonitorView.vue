<!-- src/views/MonitorView.vue -->
<template>
  <div class="p-8">

    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Monitor de Concurrencia</h1>
      <p class="text-gray-400 text-sm mt-1">
        Vista en tiempo real de las consultas activas, historial y métricas del sistema RAG.
        Se actualiza cada 2 segundos.
      </p>
    </div>

    <MonitorConcurrencia />

  </div>
</template>

<script setup lang="ts">
import MonitorConcurrencia from '@/components/monitor/MonitorConcurrencia.vue'
</script>