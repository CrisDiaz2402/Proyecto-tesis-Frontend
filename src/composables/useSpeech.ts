import { ref, onMounted } from 'vue'
import { useAvatarStore } from '@/stores/avatar'

export function useSpeech() {
  const store = useAvatarStore()

  const synthRef = ref<SpeechSynthesis | null>(null)
  let vocesDisponibles: SpeechSynthesisVoice[] = []
  let recognition: any = null
  let textoVozCapturado = ''

  const soportaSynthesis  = ref(false)
  const soportaRecognition = ref(false)

  onMounted(() => {
    if (!('speechSynthesis' in window)) {
      console.warn('[useSpeech] SpeechSynthesis not supported')
    } else {
      synthRef.value = window.speechSynthesis
      soportaSynthesis.value = true

      const cargarVoces = () => {
        try {
          vocesDisponibles = synthRef.value!.getVoices()
        } catch (e) {
          console.error('[useSpeech] load voices error:', e)
          vocesDisponibles = []
        }
      }

      cargarVoces()

      if (synthRef.value.onvoiceschanged !== undefined) {
        synthRef.value.onvoiceschanged = cargarVoces
      }
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('[useSpeech] SpeechRecognition not supported')
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
          console.error('[useSpeech] recognition error:', event.error)
          store.setEscuchando(false)
        }

        recognition.onend = () => {
          if (store.estaEscuchando) {
            store.setEscuchando(false)
          }
        }
      } catch (e) {
        console.error('[useSpeech] init error:', e)
        recognition = null
        soportaRecognition.value = false
      }
    }
  })

  function hablar(texto: string): void {
    if (!soportaSynthesis.value || !synthRef.value) {
      console.warn('[useSpeech] synthesis unavailable')
      return
    }

    try {
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
        console.error('[useSpeech] speak error:', e)
        store.setHablando(false)
      }

      synthRef.value.speak(utterance)
    } catch (e) {
      console.error('[useSpeech] hablar error:', e)
      store.setHablando(false)
    }
  }

  function iniciarEscucha(): (callback: (texto: string) => void) => void {
    if (!soportaRecognition.value || !recognition) {
      console.warn('[useSpeech] recognition unavailable')
      return () => {}
    }

    interrumpir() 
    textoVozCapturado = ''
    store.setEscuchando(true)

    try {
      recognition.start()
    } catch (e) {
      console.error('[useSpeech] start error:', e)
      store.setEscuchando(false)
      return () => {}
    }

    return (callback: (texto: string) => void) => {
      if (!store.estaEscuchando) return
      store.setEscuchando(false)

      try {
        recognition.stop()
      } catch (e) {
        console.error('[useSpeech] stop error:', e)
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
      console.error('[useSpeech] stop error:', e)
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
      console.error('[useSpeech] interrupt error:', e)
      store.setHablando(false)
    }
  }

  function formatearTextoParaVoz(texto: string): string {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '$1')                           
      .replace(/\*(.*?)\*/g, '$1')                                 
      .replace(/#+\s/g, '')                                         
      .replace(/[^\w\s.,;:!?ñÑáéíóúÁÉÍÓÚüÜ]/g, '')               
      .trim()
  }

  return {
    estaHablando:     store.estaHablando,
    estaEscuchando:   store.estaEscuchando,
    soportaSynthesis,
    soportaRecognition,
    hablar,
    iniciarEscucha,
    detenerEscucha,
    interrumpir,
    formatearTextoParaVoz,
  }
}