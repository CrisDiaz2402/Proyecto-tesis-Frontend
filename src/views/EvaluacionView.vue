<!-- src/views/EvaluacionView.vue -->
<!--
  Vista principal del Evaluador RAG.
  Orquesta las 2 secciones:
    A — BancoPreguntasSection (CRUD de casos + botón lanzar)
    B — ReporteSection (resultados, gráficas, métricas Phoenix)

  Cambios respecto a la versión anterior:
  - El ping a Phoenix se hace a través del proxy /api/evaluacion/phoenix-status
    (el fetch directo a localhost:6006 era bloqueado por CORS).
  - La evaluación usa ejecutarEvaluacionStream (SSE) en lugar de la llamada
    síncrona, lo que permite mostrar un porcentaje real de avance caso a caso.
-->
<template>
  <div class="p-6 flex flex-col gap-6 max-w-5xl mx-auto">

    <!-- Cabecera de la vista -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Evaluador RAG</h1>
        <p class="text-gray-400 text-sm mt-1">
          Ejecuta evaluaciones contra el sistema en tiempo real con tu banco de preguntas.
        </p>
      </div>

      <!-- Badges de estado del sistema -->
      <div class="flex items-center gap-2 flex-wrap justify-end">
        <span class="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs">
          <span class="w-1.5 h-1.5 rounded-full" :class="motorActivo ? 'bg-green-500' : 'bg-gray-600'"></span>
          <span class="text-gray-400">Motor:</span>
          <span class="text-white font-mono font-semibold">{{ motorActivo || '—' }}</span>
        </span>
        <span class="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs">
          <span class="w-1.5 h-1.5 rounded-full" :class="phoenixOk ? 'bg-orange-400' : 'bg-gray-600'"></span>
          <span class="text-gray-400">Phoenix:</span>
          <span :class="phoenixOk ? 'text-orange-300 font-semibold' : 'text-gray-500'">
            {{ phoenixOk ? 'online' : 'offline' }}
          </span>
        </span>
      </div>
    </div>

    <!-- Error de carga del motor -->
    <div
      v-if="errorMotor"
      class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
    >
      <Icon icon="mdi:alert-circle-outline" class="text-red-400 text-xl shrink-0" />
      <p class="text-red-300 text-sm">{{ errorMotor }}</p>
    </div>

    <!-- Error de evaluación -->
    <div
      v-if="errorEvaluacion"
      class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
    >
      <Icon icon="mdi:alert-circle-outline" class="text-red-400 text-xl shrink-0 mt-0.5" />
      <div>
        <p class="text-red-300 text-sm font-semibold">Error durante la evaluación</p>
        <p class="text-red-400/70 text-xs mt-1">{{ errorEvaluacion }}</p>
      </div>
      <button @click="errorEvaluacion = ''" class="ml-auto text-red-500/50 hover:text-red-400">
        <Icon icon="mdi:close" />
      </button>
    </div>

    <!-- ── Estado de progreso mientras evalúa ────────────────────────────────── -->
    <div
      v-if="evaluando"
      class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 flex flex-col gap-4"
    >
      <!-- Cabecera del bloque de progreso -->
      <div class="flex items-center gap-4">
        <Icon icon="mdi:loading" class="animate-spin text-3xl text-blue-400 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-blue-300 text-sm font-semibold">Evaluación en progreso...</p>
          <p class="text-blue-400/70 text-xs mt-0.5">
            Motor:
            <span class="font-mono font-semibold">{{ motorActivo }}</span>
            · Caso
            <span class="font-mono font-semibold">{{ casoActual }}</span>
            de
            <span class="font-mono font-semibold">{{ totalCasos }}</span>
            <span v-if="ultimoCasoId" class="ml-1 text-blue-500/60">({{ ultimoCasoId }})</span>
          </p>
        </div>
        <!-- Porcentaje numérico -->
        <span class="text-blue-300 font-mono font-bold text-lg shrink-0">
          {{ progreso }}%
        </span>
      </div>

      <!-- Barra de progreso real -->
      <div class="w-full bg-gray-700/60 rounded-full h-2.5 overflow-hidden">
        <div
          class="h-2.5 rounded-full transition-all duration-500 ease-out"
          :class="progreso === 100 ? 'bg-emerald-500' : 'bg-blue-500'"
          :style="{ width: `${progreso}%` }"
        ></div>
      </div>

      <!-- Mini-resultado del último caso evaluado -->
      <div
        v-if="ultimoResultado"
        class="flex items-center gap-2 text-xs text-gray-400"
      >
        <Icon
          :icon="ultimoResultado.veredicto === 'PASS'
            ? 'mdi:check-circle'
            : ultimoResultado.veredicto === 'PARCIAL'
              ? 'mdi:alert-circle'
              : 'mdi:close-circle'"
          :class="ultimoResultado.veredicto === 'PASS'
            ? 'text-emerald-400'
            : ultimoResultado.veredicto === 'PARCIAL'
              ? 'text-yellow-400'
              : 'text-red-400'"
        />
        <span class="truncate max-w-md">
          <span class="font-semibold text-gray-300">{{ ultimoResultado.id }}</span>
          — {{ ultimoResultado.pregunta }}
        </span>
        <span
          :class="[
            'ml-auto shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold border',
            ultimoResultado.veredicto === 'PASS'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : ultimoResultado.veredicto === 'PARCIAL'
                ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                : 'bg-red-500/15 text-red-400 border-red-500/30',
          ]"
        >
          {{ ultimoResultado.veredicto }}
        </span>
      </div>
    </div>

    <!-- SECCIÓN A: Banco de preguntas -->
    <BancoPreguntasSection
      v-model:experimento="experimento"
      :motor-activo="motorActivo"
      :evaluando="evaluando"
      @lanzar="onLanzar"
    />

    <!-- SECCIÓN B: Reporte (solo visible cuando hay resultados) -->
    <ReporteSection :resultado="resultado" />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { toast } from 'vue3-toastify'
import {
  obtenerConfiguracionIA,
  ejecutarEvaluacionStream,
  verificarPhoenixStatus,
} from '@/services/backendService'
import type {
  CasoEvaluacion,
  ResultadoEvaluacion,
  ResultadoCaso,
  EventoEvaluacion,
} from '@/services/backendService'
import BancoPreguntasSection from '@/components/evaluacion/BancoPreguntas/BancoPreguntasSection.vue'
import ReporteSection        from '@/components/evaluacion/Reporte/ReporteSection.vue'

// ── Estado ────────────────────────────────────────────────────────────────────

const motorActivo     = ref('')
const phoenixOk       = ref(false)
const errorMotor      = ref('')
const evaluando       = ref(false)
const errorEvaluacion = ref('')
const experimento     = ref('baseline')
const resultado       = ref<ResultadoEvaluacion | null>(null)

// Estado del progreso en tiempo real
const progreso       = ref(0)   // 0–100
const casoActual     = ref(0)
const totalCasos     = ref(0)
const ultimoCasoId   = ref('')
const ultimoResultado = ref<ResultadoCaso | null>(null)

// ── Carga inicial ─────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const config = await obtenerConfiguracionIA()
    motorActivo.value = `${config.motor_vectores}:${config.motor_llm}`
  } catch {
    errorMotor.value = 'No se pudo obtener el motor activo. Verifica que el backend esté corriendo.'
  }

  // Ping a Phoenix a través del proxy del backend (sin CORS)
  phoenixOk.value = await verificarPhoenixStatus()
})

// ── Lanzar evaluación ─────────────────────────────────────────────────────────

async function onLanzar(casos: CasoEvaluacion[], exp: string) {
  evaluando.value       = true
  errorEvaluacion.value = ''
  resultado.value       = null

  // Reiniciar estado de progreso
  progreso.value        = 0
  casoActual.value      = 0
  totalCasos.value      = casos.filter(c => c.habilitado).length
  ultimoCasoId.value    = ''
  ultimoResultado.value = null

  try {
    const reporte = await ejecutarEvaluacionStream(
      { experimento: exp, casos },
      (evento: EventoEvaluacion) => {
        // Actualizar estado de progreso con cada evento del stream
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

    // Toast con resultado final
    const pct = Math.round(reporte.score_global * 100)
    if (pct >= 85) {
      toast.success(`Evaluación completada — Score: ${pct}% ✓`)
    } else if (pct >= 65) {
      toast.warning(`Evaluación completada — Score: ${pct}% ◑`)
    } else {
      toast.error(`Evaluación completada — Score: ${pct}% ✗`)
    }

    // Scroll suave al reporte
    setTimeout(() => {
      const el = document.querySelector('[data-reporte]')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

  } catch (e: any) {
    errorEvaluacion.value = e.message || 'Error desconocido durante la evaluación.'
    toast.error('Error al ejecutar la evaluación.')
  } finally {
    evaluando.value = false
  }
}
</script>

<style>
/* Estilos de impresión: ocultar el sidebar y mostrar solo el reporte */
@media print {
  aside,
  header,
  .no-print {
    display: none !important;
  }
  main {
    overflow: visible !important;
  }
  body {
    background: white !important;
    color: black !important;
  }
}
</style>