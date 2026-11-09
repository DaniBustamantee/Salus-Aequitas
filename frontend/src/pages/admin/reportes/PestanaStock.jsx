import { useMemo } from "react"
import { Chart } from "@tanstack/charts/react"
import { estilos } from "./estilos"
import { SinDatos, TituloSeccion, Pildora, Leyenda, Tabla } from "./Componentes"
import { graficoBarras, colorStock, ROJO, NARANJA, VERDE } from "./graficos"
import { plural } from "../../../utils/formato"

const ORDEN_ESTADO = { critico: 0, bajo: 1, normal: 2 }

export default function PestanaStock({ stockActual, stockCritico, movimientos }) {
  const ordenado = useMemo(() => [...stockActual].sort((a, b) =>
    (ORDEN_ESTADO[a.estado_stock] ?? 3) - (ORDEN_ESTADO[b.estado_stock] ?? 3) || b.stock_actual - a.stock_actual
  ), [stockActual])

  const grafico = useMemo(() => {
    if (ordenado.length === 0) return null
    return graficoBarras(ordenado, {
      categoria: "nombre", valor: "stock_actual", color: "nombre", horizontal: true,
      dominio: ordenado.map((p) => p.nombre),
      colores: ordenado.map((p) => colorStock(p.estado_stock)),
    })
  }, [ordenado])

  return (
    <div style={estilos.columna}>
      <div>
        <TituloSeccion titulo="Niveles de stock por producto" sub={`${stockActual.length} productos`} />
        {grafico ? (
          <>
            <Leyenda items={[[ROJO, "Crítico"], [NARANJA, "Bajo"], [VERDE, "Normal"]]} />
            <Chart definition={grafico} height={Math.max(220, ordenado.length * 40)} ariaLabel="Stock por producto" />
            <div style={estilos.valoresPills}>
              {ordenado.map((p) => (
                <Pildora key={p.nombre} color={colorStock(p.estado_stock)}>{p.nombre}: <strong>{p.stock_actual} u.</strong></Pildora>
              ))}
            </div>
          </>
        ) : <SinDatos />}
      </div>

      <div>
        <TituloSeccion
          titulo="Alertas de stock"
          sub={stockCritico.length === 0 ? "Sin alertas" : `${plural(stockCritico.length, "producto")} bajo mínimo`}
        />
        {stockCritico.length === 0 ? (
          <p style={estilos.msgOk}>✓ Todos los productos tienen stock suficiente</p>
        ) : (
          <Tabla columnas={["Producto", "Código", "Stock actual", "Mínimo", "Crítico", "Faltante"]}>
            {stockCritico.map((p) => (
              <tr key={p.id_producto} style={estilos.fila}>
                <td style={{ ...estilos.td, fontWeight: "600" }}>{p.nombre}</td>
                <td style={{ ...estilos.td, fontFamily: "monospace", color: "var(--text-secondary)" }}>{p.codigo}</td>
                <td style={{ ...estilos.td, color: "var(--rojo)", fontWeight: "700" }}>{p.stock_actual}</td>
                <td style={estilos.td}>{p.stock_minimo}</td>
                <td style={estilos.td}>{p.stock_critico}</td>
                <td style={{ ...estilos.td, color: "var(--rojo)", fontWeight: "700" }}>{p.faltante}</td>
              </tr>
            ))}
          </Tabla>
        )}
      </div>

      <div>
        <TituloSeccion titulo="Movimientos de stock recientes" sub="últimos 100" />
        {movimientos.length === 0 ? <SinDatos /> : (
          <Tabla columnas={["Fecha", "Entidad", "Tipo", "Cantidad", "Anterior", "Nuevo", "Referencia", "Usuario"]}>
            {movimientos.map((m) => (
              <tr key={m.id_movimiento} style={estilos.fila}>
                <td style={{ ...estilos.td, color: "var(--text-secondary)", fontSize: "0.78rem" }}>{m.fecha}</td>
                <td style={{ ...estilos.td, fontWeight: "600" }}>{m.nombre_entidad}</td>
                <td style={estilos.td}>
                  <span style={{ ...estilos.etiqueta, fontWeight: "400", padding: "0.2rem 0.5rem", backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border)" }}>
                    {m.tipo_movimiento}
                  </span>
                </td>
                <td style={{ ...estilos.td, fontWeight: "700", color: m.cantidad > 0 ? "var(--verde-oscuro)" : "var(--rojo)" }}>
                  {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                </td>
                <td style={{ ...estilos.td, color: "var(--text-secondary)" }}>{m.stock_anterior}</td>
                <td style={{ ...estilos.td, fontWeight: "600" }}>{m.stock_nuevo}</td>
                <td style={{ ...estilos.td, fontFamily: "monospace", color: "var(--text-secondary)" }}>{m.referencia || "—"}</td>
                <td style={{ ...estilos.td, color: "var(--text-secondary)" }}>{m.usuario || "—"}</td>
              </tr>
            ))}
          </Tabla>
        )}
      </div>
    </div>
  )
}
