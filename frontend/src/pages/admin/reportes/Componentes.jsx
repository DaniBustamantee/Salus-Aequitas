import { estilos } from "./estilos"

export function Tarjeta({ titulo, valor, sub, color }) {
  return (
    <div style={estilos.tarjeta}>
      <div style={{ ...estilos.tarjetaBarra, backgroundColor: color }} />
      <div style={estilos.tarjetaCuerpo}>
        <p style={estilos.tarjetaTitulo}>{titulo}</p>
        <p style={estilos.tarjetaValor}>{valor}</p>
        <p style={estilos.tarjetaSub}>{sub}</p>
      </div>
    </div>
  )
}

export function SinDatos() {
  return <p style={estilos.sinDatos}>Sin datos para los filtros seleccionados</p>
}

export function TituloSeccion({ titulo, sub }) {
  return (
    <div style={estilos.seccionEncabezado}>
      <h2 style={estilos.seccionTitulo}>{titulo}</h2>
      {sub && <span style={{ fontSize: "0.72rem", color: "var(--text-hint)" }}>{sub}</span>}
    </div>
  )
}

export function Cuadradito({ color, tamano = 8 }) {
  return <span style={{ width: tamano, height: tamano, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
}

export function Pildora({ color, children }) {
  return (
    <span style={estilos.valorPill}>
      {color && <Cuadradito color={color} />}
      {children}
    </span>
  )
}

export function Leyenda({ items }) {
  return (
    <div style={estilos.leyenda}>
      {items.map(([color, texto]) => (
        <span key={texto} style={estilos.leyendaItem}>
          <Cuadradito color={color} tamano={10} />
          {texto}
        </span>
      ))}
    </div>
  )
}

export function FilaPorcentaje({ color, texto, valor, total, sangria = false }) {
  return (
    <div style={{ ...estilos.leyendaDonutFila, ...(sangria && { paddingLeft: "0.5rem" }) }}>
      <Cuadradito color={color} tamano={10} />
      <span style={{ flex: 1, color: "var(--text-primary)" }}>{texto}</span>
      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{valor}</span>
      <span style={estilos.porcentaje}>{Math.round(valor / total * 100)}%</span>
    </div>
  )
}

export function Tabla({ columnas, children }) {
  return (
    <table style={estilos.tabla}>
      <thead>
        <tr style={estilos.thead}>
          {columnas.map((c) => <th key={c} style={estilos.th}>{c}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}
