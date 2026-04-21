<template>
  <div class="w-full h-screen bg-gray-900 relative select-none">

    <div class="absolute top-0 left-0 right-0 sm:right-auto sm:top-5 sm:left-5 z-10 flex flex-col gap-2 sm:gap-4 w-full sm:w-96 p-3 sm:p-0">

      <div class="bg-gray-800/90 p-3 sm:p-4 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm">
        <div class="flex flex-col gap-2 sm:gap-3">
          <label class="text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            Consultas: Carrera de Ciencias en la Computación
          </label>

          <div class="flex gap-2 items-stretch">
            <input
              type="text"
              v-model="preguntaUsuario"
              @keyup.enter="() => { interrumpirAvatar(); enviarPregunta(); }"
              @keydown.enter.prevent="() => { interrumpirAvatar(); enviarPregunta(); }"
              :disabled="store.cargando || store.estaEscuchando"
              :placeholder="store.estaEscuchando ? 'Escuchando... (suelta para enviar)' : 'Escribe tu pregunta...'"
              class="flex-1 px-3 py-2 bg-gray-700 text-white text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
              @mousedown="empezarAEscuchar"
              @mouseup="detenerEscuchaHandler"
              @touchstart.prevent="empezarAEscuchar"
              @touchend.prevent="detenerEscuchaHandler"
              :disabled="store.cargando || !soportaRecognition"
              :title="soportaRecognition ? 'Mantener presionado para hablar' : 'Reconocimiento de voz no disponible en este navegador'"
              :class="[
                'px-3 rounded-lg transition-all flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
                store.estaEscuchando ? 'bg-red-500 animate-pulse ring-2 ring-red-400' : 'bg-gray-600 hover:bg-gray-500'
              ]"
            >
              <Icon icon="mdi:microphone" class="text-white text-xl" />
            </button>

            <button
              v-if="store.estaHablando"
              @click="interrumpirAvatar"
              @touchend.prevent="interrumpirAvatar"
              class="px-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-lg animate-pulse"
              title="Detener voz"
            >
              <Icon icon="mdi:stop-circle-outline" class="text-xl" />
            </button>
            <button
              v-else
              @click="() => enviarPregunta()"
              @touchend.prevent="() => enviarPregunta()"
              :disabled="store.cargando || store.estaEscuchando || wsEstado === 'conectando'"
              class="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              <Icon icon="mdi:send" class="text-xl" />
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="ultimoTextoMostrado"
        class="bg-white/95 p-3 sm:p-4 rounded-xl shadow-xl border-l-4 border-blue-500 animate-bounce-in flex flex-col gap-2 sm:gap-3 max-h-48 sm:max-h-none overflow-y-auto"
      >
        <div class="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
          <p class="text-[10px] text-blue-500 font-bold mb-1 uppercase tracking-wide">Tú preguntaste:</p>
          <p class="text-gray-700 text-sm italic">"{{ store.preguntaMostrada }}"</p>
        </div>
        <div>
          <p class="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">Asistente Virtual dice:</p>
          <p class="text-gray-800 text-sm leading-relaxed font-medium whitespace-pre-wrap">
            {{ textoStreaming || store.respuestaBot || ultimoTextoMostrado }}
            <span v-if="wsEstado === 'generando'" class="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle"></span>
          </p>
        </div>
      </div>

      <div class="flex gap-2 flex-wrap">
        <span v-if="store.estaHablando" class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/50 flex items-center gap-1">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Hablando
        </span>
        <span v-else-if="store.estaEscuchando" class="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/50 flex items-center gap-1">
          <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Escuchando
        </span>
        <span v-else-if="wsEstado === 'generando'" class="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/50 flex items-center gap-1">
          <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Generando...
        </span>
        <span v-else-if="wsEstado === 'conectando'" class="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/50 flex items-center gap-1">
          <span class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span> Conectando...
        </span>
        <span
          v-else-if="wsEstado === 'error' && esErrorRateLimit"
          class="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded border border-amber-500/50 flex items-center gap-1"
        >
          <Icon icon="mdi:timer-sand" class="text-sm" /> Espera un momento...
        </span>
        <span
          v-else-if="wsEstado === 'error'"
          class="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/50 flex items-center gap-1 cursor-pointer hover:bg-red-500/30 transition-colors"
          @click="intentarReconectar"
          title="Clic para reintentar"
        >
          <Icon icon="mdi:wifi-off" class="text-sm" /> Sin conexión — Reintentar
        </span>
        <span v-else class="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded border border-gray-600">
          En espera
        </span>

        <span v-if="!soportaSynthesis" class="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded border border-yellow-500/30 flex items-center gap-1" title="El navegador no soporta síntesis de voz">
          <Icon icon="mdi:volume-off" class="text-sm" /> Sin voz
        </span>
      </div>

      <div
        v-if="wsEstado === 'error' && wsError"
        :class="[
          'rounded-xl p-3 text-xs flex items-start gap-2',
          esErrorRateLimit
            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
            : 'bg-red-500/10 border border-red-500/20 text-red-300'
        ]"
      >
        <Icon
          :icon="esErrorRateLimit ? 'mdi:timer-sand' : 'mdi:alert-circle-outline'"
          class="text-base shrink-0 mt-0.5"
        />
        <span>{{ wsError }}</span>
      </div>

    </div>

    <TresCanvas window-size clear-color="#111827" shadows>
      <TresPerspectiveCamera :position="[0, 1.7, 1.3]" :look-at="[0, 1.65, 0]" :fov="45" />
      <OrbitControls :target="[0, 1.65, 0]" enable-damping />
      <TresAmbientLight :intensity="1.5" />
      <TresDirectionalLight :position="[2, 4, 5]" :intensity="2" cast-shadow />
      <Suspense>
        <TheAvatar :is-speaking="store.estaHablando" />
        <template #fallback>
          <TresMesh :position="[0, 1.5, 0]">
            <TresBoxGeometry />
            <TresMeshBasicMaterial color="red" wireframe />
          </TresMesh>
        </template>
      </Suspense>
    </TresCanvas>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'

import TheAvatar from '@/components/avatar/TheAvatar.vue'
import { useAvatarStore } from '@/stores/avatar'
import { useSpeech } from '@/composables/useSpeech'
import { useChatWebSocket } from '@/composables/useWebSocket'
import { getToken } from '@/services/authService'
import { WS_BASE_URL } from '@/config/config'

const store = useAvatarStore()
const {
  hablar,
  iniciarEscucha,
  detenerEscucha: detenerEscuchaComposable,
  interrumpir,
  formatearTextoParaVoz,
  soportaSynthesis,
  soportaRecognition,
} = useSpeech()

const {
  estado: wsEstado,
  tokenStream,
  respuestaCompleta,
  error: wsError,
  conectar: wsConectar,
  enviarPregunta: wsEnviarPregunta,
} = useChatWebSocket(WS_BASE_URL)

const textoStreaming = computed(() => tokenStream.value)
const ultimoTextoMostrado = ref('')

const esErrorRateLimit = computed(() =>
  wsError.value?.toLowerCase().includes('demasiadas consultas') ?? false
)

onMounted(() => {
  const token = getToken() ?? undefined
  wsConectar(token)
})

watch(respuestaCompleta, (texto) => {
  if (!texto) return
  store.setCargando(false)
  ultimoTextoMostrado.value = texto
  if (texto.trim()) {
    store.setRespuesta(store.preguntaMostrada, texto)
    if (soportaSynthesis.value) hablar(formatearTextoParaVoz(texto))
  } else {
    const msg = 'No entendí tu pregunta, intenta de nuevo.'
    ultimoTextoMostrado.value = msg
    store.setRespuesta(store.preguntaMostrada, msg)
    if (soportaSynthesis.value) hablar(msg)
  }
})

watch(wsError, (err) => {
  if (!err) return
  store.setCargando(false)
  store.setRespuesta(
    store.preguntaMostrada,
    store.preguntaMostrada ? `Error de conexión: ${err}` : ''
  )
})

watch(wsEstado, (estado) => {
  if (estado === 'desconectado' && store.cargando) {
    store.setCargando(false)
    store.setRespuesta(store.preguntaMostrada, 'Conexión perdida. Intenta de nuevo.')
  }
})

const preguntaUsuario = ref('')

const empezarAEscuchar = (): void => {
  if (!soportaRecognition.value) return
  iniciarEscucha()
}

const detenerEscuchaHandler = (): void => {
  detenerEscuchaComposable((textoCapturado) => {
    if (textoCapturado.trim()) {
      enviarPregunta(textoCapturado)
    }
  })
}

const interrumpirAvatar = (): void => {
  interrumpir()
}

const enviarPregunta = (textoDirecto?: string): void => {
  const mensaje = (textoDirecto ?? preguntaUsuario.value).trim()
  if (!mensaje) return
  interrumpirAvatar()
  ultimoTextoMostrado.value = 'Pensando...'
  store.setCargando(true)
  store.setRespuesta(mensaje, 'Pensando...')
  try {
    wsEnviarPregunta(mensaje)
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : 'Error al enviar pregunta.'
    console.error('[AvatarView] Error al enviar pregunta por WS:', errMsg)
    store.setCargando(false)
    store.setRespuesta(mensaje, 'Sin conexión con el servidor. Recarga la página o espera un momento.')
  }
  if (!textoDirecto) preguntaUsuario.value = ''
}

const intentarReconectar = (): void => {
  const token = getToken() ?? undefined
  wsConectar(token)
}
</script>

<style scoped>
.animate-bounce-in {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popIn {
  0%   { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1);   opacity: 1; }
}
</style>