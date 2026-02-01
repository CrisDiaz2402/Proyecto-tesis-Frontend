<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';
import TheAvatar from './components/TheAvatar.vue';

// --- ESTADO DEL SISTEMA ---
const preguntaUsuario = ref('');      // Solo para texto escrito manualmente
const respuestaBot = ref('');         // Respuesta del bot
const estaHablando = ref(false);      // Avatar hablando
const estaEscuchando = ref(false);    // Micrófono activo
const cargando = ref(false);          // Bloqueo de UI

// --- VARIABLES DE VOZ INTERNAS ---
let synth: SpeechSynthesis;
let vocesDisponibles: SpeechSynthesisVoice[] = [];
let recognition: any = null;
let textoVozCapturado = ''; // Variable OCULTA para almacenar la voz

// --- INICIALIZACIÓN ---
onMounted(() => {
  // 1. Configurar TTS (Habla del Avatar)
  synth = window.speechSynthesis;
  const cargarVoces = () => { vocesDisponibles = synth.getVoices(); };
  cargarVoces();
  if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = cargarVoces;

  // 2. Configurar STT (Reconocimiento)
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-EC';
    recognition.continuous = true;
    recognition.interimResults = true;

    // ALERTA: Aquí está el cambio. Guardamos en variable interna, NO en el input.
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      
      textoVozCapturado = transcript; // Se guarda en memoria, usuario no lo ve
    };

    recognition.onerror = (event: any) => {
      console.error("Error micrófono:", event.error);
      estaEscuchando.value = false;
    };
  } else {
    console.warn("Navegador no soporta SpeechRecognition");
  }
});

// --- LÓGICA PUSH-TO-TALK (INVISIBLE) ---
const empezarAEscuchar = () => {
  if (!recognition || estaHablando.value) return;
  
  textoVozCapturado = ''; // Limpiamos la memoria de voz
  estaEscuchando.value = true;
  recognition.start();
};

const detenerEscucha = () => {
  if (!recognition || !estaEscuchando.value) return;
  
  estaEscuchando.value = false;
  recognition.stop();
  
  // Esperamos brevemente para asegurar que el último fragmento se procese
  setTimeout(() => {
    if (textoVozCapturado.trim()) {
      // ENVIAMOS AUTOMÁTICAMENTE LA VOZ CAPTURADA
      enviarPregunta(textoVozCapturado);
    }
  }, 500);
};

// --- LÓGICA DE CONEXIÓN (MODIFICADA PARA ACEPTAR ARGUMENTO) ---
// Ahora acepta un parámetro opcional 'textoDirecto'
const enviarPregunta = async (textoDirecto?: string) => {
  
  // Prioridad: 1. Texto de Voz (si existe) | 2. Texto del Input manual
  const mensajeAEnviar = textoDirecto || preguntaUsuario.value;

  if (!mensajeAEnviar.trim()) return;

  if (synth.speaking) synth.cancel();

  cargando.value = true;
  respuestaBot.value = "Procesando..."; 

  try {
    const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: "tesis_user_01", 
        message: mensajeAEnviar // Enviamos el mensaje calculado
      })
    });

    const data = await response.json();

    if (data && data.length > 0) {
      const texto = data[0].text;
      respuestaBot.value = texto;
      hablarTextoReal(texto);
    } else {
      const errorMsg = "No entendí, intenta de nuevo.";
      respuestaBot.value = errorMsg;
      hablarTextoReal(errorMsg);
    }

  } catch (error) {
    console.error(error);
    respuestaBot.value = "Error de conexión con Rasa.";
  } finally {
    cargando.value = false;
    // Solo limpiamos el input manual si se usó el input manual
    if (!textoDirecto) {
      preguntaUsuario.value = '';
    }
  }
};

// --- FUNCIÓN TTS ---
const hablarTextoReal = (texto: string) => {
  const utterance = new SpeechSynthesisUtterance(texto);
  const voz = vocesDisponibles.find(v => v.lang.includes('es')) || vocesDisponibles[0];
  if (voz) utterance.voice = voz;
  utterance.rate = 1.0; 
  utterance.onstart = () => { estaHablando.value = true; };
  utterance.onend = () => { estaHablando.value = false; };
  synth.speak(utterance);
};
</script>

<template>
  <div class="w-full h-screen bg-gray-900 relative select-none">
    
    <div class="absolute top-5 left-5 z-10 flex flex-col gap-4 w-96">
      
      <div class="bg-gray-800/90 p-4 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm">
        <div class="flex flex-col gap-3">
          <label class="text-blue-400 text-xs font-bold uppercase tracking-wider">
            Consultas: Carrera de Software
          </label>
          
          <div class="flex gap-2 items-stretch">
            
            <input 
              type="text" 
              v-model="preguntaUsuario"
              @keyup.enter="() => enviarPregunta()"
              :disabled="cargando || estaEscuchando"
              :placeholder="estaEscuchando ? 'Escuchando... (suelta para enviar)' : 'Escribe tu pregunta...'"
              class="flex-1 px-3 py-2 bg-gray-700 text-white text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all"
            />
            
            <button 
              @mousedown="empezarAEscuchar" 
              @mouseup="detenerEscucha"
              @touchstart.prevent="empezarAEscuchar"
              @touchend.prevent="detenerEscucha"
              :disabled="cargando"
              :class="[
                'px-3 rounded-lg transition-all flex items-center justify-center shadow-lg',
                estaEscuchando ? 'bg-red-500 animate-pulse ring-2 ring-red-400' : 'bg-gray-600 hover:bg-gray-500'
              ]"
              title="Mantener presionado para hablar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            <button 
              @click="() => enviarPregunta()"
              :disabled="cargando || estaEscuchando"
              class="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>

          </div>
        </div>
      </div>

      <div v-if="respuestaBot" class="bg-white/95 p-4 rounded-xl shadow-xl border-l-4 border-blue-500 animate-bounce-in">
        <p class="text-xs text-gray-500 font-bold mb-1">ASISTENTE VIRTUAL DICE:</p>
        <p class="text-gray-800 text-sm leading-relaxed font-medium">
          {{ respuestaBot }}
        </p>
      </div>

      <div class="flex gap-2">
        <span v-if="estaHablando" class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/50 flex items-center gap-1">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Hablando
        </span>
        <span v-else-if="estaEscuchando" class="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/50 flex items-center gap-1">
          <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Escuchando (Invisible)
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
           <TresMesh :position="[0, 1.5, 0]"><TresBoxGeometry /><TresMeshBasicMaterial color="red" wireframe /></TresMesh>
        </template>
      </Suspense>
    </TresCanvas>
  </div>
</template>

<style scoped>
.animate-bounce-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
</style>