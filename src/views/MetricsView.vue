<template>
  <div class="p-8">

    <!-- Cabecera -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Métricas del Sistema RAG</h1>
      <p class="text-gray-400 text-sm mt-1">Resultados de evaluación Faithfulness — RAGAS</p>
    </div>

    <!-- Tarjetas de métricas principales -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div
        v-for="m in metricas"
        :key="m.label"
        class="bg-gray-800 border border-gray-700 rounded-xl p-5"
      >
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs text-gray-400 uppercase tracking-wider">{{ m.label }}</p>
          <Icon :icon="m.icon" :class="`text-xl ${m.color}`" />
        </div>
        <p :class="`text-3xl font-bold ${m.color}`">{{ m.value }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ m.desc }}</p>
      </div>
    </div>

    <!-- Tabla de resultados por categoría -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
        <Icon icon="mdi:table" class="text-blue-400 text-lg" />
        <h2 class="text-sm font-semibold text-white">Resultados por categoría</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700">
              <th class="text-left px-6 py-3">Categoría</th>
              <th class="text-left px-6 py-3">Pregunta</th>
              <th class="text-left px-6 py-3">Respuesta</th>
              <th class="text-center px-6 py-3">Faithfulness</th>
              <th class="text-center px-6 py-3">Latencia</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in resultados"
              :key="i"
              class="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
            >
              <td class="px-6 py-4 text-gray-300 font-medium whitespace-nowrap">{{ row.categoria }}</td>
              <td class="px-6 py-4 text-gray-400 max-w-xs truncate">{{ row.pregunta }}</td>
              <td class="px-6 py-4 text-gray-400 max-w-xs truncate">{{ row.respuesta }}</td>
              <td class="px-6 py-4 text-center">
                <span :class="badgeClass(row.score)">{{ row.score }}</span>
              </td>
              <td class="px-6 py-4 text-center text-gray-400 whitespace-nowrap">{{ row.latencia }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Nota metodológica -->
    <div class="mt-6 bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 flex gap-3">
      <Icon icon="mdi:information-outline" class="text-blue-400 text-xl shrink-0 mt-0.5" />
      <div>
        <p class="text-sm font-semibold text-blue-300 mb-1">Nota de interpretación</p>
        <p class="text-xs text-gray-400 leading-relaxed">
          El score <strong class="text-white">0.00</strong> en "Fuera del dominio" es <strong class="text-white">correcto y esperado</strong>:
          el sistema rechazó la pregunta sin inventar datos del contexto.
          Faithfulness evalúa si la respuesta está basada en los fragmentos recuperados de ChromaDB,
          no si la pregunta pertenece al dominio.
        </p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const metricas = [
  {
    label: 'Faithfulness promedio',
    value: '0.75',
    desc:  'Sobre preguntas evaluadas (excluye fuera de dominio)',
    icon:  'mdi:chart-line',
    color: 'text-yellow-400',
  },
  {
    label: 'Preguntas excelentes',
    value: '4 / 6',
    desc:  'Score ≥ 0.90',
    icon:  'mdi:check-circle-outline',
    color: 'text-green-400',
  },
  {
    label: 'Modelo evaluador',
    value: 'llama3',
    desc:  'Con format=json — Ollama local',
    icon:  'mdi:robot-outline',
    color: 'text-blue-400',
  },
]

const resultados = [
  { categoria: '📊 Datos numéricos',    pregunta: '¿Cuántas horas de aprendizaje autónomo?',          respuesta: '2800 Horas',                                             score: '1.00', latencia: '3681 ms' },
  { categoria: '📚 Materias por nivel', pregunta: '¿Qué materias hay en el nivel 1?',                  respuesta: 'Álgebra Lineal, Cálculo en una Variable...',              score: '1.00', latencia: '2192 ms' },
  { categoria: '🔗 Prerrequisitos',     pregunta: '¿Prerrequisitos de Inteligencia Artificial?',       respuesta: 'Métodos Numéricos (ICCD412), EDA II (ICCD342)',           score: '0.00', latencia: '2163 ms' },
  { categoria: '🎓 Graduación',         pregunta: '¿Qué nivel de inglés necesito para graduarme?',    respuesta: 'B1',                                                     score: '1.00', latencia: '2164 ms' },
  { categoria: '🏅 Créditos',           pregunta: '¿Cuántos créditos en total para graduarme?',       respuesta: '180 (⚠️ dato incorrecto — pendiente reingestar MD)',      score: '1.00', latencia: '2226 ms' },
  { categoria: '🚫 Fuera del dominio',  pregunta: '¿Cuál es el horario de atención de la facultad?',  respuesta: 'Lo siento, esa información no existe en la base...',      score: '0.00', latencia: '2166 ms' },
]

const badgeClass = (score: string) => {
  const n = parseFloat(score)
  if (n >= 0.9)  return 'px-2 py-0.5 rounded text-xs font-bold bg-green-600/20 text-green-400 border border-green-600/30'
  if (n >= 0.7)  return 'px-2 py-0.5 rounded text-xs font-bold bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
  return              'px-2 py-0.5 rounded text-xs font-bold bg-red-600/20 text-red-400 border border-red-600/30'
}
</script>