import { useState, useMemo } from "react"
import { API_URL } from "../../services/fetchAuth"
import { useCargarDatos } from "../../hooks/useCargarDatos"
import { estilos } from "./reportes/estilos"
import PestanaLogistica from "./reportes/PestanaLogistica"
import PestanaStock from "./reportes/PestanaStock"
import PestanaProduccion from "./reportes/PestanaProduccion"
import PestanaEntregas from "./reportes/PestanaEntregas"
import ModalPdf from "./reportes/ModalPdf"

const RUTAS = [
  "/pedidos", "/envios", "/transportistas", "/zonas", "/reportes/ventas-producto",
  "/reportes/stock-critico", "/reportes/lotes-por-vencer", "/reportes/entregas-fallidas",
  "/reportes/pedidos-cancelados", "/reportes/movimientos-stock", "/reportes/stock-actual",
  "/reportes/entregas", "/produccion",
].map((ruta) => API_URL + ruta)

const DIAS_POR_PERIODO = { semana: 7, mes: 30, trimestre: 90 }

function conCantidad(texto, cantidad) {
  return cantidad > 0 ? `${texto} (${cantidad})` : texto
}

export default function Reportes() {
  const { datos, cargando } = useCargarDatos(RUTAS)
  const [
    pedidos, envios, transportistas, zonas, ventasProducto, stockCritico, lotesPorVencer,
    entregasFallidas, pedidosCancelados, movimientos, stockActual, entregas, lotes,
  ] = datos

  const [pestana, setPestana] = useState("logistica")
  const [modalPdf, setModalPdf] = useState(false)
  const [filtros, setFiltros] = useState({ periodo: "todo", zona: "todas", transportista: "todos" })

  const pedidosFiltrados = useMemo(() => {
    const limite = new Date()
    limite.setDate(limite.getDate() - (DIAS_POR_PERIODO[filtros.periodo] ?? 0))
    return pedidos.filter((p) => {
      if (filtros.zona !== "todas" && p.id_zona !== Number(filtros.zona)) return false
      if (filtros.transportista !== "todos" && p.id_transportista !== Number(filtros.transportista)) return false
      if (filtros.periodo === "todo") return true
      const fecha = new Date(p.fecha_pedido.length === 10 ? p.fecha_pedido + "T00:00:00" : p.fecha_pedido)
      return fecha >= limite
    })
  }, [pedidos, filtros])

  if (cargando) return <p style={{ padding: "2rem", color: "var(--text-secondary)" }}>Cargando reportes...</p>

  const pestanas = [
    { clave: "logistica", texto: "Logística" },
    { clave: "stock", texto: conCantidad("Stock", stockCritico.length) },
    { clave: "produccion", texto: conCantidad("Producción", lotesPorVencer.length) },
    { clave: "entregas", texto: conCantidad("Entregas", entregasFallidas.length) },
  ]
  const total = pedidosFiltrados.length

  return (
    <div>
      <div style={estilos.encabezado}>
        <div>
          <h1 style={estilos.titulo}>Reportes y KPIs</h1>
          <p style={estilos.subtitulo}>Análisis de operaciones logísticas</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button style={estilos.botonPdf} onClick={() => setModalPdf(true)}>Descargar PDF</button>
          <span style={estilos.resultadosBadge}>
            {total} pedido{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div style={estilos.tabs}>
        {pestanas.map((p) => (
          <button
            key={p.clave}
            style={pestana === p.clave ? { ...estilos.tab, ...estilos.tabActivo } : estilos.tab}
            onClick={() => setPestana(p.clave)}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {pestana === "logistica" && (
        <PestanaLogistica
          pedidos={pedidosFiltrados}
          envios={envios}
          transportistas={transportistas}
          zonas={zonas}
          ventasProducto={ventasProducto}
          filtros={filtros}
          setFiltros={setFiltros}
        />
      )}
      {pestana === "stock" && (
        <PestanaStock stockActual={stockActual} stockCritico={stockCritico} movimientos={movimientos} />
      )}
      {pestana === "produccion" && <PestanaProduccion lotes={lotes} lotesPorVencer={lotesPorVencer} />}
      {pestana === "entregas" && (
        <PestanaEntregas entregas={entregas} entregasFallidas={entregasFallidas} pedidosCancelados={pedidosCancelados} />
      )}

      {modalPdf && <ModalPdf onCerrar={() => setModalPdf(false)} />}
    </div>
  )
}
