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
              :disabled="cargando || estaEscuchando"
              :placeholder="estaEscuchando ? 'Escuchando... (suelta para enviar)' : 'Escribe tu pregunta...'"
              class="flex-1 px-3 py-2 bg-gray-700 text-white text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
              @mousedown="empezarAEscuchar"
              @mouseup="detenerEscucha"
              @touchstart.prevent="empezarAEscuchar"
              @touchend.prevent="detenerEscucha"
              :disabled="cargando"
              :class="[
                'px-3 rounded-lg transition-all flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
                estaEscuchando ? 'bg-red-500 animate-pulse ring-2 ring-red-400' : 'bg-gray-600 hover:bg-gray-500'
              ]"
              title="Mantener presionado para hablar"
            >
              <Icon icon="mdi:microphone" class="text-white text-xl" />
            </button>

            <button
              v-if="estaHablando"
              @click="interrumpirAvatar"
              class="px-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-lg animate-pulse"
              title="Detener voz"
            >
              <Icon icon="mdi:stop-circle-outline" class="text-xl" />
            </button>
            <button
              v-else
              @click="() => enviarPregunta()"
              :disabled="cargando || estaEscuchando"
              class="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              <Icon icon="mdi:send" class="text-xl" />
            </button>

          </div>
        </div>
      </div>

      <div
        v-if="respuestaBot"
        class="bg-white/95 p-4 rounded-xl shadow-xl border-l-4 border-blue-500 animate-bounce-in flex flex-col gap-3"
      >
        <div class="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
          <p class="text-[10px] text-blue-500 font-bold mb-1 uppercase tracking-wide">Tú preguntaste:</p>
          <p class="text-gray-700 text-sm italic">"{{ preguntaMostrada }}"</p>
        </div>
        <div>
          <p class="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">Asistente Virtual dice:</p>
          <p class="text-gray-800 text-sm leading-relaxed font-medium whitespace-pre-wrap">{{ respuestaBot }}</p>
        </div>
      </div>

      <div class="flex gap-2">
        <span v-if="estaHablando" class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/50 flex items-center gap-1">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Hablando
        </span>
        <span v-else-if="estaEscuchando" class="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/50 flex items-center gap-1">
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
        <TheAvatar :is-speaking="estaHablando" />
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
import { ref, onMounted } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import { Icon } from '@iconify/vue'
import { RASA_URL, SESSION_STORAGE_KEY } from '@/config/config'
import TheAvatar from '@/components/avatar/TheAvatar.vue'

const preguntaUsuario  = ref('')
const preguntaMostrada = ref('')
const respuestaBot     = ref('')
const estaHablando     = ref(false)
const estaEscuchando   = ref(false)
const cargando         = ref(false)

let synth: SpeechSynthesis
let vocesDisponibles: SpeechSynthesisVoice[] = []
let recognition: any = null
let textoVozCapturado = ''

onMounted(() => {
  synth = window.speechSynthesis
  const cargarVoces = () => { vocesDisponibles = synth.getVoices() }
  cargarVoces()
  if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = cargarVoces

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (SpeechRecognition) {
    recognition = new SpeechRecognition()
    recognition.lang = 'es-EC'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event: any) => {
      textoVozCapturado = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('')
    }
    recognition.onerror = () => { estaEscuchando.value = false }
  }
})

const interrumpirAvatar = () => {
  if (synth && synth.speaking) {
    synth.cancel()
    estaHablando.value = false
  }
}

const empezarAEscuchar = () => {
  if (!recognition) return
  interrumpirAvatar()
  textoVozCapturado = ''
  estaEscuchando.value = true
  recognition.start()
}

const detenerEscucha = () => {
  if (!recognition || !estaEscuchando.value) return
  estaEscuchando.value = false
  recognition.stop()
  setTimeout(() => {
    if (textoVozCapturado.trim()) enviarPregunta(textoVozCapturado)
  }, 500)
}

const hablarTextoReal = (texto: string) => {
  const utterance = new SpeechSynthesisUtterance(texto)
  const voz = vocesDisponibles.find(v => v.lang.includes('es')) || vocesDisponibles[0]
  if (voz) utterance.voice = voz
  utterance.rate   = 1.0
  utterance.onstart = () => { estaHablando.value = true }
  utterance.onend   = () => { estaHablando.value = false }
  utterance.onerror = () => { estaHablando.value = false }
  synth.speak(utterance)
}

const obtenerIdSesion = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!sessionId) {
    sessionId = 'user_' + Math.random().toString(36).substring(2, 11)
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  }
  return sessionId
}

const enviarPregunta = async (textoDirecto?: string) => {
  const mensaje = textoDirecto || preguntaUsuario.value
  if (!mensaje.trim()) return

  interrumpirAvatar()
  preguntaMostrada.value = mensaje
  cargando.value = true
  respuestaBot.value = 'Pensando...'

  try {
    const response = await fetch(`${RASA_URL}/webhooks/rest/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: obtenerIdSesion(), message: mensaje })
    })

    const data = await response.json()

    if (data && data.length > 0) {
      const texto = data
        .map((msg: any) => msg.text)
        .filter((t: any) => typeof t === 'string' && t.trim() !== '')
        .join('\n\n')

      respuestaBot.value = texto

      const textoParaVoz = texto
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#+\s/g, '')
        .replace(/\|/g, ', ')

      hablarTextoReal(textoParaVoz)
    } else {
      const msg = 'No entendí, intenta de nuevo.'
      respuestaBot.value = msg
      hablarTextoReal(msg)
    }
  } catch {
    respuestaBot.value = 'Error de conexión con Rasa.'
  } finally {
    cargando.value = false
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