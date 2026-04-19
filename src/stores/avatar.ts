// src/stores/avatar.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAvatarStore = defineStore('avatar', () => {

  const estaHablando   = ref(false)
  const estaEscuchando = ref(false)
  const preguntaMostrada = ref('')
  const respuestaBot     = ref('')
  const cargando         = ref(false)

  function setHablando(valor: boolean) {
    estaHablando.value = valor
  }

  function setEscuchando(valor: boolean) {
    estaEscuchando.value = valor
  }

  function setRespuesta(pregunta: string, respuesta: string) {
    preguntaMostrada.value = pregunta
    respuestaBot.value     = respuesta
  }

  function setCargando(valor: boolean) {
    cargando.value = valor
  }

  function resetChat() {
    preguntaMostrada.value = ''
    respuestaBot.value     = ''
    cargando.value         = false
  }

  return {
    estaHablando,
    estaEscuchando,
    cargando,
    preguntaMostrada,
    respuestaBot,
    setHablando,
    setEscuchando,
    setRespuesta,
    setCargando,
    resetChat,
  }
})