import { formatPrecio } from "../../../utils/formato"
import { estilos, ETIQUETA_TIPO, COLOR_TIPO, colorVariacion } from "./estilos"

export default function VistaPrevia({ filas, factor }) {
  return (
    <div style={{ maxHeight: "340px", overflowY: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={estilos.thead}>
            <th style={estilos.th}>Nombre</th>
            <th style={estilos.th}>Tipo</th>
            <th style={{ ...estilos.th, textAlign: "right" }}>Precio actual</th>
            <th style={{ ...estilos.th, textAlign: "right" }}>Precio nuevo</th>
            <th style={{ ...estilos.th, textAlign: "right" }}>Diferencia</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => {
            const nuevo = Math.round(fila.precio * factor * 100) / 100
            const diferencia = nuevo - fila.precio
            return (
              <tr key={`${fila.tipo}-${fila.id}`} style={estilos.fila}>
                <td style={estilos.td}>{fila.nombre}</td>
                <td style={estilos.td}>
                  <span style={{ ...estilos.badge, ...COLOR_TIPO[fila.tipo] }}>{ETIQUETA_TIPO[fila.tipo]}</span>
                </td>
                <td style={{ ...estilos.td, textAlign: "right", color: "var(--text-secondary)" }}>{formatPrecio(fila.precio)}</td>
                <td style={{ ...estilos.td, textAlign: "right", fontWeight: "700" }}>{formatPrecio(nuevo)}</td>
                <td style={{ ...estilos.td, textAlign: "right", color: colorVariacion(diferencia), fontWeight: "600" }}>
                  {diferencia >= 0 ? "+" : ""}{formatPrecio(diferencia)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
