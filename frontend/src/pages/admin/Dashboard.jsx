import { useState, useMemo } from "react"
import { API_URL } from "../../services/fetchAuth"
import { useTheme } from "../../context/ThemeContext"
import { useCargarDatos } from "../../hooks/useCargarDatos"
import { SkeletonCards } from "../../components/ui/Skeleton"
import DiagramaPERT from "./dashboard/DiagramaPERT"
import { PERIODOS, calcularRango, estaEnRango, lotesPorVencer, calcularNodos } from "./dashboard/indicadores"
import { estilos } from "./dashboard/estilos"

const RUTAS = ["/pedidos", "/envios", "/produccion", "/clientes", "/proveedores", "/insumos", "/productos", "/zonas"]
  .map((ruta) => API_URL + ruta)

const LEYENDA = [
  ["#16A34A", "Normal / Saludable"],
  ["#D97706", "Atención / Por debajo del mínimo"],
  ["#DC2626", "Crítico / Requiere acción inmediata"],
]

export default function Dashboard() {
  const { tema } = useTheme()
  const { datos, cargando, recargar } = useCargarDatos(RUTAS)
  const [pedidos, envios, lotes, clientes, proveedores, insumos, productos, zonas] = datos
  const [actualizando, setActualizando] = useState(false)
  const [periodo, setPeriodo] = useState("todo")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [zona, setZona] = useState("todas")
  const [vista, setVista] = useState("cantidad")

  const alertas = useMemo(() => lotesPorVencer(lotes), [lotes])

  const { nodos, totalPedidos } = useMemo(() => {
    const rango = calcularRango(periodo, fechaDesde, fechaHasta)
    const enZona = (idZona) => zona === "todas" || idZona === Number(zona)
    const pedidosFiltrados = pedidos.filter((p) => enZona(p.id_zona) && estaEnRango(p.fecha_pedido, rango))
    const idsPedidos = new Set(pedidosFiltrados.map((p) => p.id_pedido))
    const nodos = calcularNodos({
      pedidos: pedidosFiltrados,
      envios: envios.filter((e) => idsPedidos.has(e.id_pedido)),
      lotes: lotes.filter((l) => estaEnRango(l.fecha_elaboracion, rango)),
      clientes: clientes.filter((c) => c.activo && enZona(c.id_zona)),
      proveedores,
      insumos,
      productos,
      hayZona: zona !== "todas",
    })
    return { nodos, totalPedidos: pedidosFiltrados.length }
  }, [pedidos, envios, lotes, clientes, proveedores, insumos, productos, periodo, fechaDesde, fechaHasta, zona])

  async function actualizar() {
    setActualizando(true)
    await recargar()
    setActualizando(false)
  }

  function elegirPeriodo(valor) {
    setPeriodo(valor)
    setFechaDesde("")
    setFechaHasta("")
  }

  function limpiarFiltros() {
    elegirPeriodo("todo")
    setZona("todas")
  }

  if (cargando) return <SkeletonCards cantidad={6} />

  const hayFiltros = periodo !== "todo" || fechaDesde || fechaHasta || zona !== "todas"

  return (
    <div>
      <div style={estilos.encabezado}>
        <div>
          <h1 style={estilos.titulo}>Dashboard</h1>
          <p style={estilos.subtitulo}>Resumen general del sistema</p>
        </div>
        <button style={{ ...estilos.botonActualizar, opacity: actualizando ? 0.6 : 1 }} onClick={actualizar} disabled={actualizando}>
          {actualizando ? "Actualizando..." : "↻ Actualizar"}
        </button>
      </div>

      {alertas.length > 0 && (
        <div style={estilos.alertaBanner}>
          <div style={{ flex: 1 }}>
            <p style={estilos.alertaTitulo}>
              {alertas.length === 1 ? "1 lote próximo a vencer" : `${alertas.length} lotes próximos a vencer`}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
              {alertas.map((l) => {
                const color = l.diasRestantes <= 7 ? "rojo" : "naranja"
                return (
                  <span key={l.id_lote} style={{ ...estilos.chipLote, backgroundColor: `var(--${color}-claro)`, color: `var(--${color})`, border: `1px solid var(--${color})` }}>
                    {l.nro_lote} · {l.producto || "—"} · vence en {l.diasRestantes} día{l.diasRestantes !== 1 ? "s" : ""}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div style={estilos.cardPert}>
        <div style={estilos.pertHeader}>
          <div>
            <h2 style={estilos.pertTitulo}>Panel de control</h2>
            <p style={estilos.pertSubtitulo}>
              Flujo completo de la cadena de valor · {totalPedidos} pedido{totalPedidos !== 1 ? "s" : ""} en el período
            </p>
          </div>
          <div style={estilos.vistaToggle}>
            {[["cantidad", "Cantidad"], ["estado", "Estado"]].map(([clave, texto]) => (
              <button
                key={clave}
                style={vista === clave ? { ...estilos.vistaBtn, ...estilos.vistaBtnActivo } : estilos.vistaBtn}
                onClick={() => setVista(clave)}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>

        <div style={estilos.filtrosBar}>
          <div style={estilos.filtroGrupo}>
            <span style={estilos.filtroLabel}>Período rápido</span>
            <div style={estilos.filtroOpciones}>
              {PERIODOS.map(({ valor, texto }) => (
                <button
                  key={valor}
                  style={periodo === valor ? { ...estilos.filtroBtn, ...estilos.filtroBtnActivo } : estilos.filtroBtn}
                  onClick={() => elegirPeriodo(valor)}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

          <div style={estilos.filtroGrupo}>
            <span style={estilos.filtroLabel}>Rango personalizado</span>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input type="date" style={estilos.inputFecha} value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPeriodo("") }} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-hint)" }}>→</span>
              <input type="date" style={estilos.inputFecha} value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPeriodo("") }} />
            </div>
          </div>

          <div style={estilos.filtroGrupo}>
            <span style={estilos.filtroLabel}>Zona geográfica</span>
            <select style={estilos.filtroSelect} value={zona} onChange={(e) => setZona(e.target.value)}>
              <option value="todas">Todas las zonas</option>
              {zonas.map((z) => <option key={z.id_zona} value={z.id_zona}>{z.nombre}</option>)}
            </select>
          </div>

          {hayFiltros && <button style={estilos.btnLimpiar} onClick={limpiarFiltros}>✕ Limpiar filtros</button>}
        </div>

        <DiagramaPERT nodos={nodos} vista={vista} tema={tema} />

        <div style={estilos.pertLeyenda}>
          {LEYENDA.map(([color, texto]) => (
            <span key={texto} style={estilos.leyendaItem}>
              <span style={{ width: 8, height: 8, borderRadius: "2px", backgroundColor: color, flexShrink: 0 }} />
              {texto}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
