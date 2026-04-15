// src/config/config.ts

// ─── INFRAESTRUCTURA (Leído del .env) ──────────────────────────────────────
// Usamos import.meta.env para leer el .env en Vite. 
// Dejamos los localhost como plan de respaldo (fallback) por si falla el .env.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'