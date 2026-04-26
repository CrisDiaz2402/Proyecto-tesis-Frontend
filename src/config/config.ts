const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}

const BASE = getBaseUrl()

export const BACKEND_URL = BASE

export const WS_BASE_URL = BASE
  .replace(/^https/, 'wss')
  .replace(/^http/, 'ws')

export const MAX_DOCUMENTOS = 10;
export const LIMITE_TAMANO_MB = 5;
export const LIMITE_TAMANO_BYTES = LIMITE_TAMANO_MB * 1024 * 1024;
export const EXTENSIONES_PERMITIDAS = ['.pdf', '.docx', '.txt', '.md'];