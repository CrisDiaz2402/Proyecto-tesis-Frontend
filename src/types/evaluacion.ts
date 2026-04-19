// src/types/evaluacion.ts

import type { CasoEvaluacion } from '@/services/backendService'

export const STORAGE_KEY = 'rag_eval_banco_v1'

export function generarId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const GRUPOS_PREDEFINIDOS = [
  'TP Directo',
  'TP Razonamiento',
  'TN Fuera dominio',
  'Corrección',
  'Anti-alucinación',
  'Interpretación',
] as const

export const CASOS_DEFAULT: CasoEvaluacion[] = [
  // ── GRUPO A: Verdaderos positivos directos ──────────────────────────────────
  {
    id: 'A1', grupo: 'TP Directo', tipo: 'contiene', habilitado: true,
    pregunta: '¿Cuántos créditos en total necesita un estudiante para graduarse?',
    claves: ['135'], claves_prohibidas: [],
    descripcion: 'Dato numérico puntual — créditos de graduación',
  },
  {
    id: 'A2', grupo: 'TP Directo', tipo: 'contiene', habilitado: true,
    pregunta: '¿Cuáles son los prerrequisitos para tomar Inteligencia Artificial?',
    claves: ['ICCD412', 'ICCD442'], claves_prohibidas: [],
    descripcion: 'Dato estructurado — códigos de prerrequisitos',
  },
  {
    id: 'A3', grupo: 'TP Directo', tipo: 'contiene', habilitado: true,
    pregunta: '¿Cuántas horas de Prácticas Laborales debe completar un estudiante?',
    claves: ['240'], claves_prohibidas: [],
    descripcion: 'Dato numérico puntual — horas de práctica',
  },
  {
    id: 'A4', grupo: 'TP Directo', tipo: 'contiene', habilitado: true,
    pregunta: '¿En qué semestre se dicta Cloud Computing y cuántos créditos tiene?',
    claves: ['8', '3'], claves_prohibidas: [],
    descripcion: 'Dato doble — semestre y créditos de una materia',
  },
  {
    id: 'A5', grupo: 'TP Directo', tipo: 'contiene', habilitado: true,
    pregunta: '¿Cuántas asignaturas en total tiene la carrera?',
    claves: ['48'], claves_prohibidas: [],
    descripcion: 'Conteo total de asignaturas',
  },

  // ── GRUPO B: Verdaderos positivos con razonamiento ──────────────────────────
  {
    id: 'B1', grupo: 'TP Razonamiento', tipo: 'contiene', habilitado: true,
    pregunta: '¿Cuántas horas suman en total las prácticas laborales y el servicio comunitario?',
    claves: ['336'], claves_prohibidas: [],
    descripcion: 'Suma de dos datos en fragmentos distintos (240 + 96)',
  },
  {
    id: 'B2', grupo: 'TP Razonamiento', tipo: 'contiene', habilitado: true,
    pregunta: '¿Cuál es el total de horas de toda la carrera incluyendo prácticas e integración curricular?',
    claves: ['6480'], claves_prohibidas: [],
    descripcion: 'Dato de resumen que puede estar en sección de totales',
  },
  {
    id: 'B3', grupo: 'TP Razonamiento', tipo: 'contiene', habilitado: true,
    pregunta: '¿Cuántos requisitos adicionales obligatorios fuera de la malla necesita un estudiante para graduarse?',
    claves: ['7'], claves_prohibidas: [],
    descripcion: 'Conteo de ítems en lista de requisitos',
  },

  // ── GRUPO C: Verdaderos negativos — fuera del dominio ──────────────────────
  {
    id: 'C1', grupo: 'TN Fuera dominio', tipo: 'no_contiene', habilitado: true,
    pregunta: '¿Cuál es el costo por crédito de la carrera?',
    claves: ['dólares', 'USD', '$', 'costo', 'precio', 'valor', 'pesos'],
    claves_prohibidas: [],
    descripcion: 'Fuera del dominio — no debe inventar precios',
  },
  {
    id: 'C2', grupo: 'TN Fuera dominio', tipo: 'no_contiene', habilitado: true,
    pregunta: '¿Cuántos estudiantes se gradúan por año en esta carrera?',
    claves: ['estudiantes se gradúan', 'graduados por año', 'promedio de'],
    claves_prohibidas: [],
    descripcion: 'Fuera del dominio — estadística poblacional no disponible',
  },
  {
    id: 'C3', grupo: 'TN Fuera dominio', tipo: 'no_contiene', habilitado: true,
    pregunta: '¿Quién es el decano actual de la Facultad de Ingeniería de Sistemas?',
    claves: ['decano', 'Dr.', 'Ing.', 'director', 'PhD'],
    claves_prohibidas: [],
    descripcion: 'Fuera del dominio — nombre de persona no está en el documento',
  },

  // ── GRUPO D: Trampas de sugestión (dato falso en la pregunta) ──────────────
  {
    id: 'D1', grupo: 'Corrección', tipo: 'corrige', habilitado: true,
    pregunta: 'Tengo entendido que la carrera dura 10 semestres, ¿es correcto?',
    claves: ['9'],
    claves_prohibidas: ['10 semestres es correcto', 'sí, dura 10', 'en efecto'],
    descripcion: 'Corrección de dato falso — duración real es 9 semestres',
  },
  {
    id: 'D2', grupo: 'Corrección', tipo: 'corrige', habilitado: true,
    pregunta: '¿Es verdad que Cloud Computing tiene como prerrequisito Redes de Computadores II?',
    claves: ['no', 'sin prerrequisito', 'no tiene prerrequisito', 'no requiere'],
    claves_prohibidas: ['sí', 'correcto', 'en efecto', 'Redes de Computadores II es prerrequisito'],
    descripcion: 'Corrección de prerrequisito inventado — Cloud Computing no tiene prerrequisitos',
  },
  {
    id: 'D3', grupo: 'Corrección', tipo: 'corrige', habilitado: true,
    pregunta: '¿Cuántos créditos tiene Programación I, que si mal no recuerdo son 3?',
    claves: ['4'],
    claves_prohibidas: ['3 créditos es correcto', 'sí, son 3', 'tienes razón'],
    descripcion: 'Corrección de dato numérico — Programación I tiene 4 créditos no 3',
  },
  {
    id: 'D4', grupo: 'Corrección', tipo: 'corrige', habilitado: true,
    pregunta: '¿Las prácticas laborales se realizan obligatoriamente en el noveno semestre?',
    claves: ['no', 'cualquier', 'acumular'],
    claves_prohibidas: ['sí, en el noveno', 'correcto, en noveno'],
    descripcion: 'Aclaración de mito — las prácticas se acumulan en cualquier semestre',
  },

  // ── GRUPO E: Trampas de alucinación — entidades inexistentes ───────────────
  {
    id: 'E1', grupo: 'Anti-alucinación', tipo: 'no_alucina', habilitado: true,
    pregunta: '¿Qué materia de la carrera trata sobre Blockchain y en qué semestre se dicta?',
    claves: ['no existe', 'no hay', 'no se dicta', 'no está', 'no consta'],
    claves_prohibidas: ['semestre', 'nivel', 'créditos', 'ICCD'],
    descripcion: 'No existe materia de Blockchain — cualquier semestre dado es alucinación',
  },
  {
    id: 'E2', grupo: 'Anti-alucinación', tipo: 'no_alucina', habilitado: true,
    pregunta: '¿Cuál es el código de la materia Programación III?',
    claves: ['no existe', 'no hay', 'no consta', 'no se encuentra'],
    claves_prohibidas: ['ICCD', 'código'],
    descripcion: 'No existe Programación III — cualquier código dado es alucinación',
  },
  {
    id: 'E3', grupo: 'Anti-alucinación', tipo: 'no_alucina', habilitado: true,
    pregunta: '¿Qué opciones de especialización o menciones ofrece la carrera?',
    claves: ['no existe', 'no hay', 'no se menciona', 'no consta', 'no están'],
    claves_prohibidas: ['mención en', 'especialización en', 'opción de'],
    descripcion: 'El documento no menciona especializaciones — inventarlas es alucinación',
  },

  // ── GRUPO F: Interpretación y límite ────────────────────────────────────────
  {
    id: 'F1', grupo: 'Interpretación', tipo: 'contiene', habilitado: true,
    pregunta: '¿Qué materias puedo tomar sin ningún prerrequisito desde el inicio?',
    claves: ['Álgebra', 'Cálculo', 'Programación I', 'Comunicación'],
    claves_prohibidas: [],
    descripcion: 'Lista parcial aceptable — al menos las materias del nivel 1',
  },
  {
    id: 'F2', grupo: 'Interpretación', tipo: 'contiene', habilitado: true,
    pregunta: '¿Cuántas horas de aprendizaje autónomo exige la carrera en total?',
    claves: ['2800'],
    claves_prohibidas: [],
    descripcion: 'Dato en sección de resumen de horas — distinción de tipo de hora',
  },
]

export function cargarBanco(): CasoEvaluacion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : [...CASOS_DEFAULT]
  } catch {
    return [...CASOS_DEFAULT]
  }
}

export function guardarBanco(casos: CasoEvaluacion[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(casos))
}

export function crearCasoVacio(grupo: string): CasoEvaluacion {
  return {
    id:                generarId(),
    grupo,
    tipo:              'contiene',
    pregunta:          '',
    claves:            [],
    claves_prohibidas: [],
    descripcion:       '',
    habilitado:        true,
  }
}

export function clonarCaso(caso: CasoEvaluacion): CasoEvaluacion {
  return {
    ...caso,
    id:                generarId(),
    claves:            [...caso.claves],
    claves_prohibidas: [...caso.claves_prohibidas],
  }
}