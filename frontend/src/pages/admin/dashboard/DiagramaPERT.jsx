const ANCHO = 124
const ALTO = 58
const MEDIO_ANCHO = ANCHO / 2
const RADIO = 8
const FRANJA = 4
const FILA_ARRIBA = 20
const FILA_ABAJO = 142
const COLUMNAS = [74, 278, 482, 686]

const NODOS_ARRIBA = ["proveedores", "insumos", "produccion", "stock"]
const NODOS_ABAJO = ["clientes", "pedidos", "envios", "entrega"]
const ETAPAS = ["Abastecimiento", "Proceso interno", "Operación", "Resultado"]

const COLOR_FLECHA = { verde: "#16A34A", naranja: "#D97706", rojo: "#DC2626" }
const ICONO = { verde: "✓", naranja: "!", rojo: "✕" }

const PALETA = {
  light: {
    verde: { fondo: "#FFFFFF", borde: "rgba(22,163,74,0.18)", franja: "#16A34A", texto: "#166534", etiqueta: "NORMAL" },
    naranja: { fondo: "#FFFFFF", borde: "rgba(217,119,6,0.18)", franja: "#D97706", texto: "#92400E", etiqueta: "ATENCIÓN" },
    rojo: { fondo: "#FFF7F7", borde: "rgba(220,38,38,0.18)", franja: "#DC2626", texto: "#991B1B", etiqueta: "CRÍTICO" },
    titulo: "#64748B", sub: "#94A3B8", banda: "#F8FAFC", bandaBorde: "#E2E8F0", sombra: "rgba(15,23,42,0.06)",
  },
  dark: {
    verde: { fondo: "#1A2E1C", borde: "rgba(34,197,94,0.25)", franja: "#22C55E", texto: "#4ADE80", etiqueta: "NORMAL" },
    naranja: { fondo: "#2A1E0A", borde: "rgba(251,191,36,0.25)", franja: "#FBBF24", texto: "#FCD34D", etiqueta: "ATENCIÓN" },
    rojo: { fondo: "#2A1010", borde: "rgba(248,113,113,0.25)", franja: "#F87171", texto: "#FCA5A5", etiqueta: "CRÍTICO" },
    titulo: "#8FAF96", sub: "#5A7A60", banda: "#1A2A1C", bandaBorde: "#2A3E2C", sombra: "rgba(0,0,0,0.35)",
  },
}

function colorFlecha(salud) {
  return COLOR_FLECHA[salud] || COLOR_FLECHA.verde
}

function Flecha({ x1, x2, y, salud }) {
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={colorFlecha(salud)} strokeWidth="1.8" markerEnd={`url(#flecha-${salud || "verde"})`} />
}

function Nodo({ id, nodo, x, y, vista, paleta }) {
  const colores = paleta[nodo.salud] || paleta.verde
  const izquierda = x - MEDIO_ANCHO
  const textoX = izquierda + FRANJA + 8
  const iconoX = izquierda + FRANJA + 20

  return (
    <g>
      <rect x={izquierda + 2} y={y + 3} width={ANCHO} height={ALTO} rx={RADIO} fill={paleta.sombra} />
      <rect x={izquierda} y={y} width={ANCHO} height={ALTO} rx={RADIO} fill={colores.fondo} stroke={colores.borde} strokeWidth="1.2" />
      <clipPath id={`c-${id}`}>
        <rect x={izquierda} y={y} width={ANCHO} height={ALTO} rx={RADIO} />
      </clipPath>
      <rect x={izquierda} y={y} width={FRANJA} height={ALTO} fill={colores.franja} clipPath={`url(#c-${id})`} />

      <text x={textoX} y={y + 14} fontSize="7" fill={paleta.titulo} fontWeight="600" letterSpacing="0.9">
        {nodo.titulo.toUpperCase()}
      </text>

      {vista === "cantidad" ? (
        <>
          <text x={textoX} y={y + 34} fontSize="13.5" fontWeight="800" fill={colores.texto}>{nodo.valor}</text>
          <text x={textoX} y={y + 47} fontSize="7" fill={paleta.sub}>{nodo.sub}</text>
        </>
      ) : (
        <>
          <circle cx={iconoX} cy={y + 36} r={11} fill={colores.franja} opacity="0.12" />
          <circle cx={iconoX} cy={y + 36} r={8} fill={colores.franja} />
          <text x={iconoX} y={y + 40} textAnchor="middle" fontSize="9" fontWeight="900" fill="white">
            {ICONO[nodo.salud] || ICONO.rojo}
          </text>
          <text x={iconoX + 16} y={y + 40} fontSize="8" fontWeight="700" fill={colores.franja}>{colores.etiqueta}</text>
        </>
      )}
    </g>
  )
}

export default function DiagramaPERT({ nodos, vista, tema }) {
  const paleta = tema === "dark" ? PALETA.dark : PALETA.light
  const medioY = Math.round((FILA_ARRIBA + ALTO + FILA_ABAJO) / 2)
  const r = 10
  const [, colPedidos, , colStock] = COLUMNAS
  const saludStock = nodos.stock?.salud

  const filas = [[NODOS_ARRIBA, FILA_ARRIBA], [NODOS_ABAJO, FILA_ABAJO]]

  return (
    <svg viewBox="0 0 760 222" style={{ width: "100%", height: "auto", display: "block", margin: "0.75rem 0" }}>
      <defs>
        {Object.entries(COLOR_FLECHA).map(([salud, color]) => (
          <marker key={salud} id={`flecha-${salud}`} markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill={color} />
          </marker>
        ))}
      </defs>

      {[12, 132].map((y) => (
        <rect key={y} x={10} y={y} width={740} height={72} rx={7} fill={paleta.banda} stroke={paleta.bandaBorde} strokeWidth="0.8" />
      ))}
      {[176, 380, 584].map((x) => (
        <line key={x} x1={x} y1={18} x2={x} y2={206} stroke={paleta.bandaBorde} strokeWidth="0.8" strokeDasharray="4 4" />
      ))}

      {filas.map(([claves, y]) => claves.slice(0, -1).map((clave, i) => (
        <Flecha
          key={clave}
          x1={COLUMNAS[i] + MEDIO_ANCHO + 3}
          x2={COLUMNAS[i + 1] - MEDIO_ANCHO - 9}
          y={y + ALTO / 2}
          salud={nodos[clave]?.salud}
        />
      )))}

      <path
        d={`M ${colStock} ${FILA_ARRIBA + ALTO + 2}
            L ${colStock} ${medioY - r}
            Q ${colStock} ${medioY} ${colStock - r} ${medioY}
            L ${colPedidos + r} ${medioY}
            Q ${colPedidos} ${medioY} ${colPedidos} ${medioY + r}
            L ${colPedidos} ${FILA_ABAJO - 8}`}
        fill="none"
        stroke={colorFlecha(saludStock)}
        strokeWidth="1.8"
        strokeDasharray="6 4"
        markerEnd={`url(#flecha-${saludStock || "verde"})`}
      />

      {filas.map(([claves, y]) => claves.map((clave, i) => nodos[clave] && (
        <Nodo key={clave} id={clave} nodo={nodos[clave]} x={COLUMNAS[i]} y={y} vista={vista} paleta={paleta} />
      )))}

      {ETAPAS.map((etapa, i) => (
        <text key={etapa} x={COLUMNAS[i]} y={215} textAnchor="middle" fontSize="8" fill={paleta.sub} fontWeight="600" letterSpacing="0.4">
          {etapa}
        </text>
      ))}
    </svg>
  )
}
