// src/config/config.ts

// ─── 1. INFRAESTRUCTURA (Leído del .env) ──────────────────────────────────────
// Usamos import.meta.env para leer el .env en Vite. 
// Dejamos los localhost como plan de respaldo (fallback) por si falla el .env.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
export const RASA_URL    = import.meta.env.VITE_RASA_URL    || 'http://localhost:5005'


// ─── 2. REGLAS DE NEGOCIO (Única Fuente de Verdad - Hardcodeado) ──────────────
// Igual que en el backend, estas son las reglas estrictas de tu tesis.

// Límite máximo de documentos en el panel de administración
export const MAX_DOCUMENTOS = 10

// Límite de peso para los archivos
export const LIMITE_TAMANO_MB = 5
export const LIMITE_TAMANO_BYTES = LIMITE_TAMANO_MB * 1024 * 1024

// Extensiones válidas para el sistema RAG
export const EXTENSIONES_PERMITIDAS = ['.pdf', '.docx', '.txt', '.md']

// Nombre de la variable guardada en el navegador para recordar al usuario
export const SESSION_STORAGE_KEY = 'avatar_session_id'