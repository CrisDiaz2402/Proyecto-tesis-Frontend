<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Monitor de Usuarios</h1>
        <p class="text-gray-500 text-sm mt-1">Seguimiento en tiempo real de conexiones y consultas del sistema</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span class="text-gray-500 text-xs">WebSocket en tiempo real</span>
      </div>
    </div>

    <MonitorConcurrencia />
  </div>
</template>

<script setup lang="ts">
import MonitorConcurrencia from '@/components/monitor/MonitorConcurrencia.vue'
</script>