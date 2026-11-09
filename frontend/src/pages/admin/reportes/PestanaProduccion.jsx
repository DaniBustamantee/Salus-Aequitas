import { useMemo } from "react"
import { Chart } from "@tanstack/charts/react"
import { estilos } from "./estilos"
import { SinDatos, TituloSeccion, FilaPorcentaje, Tabla } from "./Componentes"
import { graficoTorta, AZUL, NARANJA, VERDE, ROJO } from "./graficos"
import { plural } from "../../../utils/formato"

const ESTADOS_LOTE = [
  { label: "En proceso", color: AZUL, fondo: "var(--azul-claro)", texto: "var(--azul)" },
  { label: "Finalizado", color: NARANJA, fondo: "var(--naranja-claro, #fff3e0)", texto: "var(--naranja)" },
  { label: "Controlado", color: VERDE, fondo: "var(--verde-claro)", texto: "var(--verde-oscuro)" },
  { label: "Cancelado", color: ROJO, fondo: "var(--rojo-claro)", texto: "var(--rojo)" },
]

function colorDiasRestantes(dias) {
  if (dias <= 15) return "var(--rojo)"
  if (dias <= 30) return "var(--naranja)"
  return "var(--text-primary)"
}

export default function PestanaProduccion({ lotes, lotesPorVencer }) {
  const porEstado = useMemo(() => ESTADOS_LOTE
    .map((e) => ({ ...e, valor: lotes.filter((l) => l.estado === e.label).length }))
    .filter((e) => e.valor > 0), [lotes])
  const grafico = useMemo(() => (porEstado.length > 0 ? graficoTorta(porEstado, "label") : null), [porEstado])

  return (
    <div style={estilos.columna}>
      <div>
        <TituloSeccion titulo="Distribución por estado" sub={`${plural(lotes.length, "lote")} en total`} />
        {grafico ? (
          <>
            <Chart definition={grafico} height={240} ariaLabel="Distribución de lotes por estado" />
            <div style={estilos.leyendaDonut}>
              {porEstado.map((e) => (
                <FilaPorcentaje key={e.label} color={e.color} texto={e.label} valor={e.valor} total={lotes.length} />
              ))}
            </div>
          </>
        ) : <SinDatos />}
      </div>

      <div>
        <TituloSeccion
          titulo="Lotes próximos a vencer (60 días)"
          sub={lotesPorVencer.length === 0 ? "Sin alertas" : plural(lotesPorVencer.length, "lote")}
        />
        {lotesPorVencer.length === 0 ? (
          <p style={estilos.msgOk}>✓ No hay lotes próximos a vencer</p>
        ) : (
          <Tabla columnas={["Lote", "Producto", "Cantidad", "Vence", "Días restantes", "Estado"]}>
            {lotesPorVencer.map((l) => (
              <tr key={l.id_lote} style={estilos.fila}>
                <td style={{ ...estilos.td, fontFamily: "monospace", fontWeight: "600" }}>{l.nro_lote}</td>
                <td style={estilos.td}>{l.producto}</td>
                <td style={estilos.td}>{l.cantidad_producida}</td>
                <td style={estilos.td}>{l.fecha_vencimiento}</td>
                <td style={estilos.td}>
                  <span style={{ fontWeight: "700", color: colorDiasRestantes(l.dias_restantes) }}>{l.dias_restantes} días</span>
                </td>
                <td style={estilos.td}>{l.estado}</td>
              </tr>
            ))}
          </Tabla>
        )}
      </div>

      <div>
        <TituloSeccion titulo="Todos los lotes de producción" sub={plural(lotes.length, "lote")} />
        {lotes.length === 0 ? <SinDatos /> : (
          <Tabla columnas={["Lote", "Producto", "Cantidad", "Elaboración", "Vencimiento", "Estado", "Operario", "Observaciones"]}>
            {lotes.map((l) => {
              const estado = ESTADOS_LOTE.find((e) => e.label === l.estado)
              return (
                <tr key={l.id_lote} style={estilos.fila}>
                  <td style={{ ...estilos.td, fontFamily: "monospace", fontWeight: "600" }}>{l.nro_lote}</td>
                  <td style={estilos.td}>{l.producto}</td>
                  <td style={estilos.td}>{l.cantidad_producida}</td>
                  <td style={{ ...estilos.td, color: "var(--text-secondary)" }}>{l.fecha_elaboracion}</td>
                  <td style={{ ...estilos.td, color: "var(--text-secondary)" }}>{l.fecha_vencimiento}</td>
                  <td style={estilos.td}>
                    <span style={{ ...estilos.etiqueta, fontSize: "0.72rem", backgroundColor: estado?.fondo, color: estado?.texto }}>{l.estado}</span>
                  </td>
                  <td style={{ ...estilos.td, color: "var(--text-secondary)" }}>{l.operario}</td>
                  <td style={{ ...estilos.td, color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: l.observaciones ? "normal" : "italic" }}>
                    {l.observaciones || "—"}
                  </td>
                </tr>
              )
            })}
          </Tabla>
        )}
      </div>
    </div>
  )
}
