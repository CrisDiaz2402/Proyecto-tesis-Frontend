// src/services/exportService.ts
import type { ResultadoEvaluacion } from '@/services/backendService'

function colorVeredicto(v: string): string {
  if (v === 'PASS')    return '#10b981'
  if (v === 'PARCIAL') return '#f59e0b'
  return '#ef4444'
}

function bgVeredicto(v: string): string {
  if (v === 'PASS')    return '#10b98120'
  if (v === 'PARCIAL') return '#f59e0b20'
  return '#ef444420'
}

function nivelScore(pct: number): string {
  if (pct >= 85) return 'EXCELENTE'
  if (pct >= 65) return 'ACEPTABLE'
  return 'REQUIERE MEJORAS'
}

function colorScore(pct: number): string {
  if (pct >= 85) return '#10b981'
  if (pct >= 65) return '#f59e0b'
  return '#ef4444'
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-EC', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function generarHTML(r: ResultadoEvaluacion): string {
  const pct      = Math.round(r.score_global * 100)
  const nivel    = nivelScore(pct)
  const scoreClr = colorScore(pct)
  const fecha    = fmtFecha(r.timestamp)

  const filasGrupo = Object.entries(r.resumen_por_grupo).map(([grupo, g]: [string, any]) => `
    <tr>
      <td>${grupo}</td>
      <td style="text-align:center">${Math.round(g.promedio * 100)}%</td>
      <td style="text-align:center; color:#10b981">${g.pass}</td>
      <td style="text-align:center; color:#f59e0b">${g.parcial}</td>
      <td style="text-align:center; color:#ef4444">${g.fail}</td>
      <td style="text-align:center">${g.total}</td>
    </tr>`).join('')

  const filasCasos = r.resultados.map(caso => `
    <tr>
      <td style="font-family:monospace; font-size:11px">${caso.id}</td>
      <td>${caso.grupo}</td>
      <td><span style="font-size:10px; padding:2px 6px; border-radius:4px; background:${bgVeredicto(caso.veredicto)}; color:${colorVeredicto(caso.veredicto)}; border:1px solid ${colorVeredicto(caso.veredicto)}40">${caso.veredicto}</span></td>
      <td style="font-size:11px">${caso.pregunta}</td>
      <td style="font-size:11px; color:#9ca3af">${caso.respuesta.length > 200 ? caso.respuesta.substring(0, 200) + '…' : caso.respuesta}</td>
      <td style="font-size:10px; font-family:monospace; color:#9ca3af">${caso.detalle}</td>
      <td style="text-align:right; font-family:monospace; font-size:11px; color:${caso.latencia_ms < 500 ? '#10b981' : '#9ca3af'}">${caso.latencia_ms < 500 ? '⚡ caché' : caso.latencia_ms + ' ms'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reporte RAG — ${r.experimento} — ${fecha}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f9fafb;
      color: #111827;
      font-size: 14px;
      padding: 32px;
    }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    h2 { font-size: 14px; font-weight: 700; margin-bottom: 14px; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
    .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 32px; }
    .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;
    }
    .score-card {
      background: #fff;
      border: 2px solid ${scoreClr}40;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
    }
    .score-num { font-size: 56px; font-weight: 900; color: ${scoreClr}; line-height: 1; }
    .score-label { font-size: 11px; font-weight: 700; color: ${scoreClr}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 700;
      background: ${scoreClr}20;
      color: ${scoreClr};
      border: 1px solid ${scoreClr}40;
      margin-top: 8px;
    }
    .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
    .stat-row:last-child { border-bottom: none; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .stat-value { font-size: 12px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #f9fafb; }
    th { padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .pass    { color: #10b981; font-weight: 700; }
    .parcial { color: #f59e0b; font-weight: 700; }
    .fail    { color: #ef4444; font-weight: 700; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print {
      body { background: #fff; padding: 16px; }
      .card { break-inside: avoid; }
    }
  </style>
</head>
<body>

  <h1>Reporte de Evaluación RAG</h1>
  <p class="subtitle">Experimento: <strong>${r.experimento}</strong> &nbsp;·&nbsp; Motor: <strong>${r.motor}</strong> &nbsp;·&nbsp; ${fecha} &nbsp;·&nbsp; Duración: ${r.duracion_total_seg}s</p>

  <!-- Score global + conteo + parámetros -->
  <div class="grid3">

    <div class="score-card">
      <p class="score-label">Score Global</p>
      <p class="score-num">${pct}%</p>
      <span class="badge">${nivel}</span>
      <p style="font-size:11px; color:#9ca3af; margin-top:8px">${r.conteo_global.total} preguntas evaluadas</p>
    </div>

    <div class="card" style="margin-bottom:0">
      <h2>Veredictos</h2>
      <div class="stat-row"><span class="stat-label">PASS</span><span class="stat-value pass">${r.conteo_global.pass}</span></div>
      <div class="stat-row"><span class="stat-label">PARCIAL</span><span class="stat-value parcial">${r.conteo_global.parcial}</span></div>
      <div class="stat-row"><span class="stat-label">FAIL</span><span class="stat-value fail">${r.conteo_global.fail}</span></div>
      <div class="stat-row"><span class="stat-label">Total</span><span class="stat-value">${r.conteo_global.total}</span></div>
    </div>

    <div class="card" style="margin-bottom:0">
      <h2>Parámetros</h2>
      <div class="stat-row"><span class="stat-label">Experimento</span><span class="stat-value" style="color:#3b82f6">${r.experimento}</span></div>
      <div class="stat-row"><span class="stat-label">Motor</span><span class="stat-value" style="color:#8b5cf6">${r.motor}</span></div>
      <div class="stat-row"><span class="stat-label">Duración</span><span class="stat-value">${r.duracion_total_seg}s</span></div>
      <div class="stat-row"><span class="stat-label">Fecha</span><span class="stat-value">${fecha}</span></div>
    </div>

  </div>

  <!-- Resumen por grupo -->
  <div class="card">
    <h2>Resumen por grupo</h2>
    <table>
      <thead>
        <tr>
          <th>Grupo</th>
          <th style="text-align:center">Score</th>
          <th style="text-align:center">PASS</th>
          <th style="text-align:center">PARCIAL</th>
          <th style="text-align:center">FAIL</th>
          <th style="text-align:center">Total</th>
        </tr>
      </thead>
      <tbody>${filasGrupo}</tbody>
    </table>
  </div>

  <!-- Detalle caso a caso -->
  <div class="card">
    <h2>Detalle por caso</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Grupo</th>
          <th>Veredicto</th>
          <th>Pregunta</th>
          <th>Respuesta RAG</th>
          <th>Detalle scoring</th>
          <th style="text-align:right">Latencia</th>
        </tr>
      </thead>
      <tbody>${filasCasos}</tbody>
    </table>
  </div>

  <!-- Guía de interpretación -->
  <div class="card">
    <h2>Guía de interpretación</h2>
    <table>
      <tbody>
        <tr><td style="font-weight:600; width:160px">TP Directo</td><td style="color:#6b7280">Si falla: problema de retrieval — umbral muy alto, k muy bajo, o chunking fragmenta el dato. Acción: bajar UMBRAL_RELEVANCIA o aumentar breakpoint_threshold.</td></tr>
        <tr><td style="font-weight:600">TP Razonamiento</td><td style="color:#6b7280">Si falla: el LLM no sintetiza múltiples fragmentos. Acción: subir K.</td></tr>
        <tr><td style="font-weight:600">TN Fuera dominio</td><td style="color:#6b7280">Si falla: el sistema alucinó o el umbral está demasiado bajo. Acción: subir UMBRAL_RELEVANCIA.</td></tr>
        <tr><td style="font-weight:600">Corrección</td><td style="color:#6b7280">Si falla: el LLM confirma el error del usuario (sycophancy). Límite del modelo 8b — no tiene solución de parámetro.</td></tr>
        <tr><td style="font-weight:600">Anti-alucinación</td><td style="color:#6b7280">Si falla: ALUCINACIÓN CRÍTICA. El LLM usó conocimiento de preentrenamiento. Acción: verificar repeat_penalty, top_k, top_p.</td></tr>
        <tr><td style="font-weight:600">Interpretación</td><td style="color:#6b7280">Zona gris — preguntas ambiguas. Un PARCIAL aquí es aceptable.</td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    Generado el ${new Date().toLocaleString('es-EC')} &nbsp;·&nbsp; Sistema RAG EPN &nbsp;·&nbsp; Asistente Académico CC
  </div>

</body>
</html>`
}

export function exportarHTML(resultado: ResultadoEvaluacion): void {
  const html     = generarHTML(resultado)
  const blob     = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url      = URL.createObjectURL(blob)
  const a        = document.createElement('a')
  const fecha    = new Date(resultado.timestamp).toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
  a.href         = url
  a.download     = `reporte_rag_${resultado.experimento}_${fecha}.html`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportarCSV(resultado: ResultadoEvaluacion): void {
  const cabecera = ['id', 'grupo', 'tipo', 'pregunta', 'respuesta', 'latencia_ms', 'score', 'veredicto', 'detalle', 'descripcion']
  const filas    = resultado.resultados.map(r =>
    cabecera.map(col => {
      const val = (r as any)[col] ?? ''
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }).join(',')
  )
  const csv  = [cabecera.join(','), ...filas].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })  
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const fecha = new Date(resultado.timestamp).toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
  a.href     = url
  a.download = `reporte_rag_${resultado.experimento}_${fecha}.csv`
  a.click()
  URL.revokeObjectURL(url)
}