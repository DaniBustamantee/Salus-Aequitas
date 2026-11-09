import { estilosComunes } from "../../../styles/estilosComunes"

const badge = { display: "inline-flex", alignItems: "center", padding: "0.25rem 0.7rem", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: "600" }
const boton = { padding: "0.65rem 1.4rem", borderRadius: "var(--radius-md)", fontSize: "0.875rem", cursor: "pointer" }

export const estilos = {
  ...estilosComunes,
  encabezado: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" },
  alertaPendientes: { display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "var(--azul-claro)", border: "1.5px solid var(--azul)", borderRadius: "var(--radius-lg)", padding: "0.85rem 1.25rem", marginBottom: "1rem", color: "var(--azul)" },
  barra: { display: "flex", gap: "1rem", marginBottom: "1.25rem", alignItems: "center" },
  buscador: { flex: 1, padding: "0.65rem 1rem", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", color: "var(--text-primary)", backgroundColor: "var(--bg-surface)", boxShadow: "var(--shadow-xs)" },
  filtro: { padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", fontSize: "0.8rem", border: "1.5px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)", cursor: "pointer", fontWeight: "500" },
  filtroActivo: { backgroundColor: "var(--verde-claro)", border: "1.5px solid var(--verde)", color: "var(--verde-oscuro)", fontWeight: "700" },
  vacio: { padding: "2.5rem", textAlign: "center", color: "var(--text-hint)", fontSize: "0.875rem" },
  badgeActivo: { ...badge, backgroundColor: "var(--verde-claro)", color: "var(--verde-oscuro)" },
  badgeInactivo: { ...badge, backgroundColor: "var(--bg-surface-3)", color: "var(--text-hint)", border: "1px solid var(--border)" },
  badgePendiente: { ...badge, backgroundColor: "var(--azul-claro)", color: "var(--azul)" },
  detalleHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 1rem 0", borderBottom: "1px solid var(--border)", marginBottom: "0.75rem" },
  tabs: { display: "flex", gap: "0.35rem", marginBottom: "1.25rem" },
  tab: { padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", fontSize: "0.82rem", border: "1.5px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface-2)", cursor: "pointer", fontWeight: "500" },
  tabActivo: { backgroundColor: "var(--verde-claro)", border: "1.5px solid var(--verde)", color: "var(--verde-oscuro)", fontWeight: "700" },
  vacioPestana: { textAlign: "center", color: "var(--text-hint)", fontSize: "0.875rem", padding: "2rem" },
  cuentaSeccion: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem", padding: "1rem", backgroundColor: "var(--bg-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" },
  cuentaLabel: { fontWeight: "700", fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: "0.2rem" },
  cuentaDesc: { fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 },
  passTempBox: { display: "flex", flexDirection: "column", gap: "0.2rem", marginTop: "0.75rem", padding: "0.65rem 0.9rem", backgroundColor: "var(--verde-claro)", borderRadius: "var(--radius-md)", border: "1px solid var(--verde)" },
  formGrilla: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem", marginBottom: "1.5rem" },
  label: { display: "block", fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.4rem" },
  input: { width: "100%", padding: "0.65rem 0.85rem", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", color: "var(--text-primary)", backgroundColor: "var(--bg-surface)", boxSizing: "border-box" },
  errorCampo: { fontSize: "0.75rem", color: "var(--rojo)", marginTop: "0.3rem" },
  formAcciones: { display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.25rem" },
  botonPrimario: { ...boton, backgroundColor: "var(--verde)", color: "white", fontWeight: "700", boxShadow: "var(--shadow-verde)" },
  botonSecundario: { ...boton, backgroundColor: "var(--bg-surface)", color: "var(--text-secondary)", fontWeight: "600", border: "1.5px solid var(--border)" },
  botonPeligro: { ...boton, backgroundColor: "var(--rojo-claro)", color: "var(--rojo)", fontWeight: "700", border: "1.5px solid var(--rojo)" },
}
