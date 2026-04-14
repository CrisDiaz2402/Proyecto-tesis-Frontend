<!-- src/components/evaluacion/BancoPreguntas/BancoPreguntasSection.vue -->
<!--
  Sección A del Evaluador RAG.
  Gestiona el banco de preguntas: CRUD local (localStorage),
  filtro por grupo, y el botón para lanzar la evaluación.
-->
<template>
  <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">

    <!-- Header de la sección -->
    <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between gap-4">
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

    <!-- Etiqueta del experimento + filtros -->
    <div class="px-6 py-3 border-b border-gray-700/50 flex flex-wrap items-center gap-3">

      <!-- Nombre del experimento -->
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

      <!-- Filtro por grupo -->
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

    <!-- Lista de casos -->
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

    <!-- Footer: botón de lanzar -->
    <div class="px-6 py-4 border-t border-gray-700 flex items-center justify-between gap-4">

      <!-- Info de motor -->
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <Icon icon="mdi:information-outline" class="text-gray-600" />
        <span>Motor activo:
          <span class="text-gray-300 font-mono font-semibold">{{ motorActivo }}</span>
        </span>
      </div>

      <!-- Botón lanzar -->
      <button
        @click="lanzar"
        :disabled="casosHabilitados === 0 || evaluando"
        :class="[
          'flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all shadow-lg',
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

  <!-- Modal crear/editar -->
  <CasoModal
    :abierto="modalAbierto"
    :caso-inicial="casoEditando"
    @cerrar="cerrarModal"
    @guardar="onGuardarCaso"
  />

  <!-- Modal confirmación eliminar -->
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
import { Icon } from '@iconify/vue'
import type { CasoEvaluacion } from '@/services/backendService'
import { cargarBanco, guardarBanco, CASOS_DEFAULT } from '@/types/evaluacion'
import CasoItem from './CasoItem.vue'
import CasoModal from './CasoModal.vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'

// ── Props / Emits ──────────────────────────────────────────────────────────────

const props = defineProps<{
  experimento:  string
  motorActivo:  string
  evaluando:    boolean
}>()

const emit = defineEmits<{
  'update:experimento': [val: string]
  lanzar: [casos: CasoEvaluacion[], experimento: string]
}>()

// ── Estado ────────────────────────────────────────────────────────────────────

const casos       = ref<CasoEvaluacion[]>(cargarBanco())
const filtroGrupo = ref('')
const modalAbierto = ref(false)
const casoEditando = ref<CasoEvaluacion | null>(null)

const confirmEliminar = reactive({ show: false, id: '' })

// ── Computadas ────────────────────────────────────────────────────────────────

const casosHabilitados = computed(() => casos.value.filter(c => c.habilitado).length)

const gruposUnicos = computed(() =>
  [...new Set(casos.value.map(c => c.grupo))].sort(),
)

const casosFiltrados = computed(() =>
  filtroGrupo.value
    ? casos.value.filter(c => c.grupo === filtroGrupo.value)
    : casos.value,
)

// ── CRUD local ────────────────────────────────────────────────────────────────

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
  casos.value = casos.value.filter(c => c.id !== confirmEliminar.id)
  guardarBanco(casos.value)
  confirmEliminar.show = false
}

function resetearBanco() {
  if (confirm('¿Restaurar el banco de preguntas por defecto? Se perderán todos los cambios.')) {
    casos.value = [...CASOS_DEFAULT.map(c => ({ ...c }))]
    guardarBanco(casos.value)
  }
}

// ── Lanzar evaluación ─────────────────────────────────────────────────────────

function lanzar() {
  const activos = casos.value.filter(c => c.habilitado)
  if (activos.length === 0) return
  emit('lanzar', activos, props.experimento || 'baseline')
}
</script>