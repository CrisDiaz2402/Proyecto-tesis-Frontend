// src/config/config.ts

// ─── INFRAESTRUCTURA (Leído del .env) ──────────────────────────────────────
// Usamos import.meta.env para leer el .env en Vite. 
// Dejamos los localhost como plan de respaldo (fallback) por si falla el .env.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

// ─── CONSTANTES DE VALIDACIÓN DEL BACKEND ──────────────────────────────────
export const MAX_DOCUMENTOS = 10;
export const LIMITE_TAMANO_MB = 5;
export const LIMITE_TAMANO_BYTES = LIMITE_TAMANO_MB * 1024 * 1024;
export const EXTENSIONES_PERMITIDAS = ['.pdf', '.docx', '.txt', '.md'];