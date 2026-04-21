<!-- src/views/EvaluacionView.vue -->
<template>
  <div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-5xl mx-auto">

    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Evaluador del Sistema</h1>
        <p class="text-gray-400 text-sm mt-1">
          Mide la calidad de respuestas usando similitud semántica contra respuestas de referencia.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap justify-end">
        <span class="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs">
          <span class="w-1.5 h-1.5 rounded-full" :class="motorActivo ? 'bg-green-500' : 'bg-gray-600'"></span>
          <span class="text-gray-400">Motor:</span>
          <span class="text-white font-mono font-semibold">{{ motorActivo || '—' }}</span>
        </span>
      </div>
    </div>

    <div v-if="errorMotor" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
      <Icon icon="mdi:alert-circle-outline" class="text-red-400 text-xl shrink-0" />
      <p class="text-red-300 text-sm">{{ errorMotor }}</p>
    </div>

    <div v-if="errorEvaluacion" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
      <Icon icon="mdi:alert-circle-outline" class="text-red-400 text-xl shrink-0 mt-0.5" />
      <div>
        <p class="text-red-300 text-sm font-semibold">Error durante la evaluación</p>
        <p class="text-red-400/70 text-xs mt-1">{{ errorEvaluacion }}</p>
      </div>
      <button @click="errorEvaluacion = ''" class="ml-auto text-red-500/50 hover:text-red-400">
        <Icon icon="mdi:close" />
      </button>
    </div>

    <div v-if="evaluando" class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 flex flex-col gap-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Icon icon="mdi:loading" class="animate-spin text-3xl text-blue-400 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-blue-300 text-sm font-semibold">Evaluación en progreso...</p>
          <p class="text-blue-400/70 text-xs mt-0.5">
            Motor: <span class="font-mono font-semibold">{{ motorActivo }}</span>
            · Caso <span class="font-mono font-semibold">{{ casoActual }}</span>
            de <span class="font-mono font-semibold">{{ totalCasos }}</span>
            <span v-if="ultimoCasoId" class="ml-1 text-blue-500/60">({{ ultimoCasoId }})</span>
          </p>
        </div>
        <span class="text-blue-300 font-mono font-bold text-lg shrink-0">{{ progreso }}%</span>
      </div>
      <div class="w-full bg-gray-700/60 rounded-full h-2.5 overflow-hidden">
        <div
          class="h-2.5 rounded-full transition-all duration-500 ease-out"
          :class="progreso === 100 ? 'bg-emerald-500' : 'bg-blue-500'"
          :style="{ width: `${progreso}%` }"
        ></div>
      </div>
      <div v-if="ultimoResultado" class="flex items-center gap-2 text-xs text-gray-400">
        <Icon
          :icon="ultimoResultado.veredicto === 'PASS' ? 'mdi:check-circle' : ultimoResultado.veredicto === 'PARCIAL' ? 'mdi:alert-circle' : ultimoResultado.veredicto === 'ERROR' ? 'mdi:alert-outline' : 'mdi:close-circle'"
          :class="ultimoResultado.veredicto === 'PASS' ? 'text-emerald-400' : ultimoResultado.veredicto === 'PARCIAL' ? 'text-yellow-400' : ultimoResultado.veredicto === 'ERROR' ? 'text-orange-400' : 'text-red-400'"
        />
        <span class="truncate max-w-md">
          <span class="font-semibold text-gray-300">{{ ultimoResultado.id }}</span>
          — {{ ultimoResultado.pregunta }}
        </span>
        <span
          :class="['ml-auto shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold border',
            ultimoResultado.veredicto === 'PASS' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
            ultimoResultado.veredicto === 'PARCIAL' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
            ultimoResultado.veredicto === 'ERROR' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
            'bg-red-500/15 text-red-400 border-red-500/30']"
        >{{ ultimoResultado.veredicto }}</span>
      </div>
    </div>

    <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col gap-5">

      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-blue-600/15 rounded-lg">
          <Icon icon="mdi:test-tube-outline" class="text-blue-400 text-xl" />
        </div>
        <div>
          <h3 class="text-white font-semibold text-sm">Golden Dataset</h3>
          <p class="text-gray-400 text-xs mt-0.5">
            Importa un archivo JSON con preguntas y respuestas esperadas de referencia
          </p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">

        <label class="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold rounded-lg cursor-pointer transition-colors w-fit">
          <Icon icon="mdi:upload" class="text-base shrink-0" />
          {{ nombreArchivo || 'Cargar .json' }}
          <input type="file" accept=".json" class="hidden" @change="onImportarJSON" />
        </label>

        <input
          v-model="experimento"
          type="text"
          placeholder="Nombre del experimento (ej: baseline)"
          class="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />

        <button
          @click="onLanzar"
          :disabled="evaluando || casos.length === 0"
          class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Icon v-if="evaluando" icon="mdi:loading" class="animate-spin" />
          <Icon v-else icon="mdi:play" />
          {{ evaluando ? 'Evaluando...' : `Evaluar (${casosHabilitados} casos)` }}
        </button>

      </div>

      <div v-if="errorImportacion" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-xs flex items-start gap-2">
        <Icon icon="mdi:alert-circle" class="shrink-0 mt-0.5" />
        {{ errorImportacion }}
      </div>

      <div v-if="casos.length > 0" class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-semibold uppercase tracking-wide">
            {{ casos.length }} casos importados — {{ casosHabilitados }} habilitados
          </span>
          <div class="flex items-center gap-2">
            <button @click="toggleTodos(true)" class="text-xs text-blue-400 hover:text-blue-300 transition-colors">Activar todos</button>
            <span class="text-gray-600">·</span>
            <button @click="toggleTodos(false)" class="text-xs text-gray-400 hover:text-gray-300 transition-colors">Desactivar todos</button>
          </div>
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-700">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="bg-gray-900/60">
                <th class="px-3 py-2.5 text-gray-400 font-semibold uppercase text-[10px] tracking-wide w-8"></th>
                <th class="px-3 py-2.5 text-gray-400 font-semibold uppercase text-[10px] tracking-wide">ID</th>
                <th class="px-3 py-2.5 text-gray-400 font-semibold uppercase text-[10px] tracking-wide">Grupo</th>
                <th class="px-3 py-2.5 text-gray-400 font-semibold uppercase text-[10px] tracking-wide">Pregunta</th>
                <th class="px-3 py-2.5 text-gray-400 font-semibold uppercase text-[10px] tracking-wide">Respuesta esperada</th>
                <th class="px-3 py-2.5 text-gray-400 font-semibold uppercase text-[10px] tracking-wide text-center">Umbral</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/50">
              <tr
                v-for="caso in casos" :key="caso.id"
                class="transition-colors"
                :class="caso.habilitado ? 'hover:bg-gray-700/20' : 'opacity-40'"
              >
                <td class="px-3 py-2.5">
                  <input type="checkbox" v-model="caso.habilitado" class="accent-blue-500 cursor-pointer" />
                </td>
                <td class="px-3 py-2.5 font-mono text-blue-300 font-semibold">{{ caso.id }}</td>
                <td class="px-3 py-2.5 text-gray-300">{{ caso.grupo }}</td>
                <td class="px-3 py-2.5 text-gray-200 max-w-xs truncate">{{ caso.pregunta }}</td>
                <td class="px-3 py-2.5 text-emerald-300/80 max-w-xs truncate italic">{{ caso.respuesta_esperada }}</td>
                <td class="px-3 py-2.5 text-center font-mono text-amber-400">{{ caso.umbral_similitud }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="flex flex-col items-center gap-3 py-8 text-center">
        <Icon icon="mdi:file-import-outline" class="text-gray-600 text-4xl" />
        <p class="text-gray-500 text-sm">Ningún dataset cargado</p>
        <p class="text-gray-600 text-xs max-w-sm">
          Importa un archivo JSON con el formato Golden Dataset para comenzar la evaluación.
        </p>
        <details class="text-left mt-2">
          <summary class="text-xs text-gray-500 hover:text-gray-400 cursor-pointer">Ver formato de ejemplo</summary>
          <pre class="mt-2 p-3 bg-gray-900 rounded-lg text-emerald-300/80 text-[10px] font-mono leading-relaxed overflow-x-auto max-w-lg">{{ JSON_EJEMPLO }}</pre>
        </details>
      </div>

    </div>

    <ReporteSection :resultado="resultado" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue3-toastify'
import {
  obtenerConfiguracionIA,
  ejecutarEvaluacionStream,
  parsearGoldenDataset,
} from '@/services/backendService'
import type { CasoEvaluacion, ResultadoEvaluacion, ResultadoCaso, EventoSSE } from '@/services/backendService'
import ReporteSection from '@/components/evaluacion/Reporte/ReporteSection.vue'
import { JSON_EJEMPLO } from '@/types/evaluacion'

const motorActivo     = ref('')
const errorMotor      = ref('')
const evaluando       = ref(false)
const errorEvaluacion = ref('')
const errorImportacion = ref('')
const nombreArchivo   = ref('')
const experimento     = ref('golden')
const resultado       = ref<ResultadoEvaluacion | null>(null)
const casos           = ref<CasoEvaluacion[]>([])

const progreso        = ref(0)
const casoActual      = ref(0)
const totalCasos      = ref(0)
const ultimoCasoId    = ref('')
const ultimoResultado = ref<ResultadoCaso | null>(null)

const casosHabilitados = computed(() => casos.value.filter(c => c.habilitado).length)

onMounted(async () => {
  try {
    const config = await obtenerConfiguracionIA()
    motorActivo.value = `${config.motor_vectores}:${config.motor_llm}`
  } catch {
    errorMotor.value = 'No se pudo obtener el motor activo. Verifica que el backend esté corriendo.'
  }
})

function onImportarJSON(event: Event) {
  const input = event.target as HTMLInputElement
  const file  = input.files?.[0]
  if (!file) return

  errorImportacion.value = ''
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const contenido = e.target?.result as string
      const parsed    = parsearGoldenDataset(contenido)
      casos.value     = parsed
      nombreArchivo.value = file.name
      toast.success(`${parsed.length} casos cargados desde "${file.name}"`)
    } catch (err: any) {
      errorImportacion.value = err.message ?? 'Error al parsear el archivo JSON.'
      casos.value     = []
      nombreArchivo.value = ''
      toast.error('Error al importar el archivo.')
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function toggleTodos(estado: boolean) {
  casos.value = casos.value.map(c => ({ ...c, habilitado: estado }))
}

async function onLanzar() {
  if (casosHabilitados.value === 0) return

  evaluando.value       = true
  errorEvaluacion.value = ''
  resultado.value       = null
  progreso.value        = 0
  casoActual.value      = 0
  totalCasos.value      = casosHabilitados.value
  ultimoCasoId.value    = ''
  ultimoResultado.value = null

  try {
    const reporte = await ejecutarEvaluacionStream(
      { experimento: experimento.value, casos: casos.value },
      (evento: EventoSSE) => {
        if (evento.tipo === 'progreso') {
          progreso.value        = evento.porcentaje
          casoActual.value      = evento.caso_actual
          totalCasos.value      = evento.total_casos
          ultimoCasoId.value    = evento.resultado.id
          ultimoResultado.value = evento.resultado
        }
        if (evento.tipo === 'completado') {
          progreso.value   = 100
          casoActual.value = evento.total_casos
        }
      },
    )

    resultado.value = reporte
    const pct = Math.round(reporte.score_global * 100)
    if      (pct >= 85) toast.success(`Evaluación completada — Score: ${pct}% ✓`)
    else if (pct >= 65) toast.warning(`Evaluación completada — Score: ${pct}% ◑`)
    else                toast.error(`Evaluación completada — Score: ${pct}% ✗`)

    setTimeout(() => {
      const el = document.querySelector('[data-reporte]')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

  } catch (e: any) {
    console.error('[Evaluacion] Error en evaluación:', e)
    errorEvaluacion.value = e.message || 'Error desconocido durante la evaluación.'
    toast.error('Error al ejecutar la evaluación.')
  } finally {
    evaluando.value = false
  }
}
</script>

<style>
@media print {
  aside, header, .no-print { display: none !important; }
  main { overflow: visible !important; }
  body { background: white !important; color: black !important; }
}
</style>
