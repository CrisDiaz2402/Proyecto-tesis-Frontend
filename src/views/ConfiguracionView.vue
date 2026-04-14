<!-- src/views/ConfiguracionView.vue -->
<!--
  Vista principal de configuración del asistente.
  Orquesta la navegación por tabs entre las secciones:
    - Modo IA: selección del motor de inferencia
    - Parámetros RAG: ajuste avanzado de parámetros del sistema RAG
    - Prompts: edición de los prompts principal e HyDE
-->
<template>
  <div class="p-8">

    <!-- Cabecera de la vista -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Configuración del Asistente</h1>
      <p class="text-gray-400 text-sm mt-1">
        Gestiona el motor de IA, los parámetros avanzados y los prompts del sistema RAG.
      </p>
    </div>

    <!-- Navegación por tabs -->
    <div class="flex items-center gap-1 mb-6 bg-gray-800 border border-gray-700 rounded-xl p-1 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="tabActivo = tab.id"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          tabActivo === tab.id
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-white hover:bg-gray-700',
        ]"
      >
        <Icon :icon="tab.icono" class="text-base" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Contenido del tab activo -->
    <div>
      <TabModoIA    v-if="tabActivo === 'modo'"    />
      <TabRagParams v-if="tabActivo === 'rag'"     />
      <TabPrompts   v-if="tabActivo === 'prompts'" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import TabModoIA    from '@/components/config/TabModoIA.vue'
import TabRagParams from '@/components/config/TabRagParams.vue'
import TabPrompts   from '@/components/config/TabPrompts.vue'

const tabs = [
  { id: 'modo',    label: 'Modo de IA',       icono: 'mdi:tune-variant'        },
  { id: 'rag',     label: 'Parámetros RAG',   icono: 'mdi:sliders-horizontal'  },
  { id: 'prompts', label: 'Prompts',          icono: 'mdi:text-box-edit-outline' },
] as const

type TabId = typeof tabs[number]['id']

const tabActivo = ref<TabId>('modo')
</script>