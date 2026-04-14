<!-- src/components/evaluacion/BancoPreguntas/CasoModal.vue -->
<!--
  Modal para crear o editar un caso de evaluación.
  Campos: grupo, tipo, pregunta, claves, claves_prohibidas (condicional), descripción.
  Los campos claves_prohibidas solo se muestran para tipos 'corrige' y 'no_alucina'.
-->
<template>
  <Teleport to="body">
    <div
      v-if="abierto"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
      @click.self="cerrar"
    >
      <div class="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl my-8">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <Icon :icon="modoEdicion ? 'mdi:pencil-outline' : 'mdi:plus-circle-outline'" class="text-blue-400 text-lg" />
            {{ modoEdicion ? 'Editar caso' : 'Nuevo caso de prueba' }}
          </h2>
          <button @click="cerrar" class="text-gray-500 hover:text-gray-300 transition-colors">
            <Icon icon="mdi:close" class="text-xl" />
          </button>
        </div>

        <!-- Formulario -->
        <div class="px-6 py-5 flex flex-col gap-5">

          <!-- Grupo -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-300">Grupo</label>
            <p class="text-[11px] text-gray-500">Categoría para agrupar en el resumen y diagnóstico.</p>
            <div class="flex gap-2">
              <select
                v-model="form.grupo"
                class="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option v-for="g in GRUPOS_PREDEFINIDOS" :key="g" :value="g">{{ g }}</option>
                <option value="__custom__">Personalizado...</option>
              </select>
            </div>
            <input
              v-if="form.grupo === '__custom__'"
              v-model="grupoCustom"
              type="text"
              placeholder="Nombre del grupo personalizado"
              class="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <p v-if="errores.grupo" class="text-[11px] text-red-400 flex items-center gap-1">
              <Icon icon="mdi:alert-circle-outline" /> {{ errores.grupo }}
            </p>
          </div>

          <!-- Tipo -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-300">Tipo de verificación</label>
            <p class="text-[11px] text-gray-500">Define la lógica de scoring que se aplica a la respuesta del RAG.</p>
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="t in TIPOS"
                :key="t.value"
                :class="[
                  'flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all',
                  form.tipo === t.value
                    ? 'bg-blue-900/20 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-gray-900/50 border-gray-600 hover:border-gray-500',
                ]"
              >
                <input type="radio" :value="t.value" v-model="form.tipo" class="sr-only" />
                <span class="text-xs font-bold text-white">{{ t.label }}</span>
                <span class="text-[10px] text-gray-500 leading-relaxed">{{ t.descripcion }}</span>
              </label>
            </div>
          </div>

          <!-- Pregunta -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-300">Pregunta <span class="text-red-400">*</span></label>
            <textarea
              v-model="form.pregunta"
              rows="3"
              placeholder="Escribe la pregunta que se enviará al chatbot..."
              class="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
              :class="errores.pregunta ? 'border-red-500 ring-1 ring-red-500' : ''"
            />
            <p v-if="errores.pregunta" class="text-[11px] text-red-400 flex items-center gap-1">
              <Icon icon="mdi:alert-circle-outline" /> {{ errores.pregunta }}
            </p>
          </div>

          <!-- Claves -->
          <TagInput
            v-model="form.claves"
            :label="labelClaves"
            :descripcion="descripcionClaves"
            placeholder="Ej: 135, ICCD412..."
            color-chip="blue"
            required
          />
          <p v-if="errores.claves" class="text-[11px] text-red-400 flex items-center gap-1 -mt-3">
            <Icon icon="mdi:alert-circle-outline" /> {{ errores.claves }}
          </p>

          <!-- Claves prohibidas (solo para corrige y no_alucina) -->
          <TagInput
            v-if="necesitaClavesProhibidas"
            v-model="form.claves_prohibidas"
            label="Claves prohibidas"
            descripcion="Si alguna de estas frases aparece en la respuesta, se considera que el sistema confirmó el error o alucinó."
            placeholder="Ej: sí, correcto, en efecto..."
            color-chip="red"
          />

          <!-- Descripción -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-300">
              Descripción
              <span class="text-gray-500 font-normal ml-1">(opcional)</span>
            </label>
            <input
              v-model="form.descripcion"
              type="text"
              placeholder="Qué se está midiendo con este caso..."
              class="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

        </div>

        <!-- Footer -->
        <div class="flex gap-3 px-6 py-4 border-t border-gray-700">
          <button
            type="button"
            @click="cerrar"
            class="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="guardar"
            class="flex-1 flex justify-center items-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Icon icon="mdi:check" class="text-lg" />
            {{ modoEdicion ? 'Guardar cambios' : 'Crear caso' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import type { CasoEvaluacion, TipoCaso } from '@/services/backendService'
import { GRUPOS_PREDEFINIDOS, generarId } from '@/types/evaluacion'
import TagInput from '@/components/evaluacion/shared/TagInput.vue'

// ── Props / Emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  abierto:     boolean
  casoInicial: CasoEvaluacion | null   // null = crear, objeto = editar
}>()

const emit = defineEmits<{
  cerrar:  []
  guardar: [caso: CasoEvaluacion]
}>()

// ── Constantes ────────────────────────────────────────────────────────────────

const TIPOS: { value: TipoCaso; label: string; descripcion: string }[] = [
  { value: 'contiene',    label: 'contiene',    descripcion: 'La respuesta DEBE incluir todas las claves.' },
  { value: 'no_contiene', label: 'no_contiene', descripcion: 'La respuesta NO debe mencionar las claves.' },
  { value: 'corrige',     label: 'corrige',     descripcion: 'La respuesta debe corregir el dato falso de la pregunta.' },
  { value: 'no_alucina',  label: 'no_alucina',  descripcion: 'La entidad no existe; el sistema nunca debe inventar datos.' },
]

// ── Estado del formulario ────────────────────────────────────────────────────

const form = ref<Omit<CasoEvaluacion, 'id'>>({
  grupo:             'TP Directo',
  tipo:              'contiene',
  pregunta:          '',
  claves:            [],
  claves_prohibidas: [],
  descripcion:       '',
  habilitado:        true,
})

const grupoCustom = ref('')
const errores = ref<Record<string, string>>({})

// ── Computadas ────────────────────────────────────────────────────────────────

const modoEdicion = computed(() => props.casoInicial !== null)

const necesitaClavesProhibidas = computed(
  () => form.value.tipo === 'corrige' || form.value.tipo === 'no_alucina',
)

const labelClaves = computed(() => {
  const map: Record<TipoCaso, string> = {
    contiene:    'Claves esperadas',
    no_contiene: 'Claves prohibidas',
    corrige:     'Claves de corrección correcta',
    no_alucina:  'Frases de rechazo aceptables',
  }
  return map[form.value.tipo]
})

const descripcionClaves = computed(() => {
  const map: Record<TipoCaso, string> = {
    contiene:    'Strings que DEBEN aparecer en la respuesta para ser PASS.',
    no_contiene: 'Si alguna de estas frases aparece, el sistema alucinó → FAIL.',
    corrige:     'Frases que indican que el sistema corrigió correctamente el error.',
    no_alucina:  'Frases del tipo "no existe", "no hay" que indican rechazo correcto.',
  }
  return map[form.value.tipo]
})

// ── Watchers ──────────────────────────────────────────────────────────────────

// Cargar datos del caso al abrir en modo edición
watch(() => props.abierto, (abierto) => {
  if (!abierto) return
  errores.value = {}
  grupoCustom.value = ''

  if (props.casoInicial) {
    const c = props.casoInicial
    const esGrupoCustom = !GRUPOS_PREDEFINIDOS.includes(c.grupo as any)
    form.value = {
      grupo:             esGrupoCustom ? '__custom__' : c.grupo,
      tipo:              c.tipo,
      pregunta:          c.pregunta,
      claves:            [...c.claves],
      claves_prohibidas: [...c.claves_prohibidas],
      descripcion:       c.descripcion ?? '',
      habilitado:        c.habilitado,
    }
    if (esGrupoCustom) grupoCustom.value = c.grupo
  } else {
    form.value = {
      grupo: 'TP Directo', tipo: 'contiene', pregunta: '',
      claves: [], claves_prohibidas: [], descripcion: '', habilitado: true,
    }
  }
})

// Limpiar claves_prohibidas al cambiar de tipo
watch(() => form.value.tipo, () => {
  if (!necesitaClavesProhibidas.value) {
    form.value.claves_prohibidas = []
  }
})

// ── Métodos ───────────────────────────────────────────────────────────────────

function validar(): boolean {
  errores.value = {}

  const grupoFinal = form.value.grupo === '__custom__' ? grupoCustom.value.trim() : form.value.grupo
  if (!grupoFinal) errores.value.grupo = 'Elige o escribe un nombre de grupo.'
  if (!form.value.pregunta.trim()) errores.value.pregunta = 'La pregunta es obligatoria.'
  if (form.value.claves.length === 0) errores.value.claves = 'Agrega al menos una clave.'

  return Object.keys(errores.value).length === 0
}

function guardar() {
  if (!validar()) return

  const grupoFinal = form.value.grupo === '__custom__' ? grupoCustom.value.trim() : form.value.grupo

  const caso: CasoEvaluacion = {
    id:                props.casoInicial?.id ?? generarId(),
    grupo:             grupoFinal,
    tipo:              form.value.tipo,
    pregunta:          form.value.pregunta.trim(),
    claves:            form.value.claves,
    claves_prohibidas: form.value.claves_prohibidas,
    descripcion:       form.value.descripcion?.trim() || undefined,
    habilitado:        form.value.habilitado,
  }

  emit('guardar', caso)
  cerrar()
}

function cerrar() {
  emit('cerrar')
}
</script>