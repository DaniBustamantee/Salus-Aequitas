const express = require('express')
const { conectar } = require('../db')
const verificarToken = require('../middleware/auth')
const { ROLES, permitirRoles, esRol } = require('../middleware/roles')
const { conMensajeDeError } = require('../middleware/errores')
const { agruparPor, generarNumero, buscarIdCliente, registrarCambioEstado } = require('../utils/funciones')
const {
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
} = require('../servicios/pedidos')

const router = express.Router()
router.use(verificarToken)

router.get('/', permitirRoles(ROLES.ADMIN), conMensajeDeError('Error al obtener pedidos', async (req, res) => {
  const pool = await conectar()

  const resPedidos = await pool.request().query(`
    SELECT
      p.id_pedido, p.nro_pedido,
      CONVERT(VARCHAR(10), p.fecha_pedido, 23)      AS fecha_pedido,
      CONVERT(VARCHAR(10), p.fecha_entrega_est, 23) AS fecha_entrega_est,
      p.ciudad_entrega, p.direccion_entrega,
      p.total_unidades, p.notas,
      p.id_estado, ep.nombre AS estado,
      p.id_cliente, c.razon_social,
      c.id_zona,
      p.id_transportista
    FROM Pedidos p
    JOIN Estados_Pedido ep ON p.id_estado  = ep.id_estado
    JOIN Clientes       c  ON p.id_cliente = c.id_cliente
    ORDER BY p.fecha_pedido DESC
  `)

  const totales = await obtenerTotalesPorPedido(pool)

  res.json(resPedidos.recordset.map((pedido) => ({
    ...pedido,
    total: totales[pedido.id_pedido] || 0,
  })))
}))

router.get('/mis-pedidos', permitirRoles(ROLES.CLIENTE), conMensajeDeError('Error al obtener mis pedidos', async (req, res) => {
  const pool = await conectar()

  const idCliente = await buscarIdCliente(pool, req.usuario.id)
  if (idCliente === null) {
    return res.json([])
  }

  const resPedidos = await pool.request()
    .input('id_cliente', idCliente)
    .query(`
      SELECT
        p.id_pedido, p.nro_pedido,
        CONVERT(VARCHAR(10), p.fecha_pedido,      23) AS fecha_pedido,
        CONVERT(VARCHAR(10), p.fecha_entrega_est, 23) AS fecha_entrega_est,
        p.ciudad_entrega, p.direccion_entrega,
        p.contacto_receptor, p.telefono_receptor,
        p.total_unidades, p.notas,
        p.id_estado, ep.nombre AS estado
      FROM Pedidos p
      JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
      WHERE p.id_cliente = @id_cliente
      ORDER BY p.fecha_pedido DESC
    `)

  const pedidos = resPedidos.recordset
  if (pedidos.length === 0) {
    return res.json([])
  }

  const idsPedidos = pedidos.map((p) => p.id_pedido).join(',')
  const totales = await obtenerTotalesPorPedido(pool, idsPedidos)

  const resItems = await pool.request().query(`
    SELECT ip.id_pedido, ip.id_producto, pr.nombre AS producto,
           ip.cantidad, ip.precio_unitario, ip.subtotal,
           pr.imagen_url, pr.stock_actual
    FROM Items_Pedido ip
    JOIN Productos pr ON ip.id_producto = pr.id_producto
    WHERE ip.id_pedido IN (${idsPedidos})
  `)
  const itemsPorPedido = agruparPor(resItems.recordset, 'id_pedido')

  res.json(pedidos.map((pedido) => ({
    ...pedido,
    total: totales[pedido.id_pedido] || 0,
    items: itemsPorPedido[pedido.id_pedido] || [],
  })))
}))

router.post('/', permitirRoles(ROLES.CLIENTE), conMensajeDeError('Error al crear el pedido', async (req, res) => {
  const { direccion_entrega, ciudad_entrega, contacto_receptor, telefono_receptor, notas, items } = req.body

  if (!direccion_entrega || !ciudad_entrega || !contacto_receptor) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Agregá al menos un producto' })
  }

  const pool = await conectar()

  const idCliente = await buscarIdCliente(pool, req.usuario.id)
  if (idCliente === null) {
    return res.status(403).json({ error: 'No sos cliente registrado' })
  }

  const idsProductos = items.map((i) => Number(i.id_producto)).join(',')
  const resProductos = await pool.request().query(`
    SELECT id_producto, precio_unitario, stock_actual, nombre
    FROM Productos
    WHERE id_producto IN (${idsProductos}) AND activo = 1
  `)

  const productosPorId = {}
  resProductos.recordset.forEach((p) => { productosPorId[p.id_producto] = p })

  const faltantes = []
  for (const item of items) {
    const producto = productosPorId[Number(item.id_producto)]
    if (!producto) {
      return res.status(400).json({ error: 'Producto no encontrado' })
    }
    if (producto.stock_actual < Number(item.cantidad)) {
      faltantes.push({
        nombre: producto.nombre,
        solicitado: Number(item.cantidad),
        disponible: producto.stock_actual,
      })
    }
  }
  if (faltantes.length > 0) {
    return res.status(400).json({ error: 'Stock insuficiente', detalle: faltantes })
  }

  const resPedido = await pool.request()
    .input('id_cliente', idCliente)
    .input('direccion', direccion_entrega)
    .input('ciudad', ciudad_entrega)
    .input('contacto', contacto_receptor)
    .input('telefono', telefono_receptor || null)
    .input('notas', notas || null)
    .input('total_unidades', sumarUnidades(items))
    .query(`
      INSERT INTO Pedidos
        (id_cliente, id_estado, nro_pedido, fecha_pedido,
         direccion_entrega, ciudad_entrega, contacto_receptor,
         telefono_receptor, total_unidades, notas)
      VALUES
        (@id_cliente, ${ESTADO_PENDIENTE}, 'TEMP', GETDATE(),
         @direccion, @ciudad, @contacto,
         @telefono, @total_unidades, @notas)
      SELECT SCOPE_IDENTITY() AS id_pedido
    `)

  const idPedido = resPedido.recordset[0].id_pedido
  const nroPedido = generarNumero('PED', idPedido)

  await pool.request()
    .input('id', idPedido)
    .input('nro', nroPedido)
    .query('UPDATE Pedidos SET nro_pedido = @nro WHERE id_pedido = @id')

  for (const item of items) {
    const idProducto = Number(item.id_producto)
    await insertarItem(pool, idPedido, idProducto, Number(item.cantidad), productosPorId[idProducto].precio_unitario)
  }

  await pool.request()
    .input('id_pedido', idPedido)
    .input('id_estado', ESTADO_PENDIENTE)
    .input('cambiado_por', req.usuario.id)
    .query(`
      INSERT INTO Historial_Estados_Pedido (id_pedido, id_estado, cambiado_por)
      VALUES (@id_pedido, @id_estado, @cambiado_por)
    `)

  res.status(201).json({ mensaje: 'Pedido creado', nro_pedido: nroPedido, id_pedido: idPedido })
}))

router.put('/:id', permitirRoles(ROLES.CLIENTE), conMensajeDeError('Error al modificar el pedido', async (req, res) => {
  const { direccion_entrega, ciudad_entrega, contacto_receptor, telefono_receptor, notas, items } = req.body

  const pool = await conectar()
  const idPedido = parseInt(req.params.id)

  const idCliente = await buscarIdCliente(pool, req.usuario.id)
  if (idCliente === null) {
    return res.status(403).json({ error: 'No sos cliente registrado' })
  }

  const resPedido = await pool.request()
    .input('id', idPedido)
    .input('id_cliente', idCliente)
    .query(`
      SELECT p.id_pedido, ep.nombre AS estado
      FROM Pedidos p
      JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
      WHERE p.id_pedido = @id AND p.id_cliente = @id_cliente
    `)

  const pedido = resPedido.recordset[0]
  if (!pedido) {
    return res.status(404).json({ error: 'Pedido no encontrado' })
  }
  if (pedido.estado !== 'Pendiente') {
    return res.status(400).json({ error: 'Solo se pueden modificar pedidos en estado Pendiente' })
  }

  await pool.request()
    .input('id', idPedido)
    .input('direccion', direccion_entrega)
    .input('ciudad', ciudad_entrega)
    .input('contacto', contacto_receptor)
    .input('telefono', telefono_receptor || null)
    .input('notas', notas || null)
    .query(`
      UPDATE Pedidos
      SET direccion_entrega  = @direccion,
          ciudad_entrega     = @ciudad,
          contacto_receptor  = @contacto,
          telefono_receptor  = @telefono,
          notas              = @notas,
          fecha_ultima_modif = GETDATE()
      WHERE id_pedido = @id
    `)

  if (Array.isArray(items) && items.length > 0) {
    const idsProductos = items.map((i) => Number(i.id_producto)).join(',')
    const resPrecios = await pool.request().query(`
      SELECT id_producto, precio_unitario FROM Productos
      WHERE id_producto IN (${idsProductos})
    `)
    const precioPorProducto = {}
    resPrecios.recordset.forEach((p) => { precioPorProducto[p.id_producto] = p.precio_unitario })

    await pool.request()
      .input('id', idPedido)
      .query('DELETE FROM Items_Pedido WHERE id_pedido = @id')

    for (const item of items) {
      const idProducto = Number(item.id_producto)
      await insertarItem(pool, idPedido, idProducto, Number(item.cantidad), precioPorProducto[idProducto] || 0)
    }

    await pool.request()
      .input('id', idPedido)
      .input('total', sumarUnidades(items))
      .query('UPDATE Pedidos SET total_unidades = @total WHERE id_pedido = @id')
  }

  res.json({ mensaje: 'Pedido modificado' })
}))

router.get('/:id', permitirRoles(ROLES.ADMIN, ROLES.CLIENTE), conMensajeDeError('Error al obtener el pedido', async (req, res) => {
  const pool = await conectar()
  const idPedido = parseInt(req.params.id)

  const resPedido = await pool.request()
    .input('id', idPedido)
    .query(`
      SELECT
        p.id_pedido, p.nro_pedido,
        CONVERT(VARCHAR(10), p.fecha_pedido, 23)      AS fecha_pedido,
        CONVERT(VARCHAR(10), p.fecha_entrega_est, 23) AS fecha_entrega_est,
        p.ciudad_entrega, p.direccion_entrega,
        p.contacto_receptor, p.telefono_receptor,
        p.total_unidades, p.notas,
        p.id_estado, ep.nombre AS estado, ep.es_final, ep.orden AS orden_estado,
        p.id_cliente, c.razon_social,
        p.id_transportista,
        ut.nombre + ' ' + ut.apellido AS transportista
      FROM Pedidos p
      JOIN Estados_Pedido      ep ON p.id_estado        = ep.id_estado
      JOIN Clientes            c  ON p.id_cliente       = c.id_cliente
      LEFT JOIN Transportistas tr ON p.id_transportista = tr.id_transportista
      LEFT JOIN Usuarios       ut ON tr.id_usuario      = ut.id_usuario
      WHERE p.id_pedido = @id
    `)

  const pedido = resPedido.recordset[0]
  if (!pedido || !(await puedeVerPedido(pool, req, pedido.id_cliente))) {
    return res.status(404).json({ error: 'Pedido no encontrado' })
  }

  const resItems = await pool.request()
    .input('id', idPedido)
    .query(`
      SELECT ip.id_item, ip.id_producto, pr.nombre AS producto,
             ip.cantidad, ip.precio_unitario, ip.subtotal
      FROM Items_Pedido ip
      JOIN Productos pr ON ip.id_producto = pr.id_producto
      WHERE ip.id_pedido = @id
    `)

  const resHistorial = await pool.request()
    .input('id', idPedido)
    .query(`
      SELECT h.id_historial, h.id_estado, ep.nombre AS estado,
             CONVERT(VARCHAR(16), h.fecha_cambio, 120) AS fecha,
             h.observacion
      FROM Historial_Estados_Pedido h
      JOIN Estados_Pedido ep ON h.id_estado = ep.id_estado
      WHERE h.id_pedido = @id
      ORDER BY h.fecha_cambio ASC
    `)

  res.json({
    ...pedido,
    items: resItems.recordset,
    historial: resHistorial.recordset,
  })
}))

router.patch('/:id/estado', permitirRoles(ROLES.ADMIN, ROLES.CLIENTE), conMensajeDeError('Error al cambiar estado', async (req, res) => {
  const { accion, observacion } = req.body

  if (!accion) {
    return res.status(400).json({ error: 'Falta el campo accion' })
  }

  const pool = await conectar()
  const idPedido = parseInt(req.params.id)

  const resPedido = await pool.request()
    .input('id', idPedido)
    .query(`
      SELECT p.id_estado, p.id_cliente, ep.orden, ep.es_final, ep.nombre AS estado_actual
      FROM Pedidos p
      JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
      WHERE p.id_pedido = @id
    `)

  const pedido = resPedido.recordset[0]
  if (!pedido || !(await puedeVerPedido(pool, req, pedido.id_cliente))) {
    return res.status(404).json({ error: 'Pedido no encontrado' })
  }
  if (esRol(req, ROLES.CLIENTE) && accion !== 'cancelar') {
    return res.status(403).json({ error: 'Solo podés cancelar tus pedidos' })
  }
  if (pedido.es_final) {
    return res.status(400).json({ error: 'El pedido ya está en estado final' })
  }
  if (accion === 'cancelar' && pedido.id_estado >= PRIMER_ESTADO_NO_CANCELABLE) {
    return res.status(400).json({
      error: `No se puede cancelar un pedido en estado "${pedido.estado_actual}". Solo se puede cancelar hasta "En preparación".`,
    })
  }

  let idNuevoEstado
  let nombreNuevoEstado

  if (accion === 'cancelar') {
    idNuevoEstado = ESTADO_CANCELADO
    nombreNuevoEstado = 'Cancelado'
  } else if (accion === 'avanzar') {
    const resSiguiente = await pool.request()
      .input('orden', pedido.orden + 1)
      .query('SELECT id_estado, nombre FROM Estados_Pedido WHERE orden = @orden AND activo = 1')

    const siguiente = resSiguiente.recordset[0]
    if (!siguiente) {
      return res.status(400).json({ error: 'No hay estado siguiente' })
    }
    idNuevoEstado = siguiente.id_estado
    nombreNuevoEstado = siguiente.nombre
  } else {
    return res.status(400).json({ error: 'Acción no válida. Usá "avanzar" o "cancelar"' })
  }

  const seConfirma = nombreNuevoEstado === 'Confirmado'

  if (seConfirma) {
    const resStock = await pool.request()
      .input('id', idPedido)
      .query(`
        SELECT ip.cantidad, pr.nombre, pr.stock_actual
        FROM Items_Pedido ip
        JOIN Productos pr ON ip.id_producto = pr.id_producto
        WHERE ip.id_pedido = @id
      `)

    const faltantes = resStock.recordset.filter((item) => item.stock_actual < item.cantidad)
    if (faltantes.length > 0) {
      return res.status(400).json({
        error: 'Stock insuficiente para confirmar el pedido',
        detalle: faltantes.map((i) => ({ nombre: i.nombre, solicitado: i.cantidad, disponible: i.stock_actual })),
      })
    }
  }

  await pool.request()
    .input('id', idPedido)
    .input('estado', idNuevoEstado)
    .query(`
      UPDATE Pedidos
      SET id_estado = @estado,
          fecha_ultima_modif = GETDATE(),
          fecha_cancelacion = CASE WHEN @estado = ${ESTADO_CANCELADO} THEN GETDATE() ELSE fecha_cancelacion END
      WHERE id_pedido = @id
    `)

  await registrarCambioEstado(pool, {
    idPedido,
    idEstado: idNuevoEstado,
    idUsuario: req.usuario.id,
    observacion: observacion || null,
  })

  if (accion === 'cancelar' && pedido.estado_actual !== 'Pendiente') {
    await moverStockDelPedido(pool, idPedido, +1)
  }

  let alertasStock = []
  if (seConfirma) {
    await moverStockDelPedido(pool, idPedido, -1)

    const resAlertas = await pool.request()
      .input('id', idPedido)
      .query(`
        SELECT pr.nombre, pr.stock_actual, pr.stock_minimo, pr.stock_critico
        FROM Items_Pedido ip
        JOIN Productos pr ON ip.id_producto = pr.id_producto
        WHERE ip.id_pedido = @id
          AND pr.stock_actual <= pr.stock_minimo
      `)
    alertasStock = resAlertas.recordset
  }

  let asignacion = null
  if (nombreNuevoEstado === 'Despachado') {
    const idTransportista = await elegirTransportista(pool, idPedido)
    if (idTransportista !== null) {
      asignacion = await crearEnvio(pool, idPedido, idTransportista)
    }
  }

  res.json({ mensaje: 'Estado actualizado', asignacion, alertas_stock: alertasStock })
}))

module.exports = router
