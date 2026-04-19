<!-- src/components/evaluacion/BancoPreguntas/BancoPreguntasSection.vue -->
<template>
  <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">

    <!-- Header de la sección -->
    <div class="px-4 sm:px-6 py-4 border-b border-gray-700 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Icon icon="mdi:format-list-checks" class="text-blue-400 text-xl" />
        <div>
          <h2 class="text-sm font-bold text-white">Banco de Preguntas</h2>
          <p class="text-[11px] text-gray-500">
            {{ casosHabilitados }} de {{ casos.length }} caso{{ casos.length !== 1 ? 's' : '' }} habilitado{{ casosHabilitados !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="deshacerCambio"
          :disabled="!canUndo"
          title="Deshacer último cambio"
          :class="[
            'p-2 rounded-lg transition-all',
            canUndo
              ? 'text-gray-500 hover:text-blue-400 hover:bg-blue-400/10'
              : 'text-gray-700 cursor-not-allowed',
          ]"
        >
          <Icon icon="mdi:undo" class="text-lg" />
        </button>
        <button
          @click="resetearBanco"
          title="Restaurar casos por defecto"
          class="p-2 text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all"
        >
          <Icon icon="mdi:restore" class="text-lg" />
        </button>
        <button
          @click="abrirModalCrear"
          class="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Icon icon="mdi:plus" class="text-base" />
          Nuevo caso
        </button>
      </div>
    </div>

    <div class="px-4 sm:px-6 py-3 border-b border-gray-700/50 flex flex-wrap items-center gap-3">

      <div class="flex items-center gap-2 flex-1 min-w-[200px]">
        <label class="text-xs text-gray-500 whitespace-nowrap">Experimento:</label>
        <input
          :value="experimento"
          @input="$emit('update:experimento', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="baseline"
          class="flex-1 px-2.5 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
        />
      </div>

      <div class="flex items-center gap-2">
        <label class="text-xs text-gray-500">Filtrar:</label>
        <select
          v-model="filtroGrupo"
          class="px-2.5 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
        >
          <option value="">Todos los grupos</option>
          <option v-for="g in gruposUnicos" :key="g" :value="g">{{ g }}</option>
        </select>
      </div>

    </div>

    <div class="p-4 flex flex-col gap-2 max-h-[520px] overflow-y-auto">

      <p v-if="casosFiltrados.length === 0" class="text-center text-gray-500 text-sm py-8">
        No hay casos en este grupo. Agrega uno con el botón "Nuevo caso".
      </p>

      <CasoItem
        v-for="caso in casosFiltrados"
        :key="caso.id"
        :caso="caso"
        @toggle="toggleHabilitado"
        @editar="abrirModalEditar"
        @eliminar="confirmarEliminar"
      />

    </div>

    <div class="px-4 sm:px-6 py-4 border-t border-gray-700 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

      <div class="flex items-center gap-2 text-xs text-gray-500">
        <Icon icon="mdi:information-outline" class="text-gray-600" />
        <span>Motor activo:
          <span class="text-gray-300 font-mono font-semibold">{{ motorActivo }}</span>
        </span>
      </div>

      <button
        @click="lanzar"
        :disabled="casosHabilitados === 0 || evaluando"
        :class="[
          'flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all shadow-lg w-full sm:w-auto',
          casosHabilitados === 0 || evaluando
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30',
        ]"
      >
        <Icon v-if="evaluando" icon="mdi:loading" class="animate-spin text-lg" />
        <Icon v-else icon="mdi:play-circle-outline" class="text-lg" />
        {{ evaluando ? `Evaluando... (${casosHabilitados} casos)` : `Evaluar ${casosHabilitados} caso${casosHabilitados !== 1 ? 's' : ''}` }}
      </button>

    </div>

  </div>

  <CasoModal
    :abierto="modalAbierto"
    :caso-inicial="casoEditando"
    @cerrar="cerrarModal"
    @guardar="onGuardarCaso"
  />

  <AppConfirmModal
    :isOpen="confirmEliminar.show"
    title="Eliminar caso"
    :message="`¿Eliminar el caso '${confirmEliminar.id}'? Esta acción es irreversible.`"
    confirmText="Eliminar"
    :isLoading="false"
    isDestructive
    @confirm="ejecutarEliminar"
    @cancel="confirmEliminar.show = false"
  />

</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'

import type { CasoEvaluacion } from '@/services/backendService'
import { cargarBanco, guardarBanco, CASOS_DEFAULT, clonarCaso } from '@/types/evaluacion'
import { useBancoHistory } from '@/composables/useBancoHistory'
import CasoItem from './CasoItem.vue'
import CasoModal from './CasoModal.vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'

const props = defineProps<{
  experimento:  string
  motorActivo:  string
  evaluando:    boolean
}>()

const emit = defineEmits<{
  'update:experimento': [val: string]
  lanzar: [casos: CasoEvaluacion[], experimento: string]
}>()

const casos       = ref<CasoEvaluacion[]>(cargarBanco())
const { canUndo, undo, pushSnapshot } = useBancoHistory(casos.value)
const filtroGrupo = ref('')
const modalAbierto = ref(false)
const casoEditando = ref<CasoEvaluacion | null>(null)

const confirmEliminar = reactive({ show: false, id: '' })

const casosHabilitados = computed(() => casos.value.filter(c => c.habilitado).length)

const gruposUnicos = computed(() =>
  [...new Set(casos.value.map(c => c.grupo))].sort(),
)

const casosFiltrados = computed(() =>
  filtroGrupo.value
    ? casos.value.filter(c => c.grupo === filtroGrupo.value)
    : casos.value,
)

function toggleHabilitado(id: string) {
  const idx = casos.value.findIndex(c => c.id === id)
  if (idx !== -1) {
    const item = casos.value[idx]!
    casos.value[idx] = { ...item, habilitado: !item.habilitado }
    guardarBanco(casos.value)
  }
}

function abrirModalCrear() {
  casoEditando.value = null
  modalAbierto.value = true
}

function abrirModalEditar(caso: CasoEvaluacion) {
  casoEditando.value = caso
  modalAbierto.value = true
}

function cerrarModal() {
  modalAbierto.value = false
  casoEditando.value = null
}

function onGuardarCaso(caso: CasoEvaluacion) {
  pushSnapshot(casos.value)
  const idx = casos.value.findIndex(c => c.id === caso.id)
  if (idx !== -1) {
    casos.value[idx] = caso   // editar existente
  } else {
    casos.value.push(caso)    // crear nuevo
  }
  guardarBanco(casos.value)
}

function confirmarEliminar(id: string) {
  confirmEliminar.id   = id
  confirmEliminar.show = true
}

function ejecutarEliminar() {
  pushSnapshot(casos.value)
  casos.value = casos.value.filter(c => c.id !== confirmEliminar.id)
  guardarBanco(casos.value)
  confirmEliminar.show = false
}

function resetearBanco() {
  if (confirm('¿Restaurar el banco de preguntas por defecto? Se perderán todos los cambios.')) {
    pushSnapshot(casos.value)
    casos.value = CASOS_DEFAULT.map(c => clonarCaso(c))
    guardarBanco(casos.value)
  }
}

function deshacerCambio() {
  const prev = undo()
  if (prev) {
    casos.value = prev
    guardarBanco(casos.value)
  }
}

function lanzar() {
  const activos = casos.value.filter(c => c.habilitado)
  if (activos.length === 0) return
  emit('lanzar', activos, props.experimento || 'baseline')
}
</script>