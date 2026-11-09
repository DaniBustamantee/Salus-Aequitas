const { ROLES, esRol } = require('../middleware/roles')
const { generarNumero, buscarIdCliente } = require('../utils/funciones')

const ESTADO_PENDIENTE = 1
const PRIMER_ESTADO_NO_CANCELABLE = 4
const ESTADO_CANCELADO = 8
const DIAS_ENTREGA_ESTIMADA = 3

async function puedeVerPedido(pool, req, idClienteDelPedido) {
  if (!esRol(req, ROLES.CLIENTE)) return true
  const idCliente = await buscarIdCliente(pool, req.usuario.id)
  return idCliente !== null && idCliente === idClienteDelPedido
}

async function obtenerTotalesPorPedido(pool, idsPedidos = null) {
  const filtro = idsPedidos ? `WHERE id_pedido IN (${idsPedidos})` : ''
  const resultado = await pool.request().query(`
    SELECT id_pedido, ISNULL(SUM(subtotal), 0) AS total
    FROM Items_Pedido
    ${filtro}
    GROUP BY id_pedido
  `)

  const totales = {}
  resultado.recordset.forEach((fila) => { totales[fila.id_pedido] = Number(fila.total) })
  return totales
}

function sumarUnidades(items) {
  return items.reduce((total, item) => total + Number(item.cantidad), 0)
}

async function insertarItem(pool, idPedido, idProducto, cantidad, precioUnitario) {
  await pool.request()
    .input('id_pedido', idPedido)
    .input('id_producto', idProducto)
    .input('cantidad', cantidad)
    .input('precio_unitario', precioUnitario)
    .query(`
      INSERT INTO Items_Pedido (id_pedido, id_producto, cantidad, precio_unitario)
      VALUES (@id_pedido, @id_producto, @cantidad, @precio_unitario)
    `)
}

async function moverStockDelPedido(pool, idPedido, signo) {
  const operador = signo > 0 ? '+' : '-'
  const resItems = await pool.request()
    .input('id', idPedido)
    .query('SELECT id_producto, cantidad FROM Items_Pedido WHERE id_pedido = @id')

  for (const item of resItems.recordset) {
    await pool.request()
      .input('id_producto', item.id_producto)
      .input('cantidad', item.cantidad)
      .query(`
        UPDATE Productos
        SET stock_actual = stock_actual ${operador} @cantidad
        WHERE id_producto = @id_producto
      `)
  }
}

async function elegirTransportista(pool, idPedido) {
  const resultado = await pool.request()
    .input('id_pedido', idPedido)
    .query(`
      SELECT TOP 1 t.id_transportista
      FROM Transportistas t
      LEFT JOIN Envios e ON t.id_transportista = e.id_transportista
                         AND e.resultado_entrega IS NULL
      WHERE t.activo = 1
      GROUP BY t.id_transportista
      ORDER BY
        CASE WHEN EXISTS (
          SELECT 1
          FROM Transportistas_Zonas tz
          JOIN Clientes c ON c.id_zona = tz.id_zona
          JOIN Pedidos p ON p.id_cliente = c.id_cliente
          WHERE tz.id_transportista = t.id_transportista AND p.id_pedido = @id_pedido
        ) THEN 0 ELSE 1 END,
        COUNT(e.id_envio),
        t.id_transportista
    `)
  return resultado.recordset[0]?.id_transportista ?? null
}

async function crearEnvio(pool, idPedido, idTransportista) {
  await pool.request()
    .input('id', idPedido)
    .input('id_transportista', idTransportista)
    .query('UPDATE Pedidos SET id_transportista = @id_transportista WHERE id_pedido = @id')

  const resEnvio = await pool.request()
    .input('id_pedido', idPedido)
    .input('id_transportista', idTransportista)
    .query(`
      INSERT INTO Envios
        (id_pedido, id_transportista, nro_envio, fecha_despacho, fecha_entrega_est)
      OUTPUT INSERTED.id_envio
      VALUES
        (@id_pedido, @id_transportista, 'TEMP', GETDATE(), DATEADD(DAY, ${DIAS_ENTREGA_ESTIMADA}, GETDATE()))
    `)

  const idEnvio = resEnvio.recordset[0].id_envio
  const nroEnvio = generarNumero('ENV', idEnvio)

  await pool.request()
    .input('id', idEnvio)
    .input('nro', nroEnvio)
    .query('UPDATE Envios SET nro_envio = @nro WHERE id_envio = @id')

  const resNombre = await pool.request()
    .input('id_trans', idTransportista)
    .query(`
      SELECT u.nombre + ' ' + u.apellido AS nombre
      FROM Transportistas t
      JOIN Usuarios u ON t.id_usuario = u.id_usuario
      WHERE t.id_transportista = @id_trans
    `)

  return {
    transportista: resNombre.recordset[0]?.nombre || '—',
    nro_envio: nroEnvio,
  }
}

module.exports = {
  ESTADO_PENDIENTE,
  PRIMER_ESTADO_NO_CANCELABLE,
  ESTADO_CANCELADO,
  puedeVerPedido,
  obtenerTotalesPorPedido,
  sumarUnidades,
  insertarItem,
  moverStockDelPedido,
  elegirTransportista,
  crearEnvio,
}
