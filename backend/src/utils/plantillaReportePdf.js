const ESTILOS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
  .caratula { background: #1E3A5F; color: white; padding: 56px 40px 40px; }
  .caratula h1 { font-size: 26px; margin-bottom: 6px; }
  .caratula h2 { font-size: 16px; font-weight: 400; color: #93C5FD; margin-bottom: 20px; }
  .periodo-label { font-size: 11px; color: #94A3B8; margin-top: 2px; }
  .periodo-value { font-size: 14px; font-weight: 600; color: #E0F2FE; }
  .fecha-gen { font-size: 11px; color: #64748B; margin-top: 10px; }
  .kpi-row { display: flex; gap: 12px; flex-wrap: wrap; padding: 20px 32px; background: #F8FAFC; border-bottom: 2px solid #E2E8F0; }
  .kpi { flex: 1; min-width: 110px; background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 10px; text-align: center; }
  .kpi .valor { font-size: 26px; font-weight: 800; color: #1E3A5F; }
  .kpi .label { font-size: 10px; color: #64748B; margin-top: 3px; line-height: 1.3; }
  .kpi .sub { font-size: 11px; color: #15803D; font-weight: 600; margin-top: 2px; }
  .seccion { padding: 20px 32px; page-break-inside: avoid; }
  .seccion-titulo { font-size: 14px; font-weight: 700; color: #1E3A5F; border-bottom: 2px solid #1E3A5F; padding-bottom: 5px; margin-bottom: 12px; }
  .seccion-sub { font-size: 11px; color: #64748B; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  thead th { background: #1E3A5F; color: white; padding: 7px 10px; text-align: left; font-size: 11px; }
  tbody tr:nth-child(even) { background: #F8FAFC; }
  tbody td { padding: 6px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
  .badge-verde { background: #D1FAE5; color: #065F46; }
  .badge-rojo { background: #FEE2E2; color: #991B1B; }
  .badge-naranja { background: #FEF3C7; color: #92400E; }
  .badge-azul { background: #DBEAFE; color: #1E40AF; }
  .badge-gris { background: #F1F5F9; color: #475569; }
  .barra-wrap { background: #E2E8F0; border-radius: 999px; height: 8px; width: 100%; max-width: 120px; }
  .barra { background: #1E3A5F; border-radius: 999px; height: 8px; }
  .barra-verde { background: #15A35A; }
  .aviso-vacio { color: #64748B; font-style: italic; padding: 8px 0; }
  .footer { text-align: center; font-size: 10px; color: #94A3B8; padding: 14px; border-top: 1px solid #E2E8F0; margin-top: 8px; }
  .page-break { page-break-before: always; }
`

const BADGE_ESTADO = { Entregado: 'verde', Cancelado: 'rojo', Pendiente: 'naranja', Confirmado: 'azul' }
const BADGE_RESULTADO = { Entregado: 'verde', Fallido: 'rojo', Parcial: 'naranja' }

function formatearFecha(fecha) {
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0
}

function kpi(valor, etiqueta, sub = '', color = '') {
  return `
    <div class="kpi">
      <div class="valor"${color ? ` style="color:${color}"` : ''}>${valor}</div>
      <div class="label">${etiqueta}</div>
      ${sub ? `<div class="sub">${sub}</div>` : ''}
    </div>`
}

function tablaConProporcion(filas, { titulo, total, badges, badgePorDefecto, claseBarra, vacio }) {
  if (filas.length === 0) return `<p class="aviso-vacio">${vacio}</p>`
  return `
    <table>
      <thead><tr><th>${titulo}</th><th>Cantidad</th><th>Proporción</th></tr></thead>
      <tbody>
        ${filas.map(({ nombre, cantidad }) => {
          const pct = porcentaje(cantidad, total)
          return `<tr>
            <td><span class="badge badge-${badges[nombre] || badgePorDefecto}">${nombre}</span></td>
            <td><strong>${cantidad}</strong></td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="barra-wrap"><div class="barra ${claseBarra}" style="width:${pct}%"></div></div>
                <span>${pct}%</span>
              </div>
            </td>
          </tr>`
        }).join('')}
      </tbody>
    </table>`
}

function badgeSiHay(cantidad, color) {
  return cantidad > 0 ? `<span class="badge badge-${color}">${cantidad}</span>` : '—'
}

function armarHtmlReporte({ desde, hasta, pedidos, envios, lotes, stockCritico }) {
  const generado = formatearFecha(new Date())
  const periodo = `${formatearFecha(new Date(desde + 'T00:00:00'))} — ${formatearFecha(new Date(hasta + 'T00:00:00'))}`

  const tablaLotes = lotes.porProducto.length === 0
    ? '<p class="aviso-vacio">No se elaboraron lotes en este período.</p>'
    : `<table>
        <thead><tr><th>Producto</th><th>Lotes</th><th>Unidades</th><th>En proceso</th><th>Finalizados</th><th>Controlados</th></tr></thead>
        <tbody>
          ${lotes.porProducto.map((l) => `<tr>
            <td><strong>${l.producto}</strong></td>
            <td>${l.cantidad_lotes}</td>
            <td><strong>${l.unidades_totales}</strong></td>
            <td>${badgeSiHay(l.en_proceso, 'azul')}</td>
            <td>${badgeSiHay(l.finalizados, 'naranja')}</td>
            <td>${badgeSiHay(l.controlados, 'verde')}</td>
          </tr>`).join('')}
        </tbody>
      </table>`

  const tablaStock = stockCritico.length === 0
    ? '<p style="color:#15803D;font-weight:600;padding:8px 0">✓ Todos los productos tienen stock suficiente.</p>'
    : `<table>
        <thead><tr><th>Producto</th><th>Código</th><th>Stock actual</th><th>Mínimo</th><th>Crítico</th></tr></thead>
        <tbody>
          ${stockCritico.map((p) => `<tr>
            <td><strong>${p.nombre}</strong></td>
            <td style="font-family:monospace">${p.codigo}</td>
            <td style="color:#DC2626;font-weight:700">${p.stock_actual}</td>
            <td>${p.stock_minimo}</td>
            <td>${p.stock_critico}</td>
          </tr>`).join('')}
        </tbody>
      </table>`

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>${ESTILOS}</style></head>
<body>
  <div class="caratula">
    <h1>Salus Aequitas S.R.L.</h1>
    <h2>Sistema BI-GEO — Reporte de Período</h2>
    <div class="periodo-label">Período analizado</div>
    <div class="periodo-value">${periodo}</div>
    <div class="fecha-gen">Generado el ${generado}</div>
  </div>

  <div class="kpi-row">
    ${kpi(pedidos.total, 'Pedidos<br>creados', `${porcentaje(pedidos.entregados, pedidos.total)}% entregados`)}
    ${kpi(pedidos.entregados, 'Pedidos<br>entregados')}
    ${kpi(pedidos.cancelados, 'Pedidos<br>cancelados')}
    ${kpi(envios.total, 'Envíos<br>realizados', `${porcentaje(envios.exitosos, envios.total)}% exitosos`)}
    ${kpi(lotes.total, 'Lotes<br>producidos')}
    ${kpi(lotes.unidades, 'Unidades<br>producidas')}
    ${kpi(stockCritico.length, 'Productos<br>stock crítico', '', stockCritico.length > 0 ? '#DC2626' : '#15803D')}
  </div>

  <div class="seccion">
    <div class="seccion-titulo">Pedidos del Período</div>
    <div class="seccion-sub">
      Total: <strong>${pedidos.total}</strong> pedidos &mdash;
      Entregados: <strong>${pedidos.entregados}</strong> &mdash;
      En proceso: <strong>${pedidos.enProceso}</strong> &mdash;
      Cancelados: <strong>${pedidos.cancelados}</strong>
    </div>
    ${tablaConProporcion(pedidos.porEstado, {
      titulo: 'Estado', total: pedidos.total, badges: BADGE_ESTADO, badgePorDefecto: 'gris', claseBarra: '',
      vacio: 'No se registraron pedidos en este período.',
    })}
  </div>

  <div class="seccion page-break">
    <div class="seccion-titulo">Envíos del Período</div>
    <div class="seccion-sub">
      Total: <strong>${envios.total}</strong> envíos &mdash;
      Exitosos: <strong>${envios.exitosos}</strong> &mdash;
      En curso: <strong>${envios.enCurso}</strong> &mdash;
      Fallidos: <strong>${envios.fallidos}</strong>
    </div>
    ${tablaConProporcion(envios.porResultado, {
      titulo: 'Resultado', total: envios.total, badges: BADGE_RESULTADO, badgePorDefecto: 'azul', claseBarra: 'barra-verde',
      vacio: 'No se registraron envíos despachados en este período.',
    })}
  </div>

  <div class="seccion page-break">
    <div class="seccion-titulo">Producción del Período</div>
    <div class="seccion-sub">
      Total: <strong>${lotes.total}</strong> lotes &mdash;
      <strong>${lotes.unidades}</strong> unidades producidas &mdash;
      Controlados: <strong>${lotes.controlados}</strong>
    </div>
    ${tablaLotes}
  </div>

  <div class="seccion page-break">
    <div class="seccion-titulo">Stock Crítico Actual</div>
    <div class="seccion-sub">Snapshot al momento de generar el reporte — independiente del período.</div>
    ${tablaStock}
  </div>

  <div class="footer">
    BI-GEO — Salus Aequitas S.R.L. · Período: ${desde} al ${hasta} · Generado el ${generado}
  </div>
</body>
</html>`
}

module.exports = { armarHtmlReporte }
