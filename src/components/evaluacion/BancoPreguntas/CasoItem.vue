<!-- src/components/evaluacion/BancoPreguntas/CasoItem.vue -->
<!--
  Una fila de la lista de casos de evaluación.
  Muestra: badge grupo, badge tipo, pregunta truncada, claves, acciones.
  El toggle de habilitado cambia el estado sin abrir el modal.
-->
<template>
  <div
    :class="[
      'flex items-start gap-3 p-4 rounded-xl border transition-all',
      caso.habilitado
        ? 'bg-gray-800/60 border-gray-700 hover:border-gray-600'
        : 'bg-gray-900/40 border-gray-700/40 opacity-50',
    ]"
  >

    <!-- Toggle habilitado -->
    <button
      type="button"
      :title="caso.habilitado ? 'Deshabilitar caso' : 'Habilitar caso'"
      @click="$emit('toggle', caso.id)"
      :class="[
        'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
        caso.habilitado
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'border-gray-600 text-transparent',
      ]"
    >
      <Icon icon="mdi:check" class="text-xs" />
    </button>

    <!-- Contenido principal -->
    <div class="flex-1 min-w-0 flex flex-col gap-2">

      <!-- Fila superior: badges + ID -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[10px] font-bold text-gray-500 font-mono">{{ caso.id }}</span>

        <!-- Badge grupo -->
        <span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', colorGrupo]">
          {{ caso.grupo }}
        </span>

        <!-- Badge tipo -->
        <span :class="['px-2 py-0.5 rounded-full text-[10px] font-semibold border', colorTipo]">
          {{ caso.tipo }}
        </span>
      </div>

      <!-- Pregunta -->
      <p class="text-sm text-gray-200 leading-snug line-clamp-2">{{ caso.pregunta }}</p>

      <!-- Claves -->
      <div class="flex flex-wrap gap-1">
        <span
          v-for="(clave, i) in caso.claves.slice(0, 5)"
          :key="i"
          class="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-300 font-mono"
        >
          {{ clave }}
        </span>
        <span
          v-if="caso.claves.length > 5"
          class="px-1.5 py-0.5 bg-gray-700 rounded text-[10px] text-gray-500"
        >
          +{{ caso.claves.length - 5 }} más
        </span>
        <!-- Claves prohibidas (si las hay) -->
        <template v-if="caso.claves_prohibidas.length > 0">
          <span class="text-[10px] text-gray-600 self-center">|</span>
          <span
            v-for="(cp, i) in caso.claves_prohibidas.slice(0, 3)"
            :key="'p' + i"
            class="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 font-mono"
          >
            ✕ {{ cp }}
          </span>
          <span
            v-if="caso.claves_prohibidas.length > 3"
            class="px-1.5 py-0.5 bg-gray-700 rounded text-[10px] text-gray-500"
          >
            +{{ caso.claves_prohibidas.length - 3 }}
          </span>
        </template>
      </div>

      <!-- Descripción (si existe) -->
      <p v-if="caso.descripcion" class="text-[11px] text-gray-500 italic leading-relaxed">
        {{ caso.descripcion }}
      </p>

    </div>

    <!-- Acciones -->
    <div class="flex items-center gap-1 shrink-0">
      <button
        type="button"
        title="Editar caso"
        @click="$emit('editar', caso)"
        class="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
      >
        <Icon icon="mdi:pencil-outline" class="text-base" />
      </button>
      <button
        type="button"
        title="Eliminar caso"
        @click="$emit('eliminar', caso.id)"
        class="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
      >
        <Icon icon="mdi:trash-can-outline" class="text-base" />
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { CasoEvaluacion } from '@/services/backendService'

const props = defineProps<{
  caso: CasoEvaluacion
}>()

defineEmits<{
  toggle:   [id: string]
  editar:   [caso: CasoEvaluacion]
  eliminar: [id: string]
}>()

const colorGrupo = computed(() => {
  const mapa: Record<string, string> = {
    'TP Directo':        'bg-green-500/15  text-green-400  border border-green-500/30',
    'TP Razonamiento':   'bg-teal-500/15   text-teal-400   border border-teal-500/30',
    'TN Fuera dominio':  'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    'Corrección':        'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    'Anti-alucinación':  'bg-red-500/15    text-red-400    border border-red-500/30',
    'Interpretación':    'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  }
  return mapa[props.caso.grupo] ?? 'bg-gray-700 text-gray-400 border border-gray-600'
})

const colorTipo = computed(() => {
  const mapa: Record<string, string> = {
    contiene:    'bg-blue-500/10   text-blue-400   border-blue-500/30',
    no_contiene: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    corrige:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    no_alucina:  'bg-red-500/10    text-red-400    border-red-500/30',
  }
  return mapa[props.caso.tipo] ?? 'bg-gray-700 text-gray-400 border-gray-600'
})
</script>