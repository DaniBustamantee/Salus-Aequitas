const express = require('express')
const puppeteer = require('puppeteer')
const { conectar } = require('../db')
const verificarToken = require('../middleware/auth')
const { ROLES, permitirRoles } = require('../middleware/roles')
const { conMensajeDeError } = require('../middleware/errores')
const { armarHtmlReporte } = require('../utils/plantillaReportePdf')

const router = express.Router()
router.use(verificarToken)
router.use(permitirRoles(ROLES.ADMIN))

function fechaISO(fecha) {
  return fecha.toISOString().slice(0, 10)
}

function sumar(filas, campo) {
  return filas.reduce((total, fila) => total + (Number(fila[campo]) || 0), 0)
}

function cantidadDe(filas, nombre) {
  return sumar(filas.filter((f) => f.nombre?.toLowerCase() === nombre.toLowerCase()), 'cantidad')
}

async function generarPdf(html) {
  const navegador = await puppeteer.launch({ headless: 'new' })
  try {
    const pagina = await navegador.newPage()
    await pagina.setContent(html, { waitUntil: 'domcontentloaded' })
    return await pagina.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '10mm', left: '0', right: '0' },
    })
  } finally {
    await navegador.close()
  }
}

router.get('/completo', conMensajeDeError('Error interno del servidor', async (req, res) => {
  const haceUnMes = new Date()
  haceUnMes.setDate(haceUnMes.getDate() - 30)
  const desde = req.query.desde || fechaISO(haceUnMes)
  const hasta = req.query.hasta || fechaISO(new Date())

  const pool = await conectar()
  const consultar = (sql) => pool.request()
    .input('desde', desde)
    .input('hasta', hasta)
    .query(sql)
    .then((resultado) => resultado.recordset)
  const enPeriodo = (columna) => `CONVERT(DATE, ${columna}) BETWEEN @desde AND @hasta`

  const [pedidosPorEstado, enviosPorResultado, lotesPorProducto, stockCritico] = await Promise.all([
    consultar(`
      SELECT ep.nombre, COUNT(*) AS cantidad
      FROM Pedidos p
      JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
      WHERE ${enPeriodo('p.fecha_pedido')}
      GROUP BY ep.nombre
      ORDER BY COUNT(*) DESC
    `),
    consultar(`
      SELECT ISNULL(resultado_entrega, 'En curso') AS nombre, COUNT(*) AS cantidad
      FROM Envios
      WHERE ${enPeriodo('fecha_despacho')}
      GROUP BY resultado_entrega
      ORDER BY COUNT(*) DESC
    `),
    consultar(`
      SELECT pr.nombre AS producto,
             COUNT(*) AS cantidad_lotes,
             SUM(l.cantidad_producida) AS unidades_totales,
             SUM(CASE WHEN l.estado = 'En proceso' THEN 1 ELSE 0 END) AS en_proceso,
             SUM(CASE WHEN l.estado = 'Finalizado' THEN 1 ELSE 0 END) AS finalizados,
             SUM(CASE WHEN l.estado = 'Controlado' THEN 1 ELSE 0 END) AS controlados
      FROM Lotes_Produccion l
      JOIN Productos pr ON l.id_producto = pr.id_producto
      WHERE ${enPeriodo('l.fecha_elaboracion')}
      GROUP BY pr.id_producto, pr.nombre
      ORDER BY unidades_totales DESC
    `),
    consultar(`
      SELECT nombre, codigo, stock_actual, stock_minimo, stock_critico
      FROM Productos
      WHERE activo = 1 AND stock_actual <= stock_minimo
      ORDER BY stock_actual ASC
    `),
  ])

  const totalPedidos = sumar(pedidosPorEstado, 'cantidad')
  const entregados = cantidadDe(pedidosPorEstado, 'Entregado')
  const cancelados = cantidadDe(pedidosPorEstado, 'Cancelado')

  const html = armarHtmlReporte({
    desde,
    hasta,
    stockCritico,
    pedidos: {
      porEstado: pedidosPorEstado,
      total: totalPedidos,
      entregados,
      cancelados,
      enProceso: totalPedidos - entregados - cancelados,
    },
    envios: {
      porResultado: enviosPorResultado,
      total: sumar(enviosPorResultado, 'cantidad'),
      exitosos: cantidadDe(enviosPorResultado, 'Entregado'),
      fallidos: cantidadDe(enviosPorResultado, 'Fallido'),
      enCurso: cantidadDe(enviosPorResultado, 'En curso'),
    },
    lotes: {
      porProducto: lotesPorProducto,
      total: sumar(lotesPorProducto, 'cantidad_lotes'),
      unidades: sumar(lotesPorProducto, 'unidades_totales'),
      controlados: sumar(lotesPorProducto, 'controlados'),
    },
  })

  const pdf = await generarPdf(html)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=reporte-${desde}-${hasta}.pdf`)
  res.send(pdf)
}))

module.exports = router
