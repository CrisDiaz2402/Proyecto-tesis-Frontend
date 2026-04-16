// src/composables/useSpeech.ts
import { ref, onMounted } from 'vue'
import { useAvatarStore } from '@/stores/avatar'

export function useSpeech() {
  const store = useAvatarStore()

  // Usamos refs para que sean accesibles fuera del onMounted de forma segura
  const synthRef = ref<SpeechSynthesis | null>(null)
  let vocesDisponibles: SpeechSynthesisVoice[] = []
  let recognition: any = null
  let textoVozCapturado = ''

  // ─── Flags de soporte del navegador ──────────────────────────────────────────
  const soportaSynthesis  = ref(false)
  const soportaRecognition = ref(false)

  onMounted(() => {
    // ─── INICIALIZACIÓN DE SPEECH SYNTHESIS ─────────────────────────────────
    if (!('speechSynthesis' in window)) {
      console.warn('[useSpeech] SpeechSynthesis no está soportado en este navegador.')
    } else {
      synthRef.value = window.speechSynthesis
      soportaSynthesis.value = true

      // CORRECCIÓN: era synth.getVoces() — el método correcto es getVoices()
      const cargarVoces = () => {
        try {
          vocesDisponibles = synthRef.value!.getVoices()
        } catch (e) {
          console.error('[useSpeech] Error al cargar voces:', e)
          vocesDisponibles = []
        }
      }

      cargarVoces()

      // onvoiceschanged se dispara cuando el navegador termina de cargar las voces
      if (synthRef.value.onvoiceschanged !== undefined) {
        synthRef.value.onvoiceschanged = cargarVoces
      }
    }

    // ─── INICIALIZACIÓN DE SPEECH RECOGNITION ───────────────────────────────
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('[useSpeech] SpeechRecognition no está soportado en este navegador.')
    } else {
      soportaRecognition.value = true
      try {
        recognition = new SpeechRecognition()
        recognition.lang = 'es-EC'
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event: any) => {
          textoVozCapturado = Array.from(event.results)
            .map((r: any) => r[0].transcript)
            .join('')
        }

        recognition.onerror = (event: any) => {
          console.error('[useSpeech] Error de reconocimiento de voz:', event.error)
          store.setEscuchando(false)
        }

        recognition.onend = () => {
          // El recognition puede terminar solo (timeout, etc.) — asegurar estado consistente
          if (store.estaEscuchando) {
            store.setEscuchando(false)
          }
        }
      } catch (e) {
        console.error('[useSpeech] Error al inicializar SpeechRecognition:', e)
        recognition = null
        soportaRecognition.value = false
      }
    }
  })

  // ─── FUNCIONES PÚBLICAS ───────────────────────────────────────────────────────

  function hablar(texto: string): void {
    if (!soportaSynthesis.value || !synthRef.value) {
      console.warn('[useSpeech] SpeechSynthesis no disponible.')
      return
    }

    try {
      // Cancelar cualquier utterance anterior antes de hablar
      if (synthRef.value.speaking) {
        synthRef.value.cancel()
      }

      const utterance = new SpeechSynthesisUtterance(texto)
      const voz =
        vocesDisponibles.find(v => v.lang.startsWith('es')) || vocesDisponibles[0] || null

      if (voz) utterance.voice = voz
      utterance.rate = 1.0
      utterance.lang = 'es-EC'

      utterance.onstart = () => store.setHablando(true)
      utterance.onend   = () => store.setHablando(false)
      utterance.onerror = (e) => {
        console.error('[useSpeech] Error al hablar:', e)
        store.setHablando(false)
      }

      synthRef.value.speak(utterance)
    } catch (e) {
      console.error('[useSpeech] Error inesperado en hablar():', e)
      store.setHablando(false)
    }
  }

  /**
   * Inicia la escucha por micrófono.
   * Devuelve una función "detener" que al llamarse detiene la escucha
   * y pasa el texto capturado al callback.
   */
  function iniciarEscucha(): (callback: (texto: string) => void) => void {
    if (!soportaRecognition.value || !recognition) {
      console.warn('[useSpeech] SpeechRecognition no disponible.')
      return () => {}
    }

    interrumpir() // detener síntesis si está hablando
    textoVozCapturado = ''
    store.setEscuchando(true)

    try {
      recognition.start()
    } catch (e) {
      console.error('[useSpeech] Error al iniciar reconocimiento:', e)
      store.setEscuchando(false)
      return () => {}
    }

    // Devuelve la función "detener"
    return (callback: (texto: string) => void) => {
      if (!store.estaEscuchando) return
      store.setEscuchando(false)

      try {
        recognition.stop()
      } catch (e) {
        console.error('[useSpeech] Error al detener reconocimiento:', e)
      }

      setTimeout(() => {
        if (textoVozCapturado.trim()) {
          callback(textoVozCapturado.trim())
        }
      }, 500)
    }
  }

  function detenerEscucha(callback?: (texto: string) => void): void {
    if (!recognition || !store.estaEscuchando) return

    store.setEscuchando(false)

    try {
      recognition.stop()
    } catch (e) {
      console.error('[useSpeech] Error al detener reconocimiento:', e)
    }

    setTimeout(() => {
      if (textoVozCapturado.trim() && callback) {
        callback(textoVozCapturado.trim())
      }
    }, 500)
  }

  function interrumpir(): void {
    if (!synthRef.value) return
    try {
      if (synthRef.value.speaking) {
        synthRef.value.cancel()
        store.setHablando(false)
      }
    } catch (e) {
      console.error('[useSpeech] Error al interrumpir síntesis:', e)
      store.setHablando(false)
    }
  }

  function formatearTextoParaVoz(texto: string): string {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '$1')                              // **bold** → text
      .replace(/\*(.*?)\*/g, '$1')                                  // *italic* → text
      .replace(/#+\s/g, '')                                         // # headers → text
      .replace(/[^\w\s.,;:!?ñÑáéíóúÁÉÍÓÚüÜ]/g, '')               // solo caracteres seguros
      .trim()
  }

  return {
    // Estado (del store)
    estaHablando:     store.estaHablando,
    estaEscuchando:   store.estaEscuchando,
    // Flags de soporte
    soportaSynthesis,
    soportaRecognition,
    // Funciones
    hablar,
    iniciarEscucha,
    detenerEscucha,
    interrumpir,
    formatearTextoParaVoz,
  }
}