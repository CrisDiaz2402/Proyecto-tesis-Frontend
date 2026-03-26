// src/stores/avatar.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAvatarStore = defineStore('avatar', () => {

  // ─── ESTADO DE VOZ ──────────────────────────────────────────────────────────

  const estaHablando   = ref(false)
  const estaEscuchando = ref(false)

  // ─── ESTADO DE CHAT ─────────────────────────────────────────────────────────

  const preguntaMostrada = ref('')
  const respuestaBot     = ref('')
  const cargando         = ref(false)

  // ─── HISTORIAL ──────────────────────────────────────────────────────────────
  // Cuando el backend tenga un endpoint de historial, persistir aquí.
  //
  // interface Turno { pregunta: string; respuesta: string; fecha: Date }
  // const historial = ref<Turno[]>([])
  //
  // function agregarTurno(pregunta: string, respuesta: string) {
  //   historial.value.push({ pregunta, respuesta, fecha: new Date() })
  // }

  // ─── ACCIONES ───────────────────────────────────────────────────────────────

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