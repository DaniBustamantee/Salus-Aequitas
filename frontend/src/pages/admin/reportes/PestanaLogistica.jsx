import { useMemo } from "react"
import { Chart } from "@tanstack/charts/react"
import { stack } from "@tanstack/charts"
import { estilos } from "./estilos"
import { Tarjeta, SinDatos, Pildora, Leyenda, FilaPorcentaje } from "./Componentes"
import {
  graficoBarras, graficoTorta, tonosDe, COLORES, ESTADOS_PEDIDO, COLOR_ESTADO,
  TIPOS_ENVIO, COLORES_TIPOS_ENVIO, COLOR_PROVINCIA,
} from "./graficos"
import { formatPrecio, plural } from "../../../utils/formato"

const PERIODOS = [
  { valor: "todo", texto: "Todo" },
  { valor: "semana", texto: "7 días" },
  { valor: "mes", texto: "30 días" },
  { valor: "trimestre", texto: "90 días" },
]

export default function PestanaLogistica({ pedidos, envios, transportistas, zonas, ventasProducto, filtros, setFiltros }) {
  const total = pedidos.length
  const entregados = pedidos.filter((p) => p.estado === "Entregado").length
  const cancelados = pedidos.filter((p) => p.estado === "Cancelado").length
  const porcentaje = (n) => (total > 0 ? Math.round((n / total) * 100) : 0)
  const facturado = pedidos
    .filter((p) => p.estado !== "Cancelado")
    .reduce((suma, p) => suma + Number(p.total), 0)

  const porEstado = useMemo(() => ESTADOS_PEDIDO
    .map((estado) => ({ label: estado, valor: pedidos.filter((p) => p.estado === estado).length }))
    .filter((e) => e.valor > 0), [pedidos])

  const rendimiento = useMemo(() => {
    const idsPedidos = new Set(pedidos.map((p) => p.id_pedido))
    const enviosDelPeriodo = envios.filter((e) => idsPedidos.has(e.id_pedido))
    return transportistas
      .filter((t) => filtros.transportista === "todos" || t.id_transportista === Number(filtros.transportista))
      .map((t) => {
        const propios = enviosDelPeriodo.filter((e) => e.id_transportista === t.id_transportista)
        const contar = (resultado) => propios.filter((e) => e.resultado_entrega === resultado).length
        const completos = contar("Entregado")
        const parciales = contar("Parcial")
        const fallidos = contar("Fallido")
        const enCurso = propios.filter((e) => !e.resultado_entrega).length
        const cantidad = completos + parciales + fallidos + enCurso
        return {
          nombre: `${t.nombre} ${t.apellido}`,
          completos, parciales, fallidos, enCurso, cantidad,
          tasa: cantidad > 0 ? Math.round((completos / cantidad) * 100) : 0,
        }
      })
      .filter((t) => t.cantidad > 0)
  }, [pedidos, envios, transportistas, filtros.transportista])

  const zonasConColor = useMemo(() => {
    const activas = zonas
      .map((z) => ({ ...z, provincia: z.provincia || "Córdoba", valor: pedidos.filter((p) => p.id_zona === z.id_zona).length }))
      .filter((z) => z.valor > 0)
    const colorDeZona = {}
    for (const provincia of new Set(activas.map((z) => z.provincia))) {
      const propias = activas.filter((z) => z.provincia === provincia)
      const tonos = tonosDe(COLOR_PROVINCIA[provincia] || "#888888", propias.length)
      propias.forEach((z, i) => { colorDeZona[z.id_zona] = tonos[i] })
    }
    return activas.map((z) => ({ ...z, color: colorDeZona[z.id_zona] }))
  }, [zonas, pedidos])

  const graficos = useMemo(() => {
    const porTipo = rendimiento.flatMap((t) => [
      { nombre: t.nombre, tipo: "Completo", valor: t.completos },
      { nombre: t.nombre, tipo: "Parcial", valor: t.parciales },
      { nombre: t.nombre, tipo: "En curso", valor: t.enCurso },
      { nombre: t.nombre, tipo: "Fallido", valor: t.fallidos },
    ]).filter((d) => d.valor > 0)
    const productos = ventasProducto.map((p) => p.nombre)

    return {
      estado: porEstado.length > 0 && graficoBarras(porEstado, {
        categoria: "label", valor: "valor", color: "label",
        dominio: porEstado.map((e) => e.label),
        colores: porEstado.map((e) => COLOR_ESTADO[e.label] || "#888"),
      }),
      producto: productos.length > 0 && graficoBarras(ventasProducto, {
        categoria: "nombre", valor: "total_unidades", color: "nombre", horizontal: true,
        dominio: productos,
        colores: productos.map((_, i) => COLORES[i % COLORES.length]),
      }),
      transportistas: porTipo.length > 0 && graficoBarras(porTipo, {
        categoria: "nombre", valor: "valor", color: "tipo",
        dominio: TIPOS_ENVIO, colores: COLORES_TIPOS_ENVIO,
        extra: { layout: stack({ order: TIPOS_ENVIO }) },
      }),
      zona: zonasConColor.length > 0 && graficoTorta(zonasConColor, "nombre"),
    }
  }, [porEstado, ventasProducto, rendimiento, zonasConColor])

  const totalZonas = zonasConColor.reduce((suma, z) => suma + z.valor, 0)
  const provincias = [...new Set(zonasConColor.map((z) => z.provincia))]
  const hayFiltros = filtros.zona !== "todas" || filtros.transportista !== "todos" || filtros.periodo !== "todo"
  const cambiarFiltro = (campo, valor) => setFiltros((anteriores) => ({ ...anteriores, [campo]: valor }))

  return (
    <>
      <div style={estilos.filtrosBar}>
        <div style={estilos.filtroGrupo}>
          <span style={estilos.filtroLabel}>Período</span>
          <div style={estilos.filtroOpciones}>
            {PERIODOS.map(({ valor, texto }) => (
              <button
                key={valor}
                style={filtros.periodo === valor ? { ...estilos.filtroBtn, ...estilos.filtroBtnActivo } : estilos.filtroBtn}
                onClick={() => cambiarFiltro("periodo", valor)}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
        <div style={estilos.filtroGrupo}>
          <span style={estilos.filtroLabel}>Zona</span>
          <select style={estilos.filtroSelect} value={filtros.zona} onChange={(e) => cambiarFiltro("zona", e.target.value)}>
            <option value="todas">Todas las zonas</option>
            {zonas.map((z) => <option key={z.id_zona} value={z.id_zona}>{z.nombre}</option>)}
          </select>
        </div>
        <div style={estilos.filtroGrupo}>
          <span style={estilos.filtroLabel}>Transportista</span>
          <select style={estilos.filtroSelect} value={filtros.transportista} onChange={(e) => cambiarFiltro("transportista", e.target.value)}>
            <option value="todos">Todos</option>
            {transportistas.filter((t) => t.activo).map((t) => (
              <option key={t.id_transportista} value={t.id_transportista}>{t.nombre} {t.apellido}</option>
            ))}
          </select>
        </div>
        {hayFiltros && (
          <button style={estilos.btnLimpiar} onClick={() => setFiltros({ periodo: "todo", zona: "todas", transportista: "todos" })}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      <div style={estilos.grillaTarjetas}>
        <Tarjeta titulo="Total pedidos" valor={total} sub="En el período seleccionado" color="var(--azul)" />
        <Tarjeta titulo="Entregados" valor={entregados} sub={`${porcentaje(entregados)}% de cumplimiento`} color="var(--verde)" />
        <Tarjeta titulo="Cancelados" valor={cancelados} sub={`${porcentaje(cancelados)}% del total`} color="var(--rojo)" />
        <Tarjeta titulo="Facturado" valor={formatPrecio(facturado)} sub="Pedidos no cancelados" color="var(--verde-oscuro)" />
      </div>

      <div style={estilos.grillaGraficos}>
        <TarjetaGrafico titulo="Pedidos por estado" sub={`${total} total`}>
          {graficos.estado ? (
            <>
              <Chart definition={graficos.estado} height={220} ariaLabel="Pedidos por estado" />
              <div style={estilos.valoresPills}>
                {porEstado.map((e) => (
                  <Pildora key={e.label} color={COLOR_ESTADO[e.label] || "#888"}>{e.label}: <strong>{e.valor}</strong></Pildora>
                ))}
              </div>
            </>
          ) : <SinDatos />}
        </TarjetaGrafico>

        <TarjetaGrafico titulo="Unidades vendidas por producto" sub="pedidos no cancelados">
          {graficos.producto ? (
            <>
              <Chart definition={graficos.producto} height={220} ariaLabel="Unidades vendidas por producto" />
              <div style={estilos.valoresPills}>
                {ventasProducto.map((p, i) => (
                  <Pildora key={p.nombre} color={COLORES[i % COLORES.length]}>{p.nombre}: <strong>{p.total_unidades} u.</strong></Pildora>
                ))}
              </div>
            </>
          ) : <SinDatos />}
        </TarjetaGrafico>

        <TarjetaGrafico titulo="Performance de transportistas" sub="por resultado de envío">
          <Leyenda items={TIPOS_ENVIO.map((tipo, i) => [COLORES_TIPOS_ENVIO[i], tipo])} />
          {graficos.transportistas ? (
            <>
              <Chart definition={graficos.transportistas} height={220} ariaLabel="Performance de transportistas" />
              <div style={estilos.valoresPills}>
                {rendimiento.map((t) => (
                  <Pildora key={t.nombre}>
                    {t.nombre}: <strong>{t.cantidad}</strong> env.
                    {t.tasa > 0 && <span style={{ color: "var(--verde)", marginLeft: 2 }}>({t.tasa}% ok)</span>}
                  </Pildora>
                ))}
              </div>
            </>
          ) : <SinDatos />}
        </TarjetaGrafico>

        <TarjetaGrafico
          titulo="Pedidos por zona geográfica"
          sub={`${plural(zonasConColor.length, "zona")} activa${zonasConColor.length !== 1 ? "s" : ""}`}
        >
          {graficos.zona ? (
            <>
              <Chart definition={graficos.zona} height={260} ariaLabel="Pedidos por zona geográfica" />
              <div style={estilos.leyendaDonut}>
                {provincias.map((provincia) => (
                  <div key={provincia}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: COLOR_PROVINCIA[provincia] || "#888", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.4rem 0 0.3rem" }}>
                      {provincia}
                    </div>
                    {zonasConColor.filter((z) => z.provincia === provincia).map((z) => (
                      <FilaPorcentaje key={z.id_zona} color={z.color} texto={z.nombre} valor={z.valor} total={totalZonas} sangria />
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : <SinDatos />}
        </TarjetaGrafico>
      </div>
    </>
  )
}

function TarjetaGrafico({ titulo, sub, children }) {
  return (
    <div style={estilos.card}>
      <div style={estilos.cardEncabezado}>
        <h2 style={estilos.cardTitulo}>{titulo}</h2>
        <span style={estilos.cardSub}>{sub}</span>
      </div>
      {children}
    </div>
  )
}
