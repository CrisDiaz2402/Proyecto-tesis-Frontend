<template>
  <div class="p-4 sm:p-6 lg:p-8">

    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Configuraciones</h1>
        <p class="text-gray-500 text-sm mt-1">Gestión del motor de IA, parámetros RAG y control de intención</p>
      </div>

      <div v-if="tabActivo === 'rag-params'" class="flex items-center gap-2 shrink-0">
        <button
          @click="tabRagRef!.confirmarReset = true"
          :disabled="tabRagRef?.guardando || tabRagRef?.reseteando || tabRagRef?.cargando"
          class="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 text-sm font-semibold rounded-lg transition-colors"
        >
          <Icon icon="mdi:restore" class="text-lg" />
          Restablecer
        </button>
        <button
          @click="tabRagRef?.guardarTodo()"
          :disabled="tabRagRef?.guardando || tabRagRef?.reseteando || tabRagRef?.hayErrores || !tabRagRef?.hayCambios || tabRagRef?.cargando"
          class="flex items-center gap-2 px-6 py-2.5 text-white text-sm font-semibold rounded-lg shadow-lg transition-all"
          :class="tabRagRef?.hayCambios && !tabRagRef?.hayErrores
            ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'"
        >
          <Icon v-if="tabRagRef?.guardando" icon="mdi:loading" class="animate-spin text-lg" />
          <Icon v-else icon="mdi:content-save-outline" class="text-lg" />
          {{ tabRagRef?.guardando ? 'Guardando...' : tabRagRef?.hayCambios ? 'Guardar' : 'Sin cambios' }}
        </button>
      </div>

      <div v-else-if="tabActivo === 'nlu-config' && tabNluRef?.form && !tabNluRef?.cargando && !tabNluRef?.errorCarga" class="flex items-center gap-2 shrink-0">
        <button
          @click="tabNluRef!.confirmarReset = true"
          :disabled="tabNluRef?.guardando || tabNluRef?.reseteando"
          class="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 text-sm font-semibold rounded-lg transition-colors"
        >
          <Icon icon="mdi:restore" class="text-lg" />
          Restablecer
        </button>
        <button
          @click="tabNluRef?.guardar()"
          :disabled="tabNluRef?.guardando || tabNluRef?.reseteando"
          class="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
        >
          <Icon v-if="tabNluRef?.guardando" icon="mdi:loading" class="animate-spin text-lg" />
          <Icon v-else icon="mdi:content-save-outline" class="text-lg" />
          {{ tabNluRef?.guardando ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="tabActivo = tab.id"
        :class="[
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
          tabActivo === tab.id
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        ]"
      >
        <Icon :icon="tab.icon" class="text-base" />
        {{ tab.label }}
      </button>
    </div>

    <TabInfoMotor v-if="tabActivo === 'motor-ia'" />

    <TabRagParams
      v-else-if="tabActivo === 'rag-params'"
      ref="tabRagRef"
    />

    <TabNluConfig v-else-if="tabActivo === 'nlu-config'" ref="tabNluRef" />



  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import TabInfoMotor from '@/components/config/TabInfoMotor.vue'
import TabRagParams from '@/components/config/TabRagParams.vue'
import TabNluConfig from '@/components/config/TabNluConfig.vue'

const tabRagRef = ref<InstanceType<typeof TabRagParams> | null>(null)
const tabNluRef = ref<InstanceType<typeof TabNluConfig> | null>(null)

const tabs = [
  { id: 'motor-ia',   label: 'Motor de IA',          icon: 'mdi:chip'                },
  { id: 'rag-params', label: 'Parámetros y Prompt',   icon: 'mdi:tune-variant'        },
  { id: 'nlu-config', label: 'Control de Intención',  icon: 'mdi:message-cog-outline' },
] as const

type TabId = typeof tabs[number]['id']

const tabActivo = ref<TabId>('motor-ia')
</script>
