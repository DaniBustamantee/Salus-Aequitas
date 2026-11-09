import { useState, useEffect } from "react"
import Modal from "../../../components/ui/Modal"
import { fetchAuth, API_URL } from "../../../services/fetchAuth"
import { useToast } from "../../../context/ToastContext"
import { Campo, EstadoCliente, SelectorZona } from "./Componentes"
import { estilos } from "./estilos"

const CAMPOS_DATOS = [
  ["razon_social", "Razón social"],
  ["cuit", "CUIL / CUIT"],
  ["telefono", "Teléfono"],
  ["ciudad", "Ciudad"],
  ["direccion", "Dirección"],
  ["provincia", "Provincia"],
]

const COLOR_ESTADO_PEDIDO = {
  Entregado: { backgroundColor: "var(--verde-claro)", color: "var(--verde-oscuro)" },
  Cancelado: { backgroundColor: "var(--rojo-claro)", color: "var(--rojo)" },
  Despachado: { backgroundColor: "var(--azul-claro)", color: "var(--azul)" },
  Confirmado: { backgroundColor: "var(--azul-claro)", color: "var(--azul)" },
}
const COLOR_ESTADO_OTRO = { backgroundColor: "var(--bg-surface-3)", color: "var(--text-secondary)", border: "1px solid var(--border)" }
const BADGE_PEDIDO = { display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: "600" }

function fecha(valor) {
  return valor ? new Date(valor).toLocaleDateString("es-AR") : "—"
}

export default function ModalDetalleCliente({ cliente, zonas, onCerrar, onCambio }) {
  const { showToast } = useToast()
  const [pestana, setPestana] = useState("datos")
  const [pedidos, setPedidos] = useState([])
  const [cargandoPedidos, setCargandoPedidos] = useState(true)
  const [formDatos, setFormDatos] = useState(() => ({
    ...Object.fromEntries(CAMPOS_DATOS.map(([campo]) => [campo, cliente[campo] || ""])),
    id_zona: cliente.id_zona || "",
  }))
  const [notas, setNotas] = useState(cliente.notas_internas || "")
  const [accionEnCurso, setAccionEnCurso] = useState("")
  const [passTemporal, setPassTemporal] = useState("")

  useEffect(() => {
    fetchAuth(`${API_URL}/clientes/${cliente.id_cliente}/pedidos`)
      .then((res) => res.json())
      .then((datos) => setPedidos(Array.isArray(datos) ? datos : []))
      .catch(() => setPedidos([]))
      .finally(() => setCargandoPedidos(false))
  }, [cliente.id_cliente])

  async function enviar(accion, ruta, metodo, cuerpo, mensajeError) {
    setAccionEnCurso(accion)
    try {
      const res = await fetchAuth(`${API_URL}/clientes/${cliente.id_cliente}${ruta}`, {
        method: metodo,
        body: cuerpo && JSON.stringify(cuerpo),
      })
      const datos = await res.json()
      if (!res.ok) {
        showToast(datos.error || mensajeError, "error")
        return null
      }
      return datos
    } catch {
      showToast("No se pudo conectar con el servidor.", "error")
      return null
    } finally {
      setAccionEnCurso("")
    }
  }

  async function aprobar() {
    if (!await enviar("aprobar", "/aprobar", "PATCH", null, "Error al aprobar el cliente.")) return
    showToast(`${cliente.razon_social} fue aprobado correctamente.`, "exito")
    onCambio(true)
  }

  async function cambiarEstado() {
    if (!await enviar("estado", "/toggle", "PATCH", null, "No se pudo cambiar el estado.")) return
    showToast(`Cliente ${cliente.activo ? "desactivado" : "activado"} correctamente.`, "exito")
    onCambio(true)
  }

  async function guardarDatos() {
    const cuerpo = { ...formDatos, id_zona: formDatos.id_zona || null }
    if (!await enviar("datos", "", "PUT", cuerpo, "Error al guardar los datos.")) return
    showToast("Datos actualizados correctamente.", "exito")
    onCambio(false)
  }

  async function guardarNotas() {
    if (!await enviar("notas", "/notas", "PATCH", { notas_internas: notas }, "Error al guardar las notas.")) return
    showToast("Notas guardadas correctamente.", "exito")
    onCambio(false)
  }

  async function resetearPassword() {
    const datos = await enviar("password", "/reset-password", "PATCH", null, "Error al resetear la contraseña.")
    if (!datos) return
    setPassTemporal(datos.password_temporal)
    showToast("Contraseña reseteada correctamente.", "exito")
  }

  const pestanas = [
    ["datos", "Datos"],
    ["pedidos", pedidos.length > 0 ? `Pedidos (${pedidos.length})` : "Pedidos"],
    ["notas", "Notas"],
    ["cuenta", "Cuenta"],
  ]
  const pendiente = !cliente.fecha_aprobacion

  return (
    <Modal titulo={cliente.razon_social} onCerrar={onCerrar} ancho="800px">
      <div style={estilos.detalleHeader}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-hint)" }}>{cliente.email}</span>
          <span style={{ color: "var(--border)" }}>·</span>
          <EstadoCliente cliente={cliente} />
        </div>
        <span style={{ fontSize: "0.78rem", color: "var(--text-hint)" }}>Alta: {fecha(cliente.fecha_alta)}</span>
      </div>

      <div style={estilos.tabs}>
        {pestanas.map(([clave, texto]) => (
          <button
            key={clave}
            style={pestana === clave ? { ...estilos.tab, ...estilos.tabActivo } : estilos.tab}
            onClick={() => setPestana(clave)}
          >
            {texto}
          </button>
        ))}
      </div>

      {pestana === "datos" && (
        <div>
          <div style={estilos.formGrilla}>
            {CAMPOS_DATOS.map(([campo, etiqueta]) => (
              <Campo key={campo} label={etiqueta}>
                <input
                  style={estilos.input}
                  value={formDatos[campo]}
                  onChange={(e) => setFormDatos((anterior) => ({ ...anterior, [campo]: e.target.value }))}
                />
              </Campo>
            ))}
            <Campo label="Zona">
              <SelectorZona
                zonas={zonas}
                value={formDatos.id_zona}
                onChange={(e) => setFormDatos((anterior) => ({ ...anterior, id_zona: e.target.value }))}
              />
            </Campo>
          </div>
          <div style={estilos.formAcciones}>
            <button style={estilos.botonPrimario} onClick={guardarDatos} disabled={accionEnCurso === "datos"}>
              {accionEnCurso === "datos" ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {pestana === "pedidos" && (
        cargandoPedidos ? <p style={estilos.vacioPestana}>Cargando pedidos...</p>
          : pedidos.length === 0 ? <p style={estilos.vacioPestana}>Este cliente no tiene pedidos registrados aún.</p>
            : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={estilos.thead}>
                    {["Nro. pedido", "Fecha", "Estado", "Unidades", "Ciudad entrega"].map((c) => <th key={c} style={estilos.th}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => (
                    <tr key={p.id_pedido} style={estilos.fila}>
                      <td style={{ ...estilos.td, fontWeight: "600" }}>{p.nro_pedido}</td>
                      <td style={{ ...estilos.td, color: "var(--text-secondary)" }}>{p.fecha_pedido_fmt}</td>
                      <td style={estilos.td}>
                        <span style={{ ...BADGE_PEDIDO, ...(COLOR_ESTADO_PEDIDO[p.estado] || COLOR_ESTADO_OTRO) }}>
                          {p.estado}
                        </span>
                      </td>
                      <td style={{ ...estilos.td, textAlign: "center" }}>{p.total_unidades}</td>
                      <td style={{ ...estilos.td, color: "var(--text-secondary)" }}>{p.ciudad_entrega || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
      )}

      {pestana === "notas" && (
        <div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-hint)", marginBottom: "0.75rem" }}>
            Las notas internas son solo visibles para el administrador. Usálas para registrar aclaraciones, historial de contacto, condiciones especiales, etc.
          </p>
          <textarea
            style={{ ...estilos.input, height: "150px", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: Cliente con pagos puntuales. Prefiere envíos los martes. Contactar a María al 351-XXXXXXX..."
          />
          <div style={{ ...estilos.formAcciones, marginTop: "1rem" }}>
            <button style={estilos.botonPrimario} onClick={guardarNotas} disabled={accionEnCurso === "notas"}>
              {accionEnCurso === "notas" ? "Guardando..." : "Guardar notas"}
            </button>
          </div>
        </div>
      )}

      {pestana === "cuenta" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={estilos.cuentaSeccion}>
            <div>
              <p style={estilos.cuentaLabel}>Estado de la cuenta</p>
              <p style={estilos.cuentaDesc}>
                {pendiente ? "Esta cuenta fue creada por el cliente pero aún no fue aprobada."
                  : cliente.activo ? "La cuenta está activa. El cliente puede ingresar y hacer pedidos."
                    : "La cuenta fue desactivada manualmente por el administrador."}
              </p>
            </div>
            {pendiente ? (
              <button style={{ ...estilos.botonPrimario, flexShrink: 0 }} onClick={aprobar} disabled={accionEnCurso === "aprobar"}>
                {accionEnCurso === "aprobar" ? "Aprobando..." : "✓ Aprobar"}
              </button>
            ) : (
              <button style={{ ...(cliente.activo ? estilos.botonPeligro : estilos.botonPrimario), flexShrink: 0 }} onClick={cambiarEstado}>
                {cliente.activo ? "Desactivar" : "Activar"}
              </button>
            )}
          </div>

          <div style={estilos.cuentaSeccion}>
            <div>
              <p style={estilos.cuentaLabel}>Resetear contraseña</p>
              <p style={estilos.cuentaDesc}>Genera una contraseña temporal que podés comunicarle al cliente.</p>
              {passTemporal && (
                <div style={estilos.passTempBox}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Contraseña temporal:</span>
                  <code style={{ fontWeight: "700", fontSize: "1rem", color: "var(--verde-oscuro)", letterSpacing: "0.5px" }}>{passTemporal}</code>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-hint)" }}>Comunicásela al cliente y pedile que la cambie.</span>
                </div>
              )}
            </div>
            <button style={{ ...estilos.botonSecundario, flexShrink: 0 }} onClick={resetearPassword}>Resetear</button>
          </div>

          <div style={{ fontSize: "0.8rem", color: "var(--text-hint)", borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <p><strong style={{ color: "var(--text-secondary)" }}>Email:</strong> {cliente.email}</p>
            <p><strong style={{ color: "var(--text-secondary)" }}>Fecha de alta:</strong> {fecha(cliente.fecha_alta)}</p>
            {cliente.fecha_aprobacion && (
              <p><strong style={{ color: "var(--text-secondary)" }}>Aprobado el:</strong> {fecha(cliente.fecha_aprobacion)}</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
