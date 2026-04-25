export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string

export const WS_BASE_URL = BACKEND_URL
  .replace(/^https/, 'wss')
  .replace(/^http/, 'ws')

export const MAX_DOCUMENTOS = 10;
export const LIMITE_TAMANO_MB = 5;
export const LIMITE_TAMANO_BYTES = LIMITE_TAMANO_MB * 1024 * 1024;
export const EXTENSIONES_PERMITIDAS = ['.pdf', '.docx', '.txt', '.md'];