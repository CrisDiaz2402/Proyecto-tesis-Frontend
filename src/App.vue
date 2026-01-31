<script setup lang="ts">
import { ref, onMounted } from 'vue'; // Agregamos onMounted para cargar las voces
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';
import TheAvatar from './components/TheAvatar.vue';

// --- ESTADO DEL SISTEMA ---
const preguntaUsuario = ref('');      // Texto del input
const respuestaBot = ref('');         // Texto que devuelve Rasa
const estaHablando = ref(false);      // Controla la animación de la boca
const cargando = ref(false);          // Para bloquear el botón mientras piensa

// --- VARIABLES DE SÍNTESIS DE VOZ ---
let synth: SpeechSynthesis;
let vocesDisponibles: SpeechSynthesisVoice[] = [];

// --- INICIALIZACIÓN (AL CARGAR LA PÁGINA) ---
onMounted(() => {
  synth = window.speechSynthesis;
  
  // Función para cargar voces (Chrome a veces las carga asíncronamente)
  const cargarVoces = () => {
    vocesDisponibles = synth.getVoices();
    // Opcional: Imprimir en consola para ver qué voces detecta tu PC
    console.log("Voces cargadas:", vocesDisponibles.length);
  };

  // Intentamos cargar de inmediato y también escuchamos si cambian
  cargarVoces();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = cargarVoces;
  }
});

// --- LÓGICA DE CONEXIÓN CON RASA ---
const enviarPregunta = async () => {
  if (!preguntaUsuario.value.trim()) return;

  // Si el bot estaba hablando de antes, lo callamos
  if (synth.speaking) synth.cancel();

  cargando.value = true;
  respuestaBot.value = "Consultando..."; // Feedback visual rápido

  try {
    // 1. Petición al Backend de Rasa
    const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: "tesis_user_01", 
        message: preguntaUsuario.value
      })
    });

    const data = await response.json();

    // 2. Procesar respuesta
    if (data && data.length > 0) {
      const texto = data[0].text;
      respuestaBot.value = texto;
      
      // CAMBIO CLAVE: Usamos la función de voz real en vez de la simulación
      hablarTextoReal(texto); 
      
    } else {
      const errorMsg = "Lo siento, no entendí tu pregunta. Intenta de nuevo.";
      respuestaBot.value = errorMsg;
      hablarTextoReal(errorMsg);
    }

  } catch (error) {
    console.error("Error de conexión:", error);
    respuestaBot.value = "Error: No se pudo conectar con Rasa.";
  } finally {
    cargando.value = false;
    preguntaUsuario.value = '';
  }
};

// --- FUNCIÓN DE TEXT-TO-SPEECH (TTS) ---
// Esta función convierte el texto a audio y sincroniza la boca
const hablarTextoReal = (texto: string) => {
  // Crear el objeto de "enunciado"
  const utterance = new SpeechSynthesisUtterance(texto);

  // 1. Buscar una voz en español
  // Prioriza voces de Google o Microsoft si existen, sino cualquiera en 'es'
  const vozEspanol = vocesDisponibles.find(voice => 
    voice.lang.includes('es') && (voice.name.includes('Google') || voice.name.includes('Microsoft'))
  ) || vocesDisponibles.find(voice => voice.lang.includes('es'));

  if (vozEspanol) {
    utterance.voice = vozEspanol;
  }

  // 2. Configuración (puedes ajustar velocidad/pitch aquí)
  utterance.rate = 1.0; 
  utterance.pitch = 1.0;

  // 3. SINCRONIZACIÓN EXACTA
  // La boca se abre cuando empieza el audio
  utterance.onstart = () => {
    estaHablando.value = true;
  };

  // La boca se cierra exactamente cuando termina el audio
  utterance.onend = () => {
    estaHablando.value = false;
  };

  utterance.onerror = (event) => {
    console.error("Error al hablar:", event);
    estaHablando.value = false; // Seguridad para que no se quede boca abierta si falla
  };

  // 4. Ejecutar
  synth.speak(utterance);
};
</script>

<template>
  <div class="w-full h-screen bg-gray-900 relative">
    
    <div class="absolute top-5 left-5 z-10 flex flex-col gap-4 w-96">
      
      <div class="bg-gray-800/90 p-4 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm">
        <div class="flex flex-col gap-3">
          <label for="pregunta" class="text-blue-400 text-xs font-bold uppercase tracking-wider">
            Consultas: Carrera de Software
          </label>
          
          <div class="flex gap-2">
            <input 
              id="pregunta"
              type="text" 
              v-model="preguntaUsuario"
              @keyup.enter="enviarPregunta"
              :disabled="cargando"
              class="w-full px-3 py-2 bg-gray-700 text-white text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all"
              placeholder="Ej: ¿Qué materias veo en primer nivel?"
            />
            
            <button 
              @click="enviarPregunta"
              :disabled="cargando"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              <span v-if="!cargando">Enviar</span>
              <span v-else>...</span>
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

<style scoped>
.animate-bounce-in {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>