export const ETIQUETA_TIPO = { producto: "Producto", materia_prima: "Materia Prima", insumo: "Insumo" }

export const COLOR_TIPO = {
  producto: { backgroundColor: "var(--azul-claro,#e8f0fe)", color: "var(--azul)" },
  materia_prima: { backgroundColor: "var(--verde-claro)", color: "var(--verde-oscuro)" },
  insumo: { backgroundColor: "var(--naranja-claro)", color: "var(--naranja)" },
}

export const CATEGORIAS = [
  { clave: "productos", tipo: "producto", texto: "Productos terminados", plural: "productos" },
  { clave: "materias_primas", tipo: "materia_prima", texto: "Materias Primas", plural: "materias primas" },
  { clave: "insumos", tipo: "insumo", texto: "Insumos", plural: "insumos" },
]

export function conSigno(porcentaje) {
  return `${porcentaje >= 0 ? "+" : ""}${porcentaje.toFixed(2)}%`
}

export function colorVariacion(valor) {
  return valor >= 0 ? "var(--verde-oscuro)" : "var(--rojo)"
}

export const estilos = {
  encabezado: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  titulo: { fontSize: "1.65rem", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.3px" },
  subtitulo: { fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.3rem" },
  tabs: { display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--border)", paddingBottom: "0" },
  tab: { padding: "0.6rem 1.2rem", fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: "-2px", backgroundColor: "transparent" },
  tabActivo: { color: "var(--verde-oscuro)", borderBottom: "2px solid var(--verde)", fontWeight: "700" },
  grilla: { display: "grid", gridTemplateColumns: "380px 1fr", gap: "1rem", alignItems: "start" },
  columna: { display: "flex", flexDirection: "column", gap: "1rem" },
  card: { backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", padding: "1.25rem", border: "1px solid var(--border)" },
  cardTitulo: { fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "0.75rem" },
  toggleBtn: { flex: 1, padding: "0.6rem", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontWeight: "600", cursor: "pointer", border: "1.5px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface-2)" },
  toggleActivo: { backgroundColor: "var(--verde-claro)", border: "1.5px solid var(--verde)", color: "var(--verde-oscuro)" },
  label: { display: "block", fontSize: "0.8rem", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "0.35rem" },
  input: { width: "100%", padding: "0.65rem 1rem", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", color: "var(--text-primary)", backgroundColor: "var(--bg-surface)", boxSizing: "border-box" },
  hint: { fontSize: "0.8rem", color: "var(--text-hint)" },
  catBloque: { border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" },
  catHeader: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 0.75rem", backgroundColor: "var(--bg-surface-2)" },
  catToggleBtn: { padding: "0 0.25rem", backgroundColor: "transparent", color: "var(--text-hint)", fontSize: "0.65rem", cursor: "pointer", border: "none", flexShrink: 0, lineHeight: 1 },
  catItems: { borderTop: "1px solid var(--border)", maxHeight: "210px", overflowY: "auto" },
  itemRow: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.42rem 0.75rem", borderBottom: "1px solid var(--border)", cursor: "pointer" },
  tablaWrap: { backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", overflow: "hidden", border: "1px solid var(--border)" },
  thead: { backgroundColor: "var(--bg-surface-2)" },
  th: { padding: "0.8rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "700", color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.5px" },
  fila: { borderBottom: "1px solid var(--border)" },
  td: { padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-primary)" },
  badge: { display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: "var(--radius-full)", fontSize: "0.72rem", fontWeight: "700" },
  filtro: { padding: "0.45rem 1rem", borderRadius: "var(--radius-md)", fontSize: "0.8rem", border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)", cursor: "pointer" },
  filtroActivo: { backgroundColor: "var(--verde-claro)", border: "1.5px solid var(--verde)", color: "var(--verde-oscuro)", fontWeight: "600" },
  botonPrimario: { padding: "0.6rem 1.25rem", backgroundColor: "var(--verde)", color: "white", borderRadius: "var(--radius-md)", fontWeight: "700", boxShadow: "var(--shadow-verde)", fontSize: "0.875rem", cursor: "pointer" },
  botonSecundario: { padding: "0.6rem 1.1rem", backgroundColor: "var(--bg-surface-3)", color: "var(--text-secondary)", borderRadius: "var(--radius-md)", fontWeight: "600", fontSize: "0.875rem", cursor: "pointer", border: "1px solid var(--border)" },
  modalDesc: { fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.6rem", lineHeight: 1.6, textAlign: "center" },
  modalChip: { padding: "0.25rem 0.75rem", borderRadius: "var(--radius-full)", fontSize: "0.78rem", fontWeight: "700" },
}
