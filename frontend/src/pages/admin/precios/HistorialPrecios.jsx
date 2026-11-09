import { useState } from "react"
import { API_URL } from "../../../services/fetchAuth"
import { useCargarDatos } from "../../../hooks/useCargarDatos"
import { formatPrecio } from "../../../utils/formato"
import { estilos, ETIQUETA_TIPO, COLOR_TIPO } from "./estilos"

const FILTROS = [["todos", "Todos"], ["porcentual", "Porcentual"], ["dolar", "Dólar"]]

export default function HistorialPrecios() {
  const { datos: [historial], cargando } = useCargarDatos([`${API_URL}/precios/historial`])
  const [filtro, setFiltro] = useState("todos")
  const visibles = historial.filter((h) => filtro === "todos" || h.tipo_actualizacion === filtro)

  return (
    <div>
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
        {FILTROS.map(([clave, texto]) => (
          <button
            key={clave}
            style={filtro === clave ? { ...estilos.filtro, ...estilos.filtroActivo } : estilos.filtro}
            onClick={() => setFiltro(clave)}
          >
            {texto}
          </button>
        ))}
      </div>

      <div style={estilos.tablaWrap}>
        {cargando ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "var(--text-hint)" }}>Cargando historial...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={estilos.thead}>
                <th style={estilos.th}>Fecha</th>
                <th style={estilos.th}>Entidad</th>
                <th style={estilos.th}>Tipo</th>
                <th style={estilos.th}>Ajuste aplicado</th>
                <th style={{ ...estilos.th, textAlign: "right" }}>Precio anterior</th>
                <th style={{ ...estilos.th, textAlign: "right" }}>Precio nuevo</th>
                <th style={estilos.th}>Usuario</th>
                <th style={estilos.th}>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((h) => (
                <tr key={h.id_historial} style={estilos.fila}>
                  <td style={{ ...estilos.td, fontSize: "0.78rem", color: "var(--text-secondary)" }}>{h.fecha_actualizacion?.replace("T", " ")}</td>
                  <td style={estilos.td}>{h.nombre_entidad}</td>
                  <td style={estilos.td}>
                    <span style={{ ...estilos.badge, ...COLOR_TIPO[h.tipo_entidad] }}>{ETIQUETA_TIPO[h.tipo_entidad] || h.tipo_entidad}</span>
                  </td>
                  <td style={{ ...estilos.td, fontSize: "0.82rem", color: "var(--text-secondary)" }}>{h.valor_referencia}</td>
                  <td style={{ ...estilos.td, textAlign: "right", color: "var(--text-secondary)" }}>{formatPrecio(h.precio_anterior)}</td>
                  <td style={{ ...estilos.td, textAlign: "right", fontWeight: "700" }}>{formatPrecio(h.precio_nuevo)}</td>
                  <td style={{ ...estilos.td, fontSize: "0.82rem" }}>{h.usuario || "—"}</td>
                  <td style={{ ...estilos.td, fontSize: "0.78rem", color: "var(--text-secondary)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.notas || "—"}
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-hint)", fontSize: "0.875rem" }}>
                    No hay registros de cambios de precios aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
