// src/types/evaluacion.ts
import type { CasoEvaluacion } from '@/services/backendService'

export const STORAGE_KEY_GOLDEN = 'rag_eval_golden_v1'

export function generarId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const GRUPOS_SUGERIDOS = [
  'TP Directo',
  'TP Razonamiento',
  'TN Fuera dominio',
  'Corrección',
  'Anti-alucinación',
  'General',
] as const

export const CASO_EJEMPLO: CasoEvaluacion = {
  id: 'A1',
  grupo: 'TP Directo',
  pregunta: '¿Cuántos créditos necesita un estudiante para graduarse?',
  respuesta_esperada: 'Un estudiante necesita 135 créditos para graduarse.',
  umbral_similitud: 0.80,
  habilitado: true,
}

export const JSON_EJEMPLO = JSON.stringify({
  version: '2.0',
  descripcion: 'Golden Dataset — Evaluación del sistema',
  casos: [
    {
      id: 'A1',
      grupo: 'TP Directo',
      pregunta: '¿Cuántos créditos necesita un estudiante para graduarse?',
      respuesta_esperada: 'Un estudiante necesita 135 créditos para graduarse.',
      umbral_similitud: 0.80,
      habilitado: true,
    },
    {
      id: 'C1',
      grupo: 'TN Fuera dominio',
      pregunta: '¿Cuál es el costo por crédito?',
      respuesta_esperada: 'No encontré información sobre eso en los documentos académicos disponibles.',
      umbral_similitud: 0.75,
      habilitado: true,
    },
  ],
}, null, 2)

