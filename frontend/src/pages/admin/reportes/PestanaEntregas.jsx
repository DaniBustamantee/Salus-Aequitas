import { useMemo } from "react"
import { Chart } from "@tanstack/charts/react"
import { estilos } from "./estilos"
import { SinDatos, TituloSeccion, FilaPorcentaje, Tabla } from "./Componentes"
import { graficoTorta, VERDE, AZUL, NARANJA, ROJO } from "./graficos"
import { plural } from "../../../utils/formato"

const RESULTADOS = [
  { label: "Entregado", color: VERDE },
  { label: "En curso", color: AZUL },
  { label: "Parcial", color: NARANJA },
  { label: "Fallido", color: ROJO },
]

export default function PestanaEntregas({ entregas, entregasFallidas, pedidosCancelados }) {
  const porResultado = useMemo(() => RESULTADOS
    .map((r) => ({
      ...r,
      valor: entregas.filter((e) => (r.label === "En curso" ? !e.resultado_entrega : e.resultado_entrega === r.label)).length,
    }))
    .filter((r) => r.valor > 0), [entregas])
  const grafico = useMemo(() => (porResultado.length > 0 ? graficoTorta(porResultado, "label") : null), [porResultado])

  return (
    <div style={estilos.columna}>
      <div>
        <TituloSeccion titulo="Resultados de entrega" sub={`${plural(entregas.length, "envío")} en total`} />
        {grafico ? (
          <>
            <Chart definition={grafico} height={240} ariaLabel="Resultados de entrega" />
            <div style={estilos.leyendaDonut}>
              {porResultado.map((r) => (
                <FilaPorcentaje key={r.label} color={r.color} texto={r.label} valor={r.valor} total={entregas.length} />
              ))}
            </div>
          </>
        ) : <SinDatos />}
      </div>

      <div>
        <TituloSeccion
          titulo="Entregas fallidas o parciales"
          sub={entregasFallidas.length === 0 ? "Sin registros" : plural(entregasFallidas.length, "registro")}
        />
        {entregasFallidas.length === 0 ? (
          <p style={estilos.msgOk}>✓ No hay entregas fallidas o parciales</p>
        ) : (
          <Tabla columnas={["Pedido", "Cliente", "Transportista", "Resultado", "Fecha", "Observaciones"]}>
            {entregasFallidas.map((e) => {
              const fallida = e.resultado_entrega === "Fallido"
              return (
                <tr key={e.id_envio} style={estilos.fila}>
                  <td style={{ ...estilos.td, fontWeight: "600" }}>{e.nro_pedido}</td>
                  <td style={estilos.td}>{e.cliente}</td>
                  <td style={estilos.td}>{e.transportista}</td>
                  <td style={estilos.td}>
                    <span style={{
                      ...estilos.etiqueta,
                      backgroundColor: fallida ? "var(--rojo-claro)" : "var(--naranja-claro, #fff3e0)",
                      color: fallida ? "var(--rojo)" : "var(--naranja)",
                    }}>
                      {e.resultado_entrega}
                    </span>
                  </td>
                  <td style={{ ...estilos.td, color: "var(--text-secondary)" }}>{e.fecha_entrega || "—"}</td>
                  <td style={{ ...estilos.td, color: "var(--text-secondary)", fontSize: "0.8rem" }}>{e.observaciones || "—"}</td>
                </tr>
              )
            })}
          </Tabla>
        )}
      </div>

      <div>
        <TituloSeccion
          titulo="Pedidos cancelados"
          sub={pedidosCancelados.length === 0 ? "Sin registros" : plural(pedidosCancelados.length, "pedido")}
        />
        {pedidosCancelados.length === 0 ? (
          <p style={estilos.msgOk}>✓ No hay pedidos cancelados</p>
        ) : (
          <Tabla columnas={["Pedido", "Cliente", "Fecha", "Estado previo", "Motivo / Observación"]}>
            {pedidosCancelados.map((p) => (
              <tr key={p.id_pedido} style={estilos.fila}>
                <td style={{ ...estilos.td, fontWeight: "600" }}>{p.nro_pedido}</td>
                <td style={estilos.td}>{p.cliente}</td>
                <td style={{ ...estilos.td, color: "var(--text-secondary)" }}>{p.fecha_pedido}</td>
                <td style={estilos.td}>{p.estado_previo || "—"}</td>
                <td style={{ ...estilos.td, color: "var(--text-secondary)", fontSize: "0.8rem" }}>{p.motivo || "—"}</td>
              </tr>
            ))}
          </Tabla>
        )}
      </div>
    </div>
  )
}
