import { useState } from "react"
import { SkeletonTabla } from "../../components/ui/Skeleton"
import { API_URL } from "../../services/fetchAuth"
import { useToast } from "../../context/ToastContext"
import { useCargarDatos } from "../../hooks/useCargarDatos"
import { EstadoCliente } from "./clientes/Componentes"
import ModalNuevoCliente from "./clientes/ModalNuevoCliente"
import ModalDetalleCliente from "./clientes/ModalDetalleCliente"
import { estilos } from "./clientes/estilos"

function coincideEstado(cliente, filtro) {
  const aprobado = Boolean(cliente.fecha_aprobacion)
  if (filtro === "activo") return aprobado && cliente.activo
  if (filtro === "inactivo") return aprobado && !cliente.activo
  if (filtro === "pendiente") return !aprobado
  return true
}

export default function Clientes() {
  const { showToast } = useToast()
  const { datos: [clientes, zonas], cargando, recargar } = useCargarDatos(
    [`${API_URL}/clientes`, `${API_URL}/zonas`],
    () => showToast("No se pudo conectar con el servidor.", "error"),
  )
  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState("todos")
  const [creando, setCreando] = useState(false)
  const [clienteAbierto, setClienteAbierto] = useState(null)

  if (cargando) return <SkeletonTabla filas={5} columnas={6} />

  const pendientes = clientes.filter((c) => !c.fecha_aprobacion)
  const texto = busqueda.toLowerCase()
  const filtrados = clientes.filter((c) =>
    [c.razon_social, c.email, c.ciudad].some((valor) => valor.toLowerCase().includes(texto)) && coincideEstado(c, filtro)
  )
  const filtros = [
    ["todos", "Todos"],
    ["activo", "Activos"],
    ["inactivo", "Inactivos"],
    ["pendiente", pendientes.length > 0 ? `Pendientes (${pendientes.length})` : "Pendientes"],
  ]

  async function alCambiarCliente(cerrar) {
    await recargar()
    if (cerrar) setClienteAbierto(null)
  }

  return (
    <div>
      <div style={estilos.encabezado}>
        <div>
          <h1 style={estilos.titulo}>Clientes</h1>
          <p style={estilos.subtitulo}>Gestión de clientes registrados · Hacé clic en una fila para ver el detalle</p>
        </div>
        <button style={estilos.botonPrimario} onClick={() => setCreando(true)}>+ Nuevo cliente</button>
      </div>

      {pendientes.length > 0 && (
        <div style={estilos.alertaPendientes}>
          <p style={{ fontWeight: "700", fontSize: "0.875rem" }}>
            {pendientes.length} cliente{pendientes.length > 1 ? "s" : ""} pendiente{pendientes.length > 1 ? "s" : ""} de aprobación
          </p>
          <button
            style={{ marginLeft: "auto", fontSize: "0.8rem", fontWeight: "700", color: "var(--azul)", cursor: "pointer" }}
            onClick={() => setFiltro("pendiente")}
          >
            Ver pendientes →
          </button>
        </div>
      )}

      <div style={estilos.barra}>
        <input
          style={estilos.buscador}
          placeholder="Buscar por nombre, email o ciudad..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div style={estilos.filtros}>
          {filtros.map(([clave, etiqueta]) => (
            <button
              key={clave}
              style={filtro === clave ? { ...estilos.filtro, ...estilos.filtroActivo } : estilos.filtro}
              onClick={() => setFiltro(clave)}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div style={estilos.tabla}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={estilos.thead}>
              {["Razón social", "CUIL / CUIT", "Email", "Ciudad", "Zona", "Estado"].map((c) => <th key={c} style={estilos.th}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} style={estilos.vacio}>
                  {busqueda || filtro !== "todos" ? "Sin resultados para los filtros aplicados." : "No hay clientes registrados aún."}
                </td>
              </tr>
            )}
            {filtrados.map((c) => (
              <tr key={c.id_cliente} style={{ ...estilos.fila, cursor: "pointer" }} onClick={() => setClienteAbierto(c)}>
                <td style={{ ...estilos.td, fontWeight: "600" }}>{c.razon_social}</td>
                <td style={{ ...estilos.td, color: "var(--text-secondary)", fontFamily: "monospace" }}>{c.cuit || "—"}</td>
                <td style={{ ...estilos.td, color: "var(--text-secondary)" }}>{c.email}</td>
                <td style={estilos.td}>{c.ciudad}</td>
                <td style={estilos.td}>{c.zona || "—"}</td>
                <td style={estilos.td}><EstadoCliente cliente={c} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creando && (
        <ModalNuevoCliente
          zonas={zonas}
          onCerrar={() => setCreando(false)}
          onCreado={async () => { await recargar(); setCreando(false) }}
        />
      )}

      {clienteAbierto && (
        <ModalDetalleCliente
          cliente={clienteAbierto}
          zonas={zonas}
          onCerrar={() => setClienteAbierto(null)}
          onCambio={alCambiarCliente}
        />
      )}
    </div>
  )
}
