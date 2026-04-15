// src/composables/useSpeech.ts
import { ref, onMounted } from 'vue'
import { useAvatarStore } from '@/stores/avatar'

export function useSpeech() {
  const store = useAvatarStore()
  
  let synth: SpeechSynthesis
  let vocesDisponibles: SpeechSynthesisVoice[] = []
  let recognition: any = null
  let textoVozCapturado = ''

  onMounted(() => {
    // ─── INICIALIZACIÓN DE SPEECH SYNTHESIS ─────────────────────────────────
    synth = window.speechSynthesis
    const cargarVoces = () => { 
      vocesDisponibles = synth.getVoces()
    }
    cargarVoces()
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = cargarVoces
    }

    // ─── INICIALIZACIÓN DE SPEECH RECOGNITION ───────────────────────────────
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
      
      recognition.onerror = () => {
        store.setEscuchando(false)
      }
    }
  })

  // ─── FUNCIONES PÚBLICAS ─────────────────────────────────────────────────

  function hablar(texto: string) {
    const utterance = new SpeechSynthesisUtterance(texto)
    const voz = vocesDisponibles.find(v => v.lang.includes('es')) || vocesDisponibles[0]
    
    if (voz) utterance.voice = voz
    utterance.rate = 1.0
    utterance.onstart = () => store.setHablando(true)
    utterance.onend = () => store.setHablando(false)
    utterance.onerror = () => store.setHablando(false)
    
    synth.speak(utterance)
  }

  function iniciarEscucha(): (texto: string) => void {
    if (!recognition) return () => {}
    
    interrumpir()
    textoVozCapturado = ''
    store.setEscuchando(true)
    recognition.start()

    return (callback: (texto: string) => void) => {
      if (!store.estaEscuchando) return
      store.setEscuchando(false)
      recognition.stop()
      
      setTimeout(() => {
        if (textoVozCapturado.trim()) {
          callback(textoVozCapturado)
        }
      }, 500)
    }
  }

  function detenerEscucha(callback?: (texto: string) => void) {
    if (!recognition || !store.estaEscuchando) return
    
    store.setEscuchando(false)
    recognition.stop()
    
    setTimeout(() => {
      if (textoVozCapturado.trim() && callback) {
        callback(textoVozCapturado)
      }
    }, 500)
  }

  function interrumpir() {
    if (synth && synth.speaking) {
      synth.cancel()
      store.setHablando(false)
    }
  }

  function formatearTextoParaVoz(texto: string): string {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '$1')     // **bold** → text
      .replace(/\*(.*?)\*/g, '$1')         // *italic* → text  
      .replace(/#+\s/g, '')                // # headers → text
      .replace(/[^\w\s\.\,\;\:\!\?\ñÑáéíóúÁÉÍÓÚüÜ]/g, '') // solo caracteres seguros
  }

  return {
    // Estado (del store)
    estaHablando: store.estaHablando,
    estaEscuchando: store.estaEscuchando,
    
    // Funciones
    hablar,
    iniciarEscucha,
    detenerEscucha,
    interrumpir,
    formatearTextoParaVoz
  }
}