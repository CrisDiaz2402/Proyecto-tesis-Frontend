import { ref, onMounted } from 'vue'
import { useAvatarStore } from '@/stores/avatar'

export function useSpeech() {
  const store = useAvatarStore()

  const synthRef = ref<SpeechSynthesis | null>(null)
  let vocesDisponibles: SpeechSynthesisVoice[] = []

  const soportaSynthesis   = ref(false)
  const soportaRecognition = ref(false)

  let SpeechRecognitionClass: any = null
  let recognitionActiva: any = null
  let textoFinal    = ''
  let textoInterino = ''

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

    SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      console.warn('[useSpeech] SpeechRecognition not supported')
    } else {
      soportaRecognition.value = true
    }
  })

  function crearRecognition(): any {
    if (!SpeechRecognitionClass) return null

    const r = new SpeechRecognitionClass()
    r.lang            = 'es-EC'
    r.continuous      = false
    r.interimResults  = true
    r.maxAlternatives = 1

    r.onresult = (event: any) => {
      textoFinal    = ''
      textoInterino = ''
      for (let i = 0; i < event.results.length; i++) {
        const resultado = event.results[i]
        if (resultado.isFinal) {
          textoFinal += resultado[0].transcript
        } else {
          textoInterino += resultado[0].transcript
        }
      }
    }

    r.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      console.error('[useSpeech] recognition error:', event.error)
      store.setEscuchando(false)
    }

    r.onend = () => {
      if (store.estaEscuchando) {
        store.setEscuchando(false)
      }
    }

    return r
  }

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
    if (!soportaRecognition.value) {
      console.warn('[useSpeech] recognition unavailable')
      return () => {}
    }

    if (recognitionActiva) {
      try { recognitionActiva.abort() } catch (_) {}
      recognitionActiva = null
    }

    textoFinal    = ''
    textoInterino = ''
    store.setEscuchando(true)

    recognitionActiva = crearRecognition()

    if (!recognitionActiva) {
      store.setEscuchando(false)
      return () => {}
    }

    try {
      recognitionActiva.start()
    } catch (e) {
      console.error('[useSpeech] start error:', e)
      store.setEscuchando(false)
      recognitionActiva = null
      return () => {}
    }

    return (callback: (texto: string) => void) => {
      if (!store.estaEscuchando) return
      store.setEscuchando(false)

      try {
        recognitionActiva?.stop()
      } catch (e) {
        console.error('[useSpeech] stop error:', e)
      }

      setTimeout(() => {
        const capturado = (textoFinal || textoInterino).trim()
        recognitionActiva = null
        if (capturado) {
          callback(capturado)
        }
      }, 400)
    }
  }

  function detenerEscucha(callback?: (texto: string) => void): void {
    if (!recognitionActiva || !store.estaEscuchando) return

    store.setEscuchando(false)

    try {
      recognitionActiva.stop()
    } catch (e) {
      console.error('[useSpeech] stop error:', e)
    }

    setTimeout(() => {
      const capturado = (textoFinal || textoInterino).trim()
      recognitionActiva = null
      if (capturado && callback) {
        callback(capturado)
      }
    }, 400)
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
    estaHablando:      store.estaHablando,
    estaEscuchando:    store.estaEscuchando,
    soportaSynthesis,
    soportaRecognition,
    hablar,
    iniciarEscucha,
    detenerEscucha,
    interrumpir,
    formatearTextoParaVoz,
  }
}