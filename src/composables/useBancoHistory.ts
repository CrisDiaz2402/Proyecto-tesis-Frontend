// src/composables/useBancoHistory.ts

import { ref, computed } from 'vue'
import type { CasoEvaluacion } from '@/services/backendService'

export function useBancoHistory(estadoInicial: CasoEvaluacion[]) {
  const history = ref<string[]>([])
  const maxSnapshots = 50

  // Guarda un snapshot (serializado) del estado actual
  function pushSnapshot(casos: CasoEvaluacion[]): void {
    const snap = JSON.stringify(casos)
    history.value.push(snap)
    if (history.value.length > maxSnapshots) {
      history.value.shift()
    }
  }

  // Restaura el último snapshot
  function popSnapshot(): CasoEvaluacion[] | null {
    if (history.value.length === 0) return null
    const snap = history.value.pop()!
    return JSON.parse(snap)
  }

  const canUndo = computed(() => history.value.length > 0)

  function undo(): CasoEvaluacion[] | null {
    return popSnapshot()
  }

  pushSnapshot(estadoInicial)

  return {
    canUndo,
    undo,
    pushSnapshot,
  }
}
