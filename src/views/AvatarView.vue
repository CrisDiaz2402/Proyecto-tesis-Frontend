<template>
  <div class="w-full h-screen bg-gray-900 relative select-none">

    <div class="absolute top-5 left-5 z-10 flex flex-col gap-4 w-96">

      <div class="bg-gray-800/90 p-4 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm">
        <div class="flex flex-col gap-3">
          <label class="text-blue-400 text-xs font-bold uppercase tracking-wider">
            Consultas: Carrera de Ciencias en la Computación
          </label>

          <div class="flex gap-2 items-stretch">
            <input
              type="text"
              v-model="preguntaUsuario"
              @keyup.enter="() => { interrumpirAvatar(); enviarPregunta(); }"
              :disabled="store.cargando || store.estaEscuchando"
              :placeholder="store.estaEscuchando ? 'Escuchando... (suelta para enviar)' : 'Escribe tu pregunta...'"
              class="flex-1 px-3 py-2 bg-gray-700 text-white text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
              @mousedown="empezarAEscuchar"
              @mouseup="detenerEscucha"
              @touchstart.prevent="empezarAEscuchar"
              @touchend.prevent="detenerEscucha"
              :disabled="store.cargando"
              :class="[
                'px-3 rounded-lg transition-all flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
                store.estaEscuchando ? 'bg-red-500 animate-pulse ring-2 ring-red-400' : 'bg-gray-600 hover:bg-gray-500'
              ]"
              title="Mantener presionado para hablar"
            >
              <Icon icon="mdi:microphone" class="text-white text-xl" />
            </button>

            <button
              v-if="store.estaHablando"
              @click="interrumpirAvatar"
              class="px-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-lg animate-pulse"
              title="Detener voz"
            >
              <Icon icon="mdi:stop-circle-outline" class="text-xl" />
            </button>
            <button
              v-else
              @click="() => enviarPregunta()"
              :disabled="store.cargando || store.estaEscuchando"
              class="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              <Icon icon="mdi:send" class="text-xl" />
            </button>

          </div>
        </div>
      </div>

      <div
        v-if="store.respuestaBot"
        class="bg-white/95 p-4 rounded-xl shadow-xl border-l-4 border-blue-500 animate-bounce-in flex flex-col gap-3"
      >
        <div class="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
          <p class="text-[10px] text-blue-500 font-bold mb-1 uppercase tracking-wide">Tú preguntaste:</p>
          <p class="text-gray-700 text-sm italic">"{{ store.preguntaMostrada }}"</p>
        </div>
        <div>
          <p class="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">Asistente Virtual dice:</p>
          <p class="text-gray-800 text-sm leading-relaxed font-medium whitespace-pre-wrap">{{ store.respuestaBot }}</p>
        </div>
      </div>

      <div class="flex gap-2">
        <span v-if="store.estaHablando" class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/50 flex items-center gap-1">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Hablando
        </span>
        <span v-else-if="store.estaEscuchando" class="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/50 flex items-center gap-1">
          <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Escuchando
        </span>
        <span v-else class="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded border border-gray-600">
          En espera
        </span>
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
import { ref } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import { Icon } from '@iconify/vue'
import { consultarRAG } from '@/services/backendService'
import TheAvatar from '@/components/avatar/TheAvatar.vue'
import { useAvatarStore } from '@/stores/avatar'
import { useSpeech } from '@/composables/useSpeech'

// ─── STORES Y COMPOSABLES ────────────────────────────────────────────────────

const store = useAvatarStore()
const { hablar, iniciarEscucha, detenerEscucha: detenerEscuchaComposable, interrumpir, formatearTextoParaVoz } = useSpeech()

// ─── ESTADO LOCAL (solo lo que no está en el store) ──────────────────────────

const preguntaUsuario = ref('')

// ─── FUNCIONES DE AUDIO ──────────────────────────────────────────────────────

const empezarAEscuchar = () => {
  iniciarEscucha()
}

const detenerEscucha = () => {
  detenerEscuchaComposable((textoCapturado) => {
    enviarPregunta(textoCapturado)
  })
}

const interrumpirAvatar = () => {
  interrumpir()
}

// ─── LÓGICA DE CHAT ──────────────────────────────────────────────────────────

const enviarPregunta = async (textoDirecto?: string) => {
  const mensaje = textoDirecto || preguntaUsuario.value
  if (!mensaje.trim()) return

  interrumpirAvatar()
  store.setCargando(true)
  store.setRespuesta(mensaje, 'Pensando...')

  try {
    const data = await consultarRAG(mensaje)
    const texto = data.respuesta

    if (texto && texto.trim()) {
      store.setRespuesta(mensaje, texto)

      const textoParaVoz = formatearTextoParaVoz(texto)
      hablar(textoParaVoz)
    } else {
      const msg = 'No entendí, intenta de nuevo.'
      store.setRespuesta(mensaje, msg)
      hablar(msg)
    }
  } catch (error: any) {
    const errorMsg = 'Error de conexión con el servidor: ' + (error.message || 'Error desconocido')
    store.setRespuesta(mensaje, errorMsg)
  } finally {
    store.setCargando(false)
    if (!textoDirecto) preguntaUsuario.value = ''
  }
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