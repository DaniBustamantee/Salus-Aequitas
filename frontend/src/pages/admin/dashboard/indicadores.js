export const PERIODOS = [
  { valor: "hoy", texto: "Hoy" },
  { valor: "semana", texto: "Esta semana" },
  { valor: "mes", texto: "Este mes" },
  { valor: "trimestre", texto: "Trimestre" },
  { valor: "anio", texto: "Este año" },
  { valor: "todo", texto: "Todo" },
]

const UN_DIA = 1000 * 60 * 60 * 24

export function calcularRango(periodo, fechaDesde, fechaHasta) {
  if (fechaDesde || fechaHasta) {
    return {
      desde: fechaDesde ? new Date(fechaDesde) : null,
      hasta: fechaHasta ? new Date(fechaHasta + "T23:59:59") : null,
    }
  }
  const hoy = new Date()
  const desde = new Date(hoy)
  desde.setHours(0, 0, 0, 0)

  if (periodo === "hoy") return { desde, hasta: hoy }
  if (periodo === "semana") {
    const haceUnaSemana = new Date(hoy)
    haceUnaSemana.setDate(hoy.getDate() - 7)
    return { desde: haceUnaSemana, hasta: null }
  }
  if (periodo === "mes") desde.setDate(1)
  else if (periodo === "trimestre") desde.setMonth(Math.floor(hoy.getMonth() / 3) * 3, 1)
  else if (periodo === "anio") desde.setMonth(0, 1)
  else return { desde: null, hasta: null }
  return { desde, hasta: null }
}

export function estaEnRango(fecha, { desde, hasta }) {
  if (!fecha) return true
  const valor = new Date(fecha.length === 10 ? fecha + "T00:00:00" : fecha)
  return (!desde || valor >= desde) && (!hasta || valor <= hasta)
}

export function lotesPorVencer(lotes) {
  return lotes
    .filter((l) => l.fecha_vencimiento)
    .map((l) => ({ ...l, diasRestantes: Math.ceil((new Date(l.fecha_vencimiento) - new Date()) / UN_DIA) }))
    .filter((l) => l.diasRestantes >= 0 && l.diasRestantes <= 30)
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
}

export function calcularNodos({ pedidos, envios, lotes, clientes, proveedores, insumos, productos, hayZona }) {
  const proveedoresActivos = proveedores.filter((p) => p.activo).length
  const insumosBajoMinimo = insumos.filter((i) => i.stock_actual <= i.stock_minimo).length
  const lotesEnProceso = lotes.filter((l) => l.estado === "En proceso").length
  const stockTotal = productos.reduce((suma, p) => suma + p.stock_actual, 0)
  const stockCritico = productos.some((p) => p.stock_actual <= p.stock_critico)
  const stockBajo = productos.some((p) => p.stock_actual <= p.stock_minimo && p.stock_actual > p.stock_critico)
  const pedidosActivos = pedidos.filter((p) => !["Entregado", "Cancelado"].includes(p.estado)).length
  const proporcionCancelados = pedidos.length > 0 ? pedidos.filter((p) => p.estado === "Cancelado").length / pedidos.length : 0
  const enviosEnCurso = envios.filter((e) => !e.resultado_entrega).length
  const finalizados = envios.filter((e) => e.resultado_entrega)
  const exitosos = finalizados.filter((e) => e.resultado_entrega === "Entregado").length
  const tasaExito = finalizados.length > 0 ? Math.round((exitosos / finalizados.length) * 100) : null

  return {
    proveedores: {
      titulo: "Proveedores", valor: `${proveedoresActivos} activos`, sub: `de ${proveedores.length} registrados`,
      salud: proveedoresActivos >= 2 ? "verde" : proveedoresActivos === 1 ? "naranja" : "rojo",
    },
    insumos: {
      titulo: "Insumos", valor: `${insumos.length} ítems`, sub: `${insumosBajoMinimo} bajo mínimo`,
      salud: insumosBajoMinimo === 0 ? "verde" : insumosBajoMinimo === 1 ? "naranja" : "rojo",
    },
    produccion: {
      titulo: "Producción", valor: `${lotesEnProceso} en proceso`, sub: `${lotes.length} lotes en período`,
      salud: lotesEnProceso >= 1 ? "verde" : lotes.length > 0 ? "naranja" : "rojo",
    },
    stock: {
      titulo: "Stock", valor: `${stockTotal.toLocaleString()} u.`, sub: stockCritico ? "Nivel crítico" : "Niveles normales",
      salud: stockCritico ? "rojo" : stockBajo ? "naranja" : "verde",
    },
    clientes: {
      titulo: "Clientes", valor: `${clientes.length} activos`, sub: hayZona ? "en esta zona" : "en el sistema",
      salud: clientes.length >= 3 ? "verde" : clientes.length >= 1 ? "naranja" : "rojo",
    },
    pedidos: {
      titulo: "Pedidos", valor: `${pedidos.length} total`, sub: `${pedidosActivos} activos`,
      salud: proporcionCancelados > 0.3 ? "rojo" : proporcionCancelados > 0.1 ? "naranja" : "verde",
    },
    envios: {
      titulo: "Envíos", valor: `${enviosEnCurso} en curso`, sub: `${envios.length} en período`,
      salud: envios.length === 0 ? "naranja" : "verde",
    },
    entrega: {
      titulo: "Entrega", valor: tasaExito !== null ? `${tasaExito}%` : "—", sub: "tasa de éxito",
      salud: tasaExito === null ? "naranja" : tasaExito >= 75 ? "verde" : tasaExito >= 50 ? "naranja" : "rojo",
    },
  }
}
