import { useState, useEffect, useRef } from "react"
import { formatPrecio } from "../../../utils/formato"
import { estilos, CATEGORIAS, COLOR_TIPO } from "./estilos"

function CheckboxCategoria({ todos, ninguno, onChange }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !todos && !ninguno
  }, [todos, ninguno])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={todos}
      onChange={onChange}
      style={{ width: "15px", height: "15px", cursor: "pointer", flexShrink: 0 }}
    />
  )
}

export default function SelectorEntidades({ entidades, seleccionados, onCambiarItem, onCambiarCategoria }) {
  const [abiertas, setAbiertas] = useState({})

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
      {CATEGORIAS.map(({ clave, tipo, texto }) => {
        const items = entidades?.[clave] || []
        const elegidos = seleccionados[clave]
        const abierta = abiertas[clave]
        return (
          <div key={clave} style={estilos.catBloque}>
            <div style={estilos.catHeader}>
              <CheckboxCategoria
                todos={items.length > 0 && items.every((i) => elegidos.has(i.id))}
                ninguno={items.every((i) => !elegidos.has(i.id))}
                onChange={() => onCambiarCategoria(clave)}
              />
              <span style={{ ...estilos.badge, ...COLOR_TIPO[tipo] }}>{texto}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-hint)", marginLeft: "auto" }}>
                {elegidos.size}/{items.length}
              </span>
              <button style={estilos.catToggleBtn} onClick={() => setAbiertas((a) => ({ ...a, [clave]: !a[clave] }))}>
                {abierta ? "▲" : "▼"}
              </button>
            </div>

            {abierta && (
              <div style={estilos.catItems}>
                {items.length === 0 && <p style={{ ...estilos.hint, padding: "0.5rem 0.75rem" }}>Sin ítems</p>}
                {items.map((item) => (
                  <label key={item.id} style={estilos.itemRow}>
                    <input
                      type="checkbox"
                      checked={elegidos.has(item.id)}
                      onChange={() => onCambiarItem(clave, item.id)}
                      style={{ width: "14px", height: "14px", cursor: "pointer", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.8rem", color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.nombre}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-hint)", flexShrink: 0, marginLeft: "0.4rem" }}>
                      {formatPrecio(item.precio)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
