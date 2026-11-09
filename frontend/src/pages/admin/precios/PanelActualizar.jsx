import { useState, useEffect } from "react"
import Modal from "../../../components/ui/Modal"
import { fetchAuth, API_URL } from "../../../services/fetchAuth"
import { useToast } from "../../../context/ToastContext"
import { formatPrecio } from "../../../utils/formato"
import SelectorEntidades from "./SelectorEntidades"
import VistaPrevia from "./VistaPrevia"
import { estilos, CATEGORIAS, COLOR_TIPO, conSigno, colorVariacion } from "./estilos"

const NINGUNO = { productos: new Set(), materias_primas: new Set(), insumos: new Set() }

function todosLosIds(entidades) {
  return Object.fromEntries(CATEGORIAS.map(({ clave }) => [clave, new Set(entidades[clave].map((e) => e.id))]))
}

export default function PanelActualizar() {
  const { showToast } = useToast()
  const [entidades, setEntidades] = useState(null)
  const [seleccionados, setSeleccionados] = useState(NINGUNO)
  const [metodo, setMetodo] = useState("porcentual")
  const [porcentaje, setPorcentaje] = useState("")
  const [dolarAnterior, setDolarAnterior] = useState("")
  const [dolarNuevo, setDolarNuevo] = useState("")
  const [notas, setNotas] = useState("")
  const [mostrarPrevia, setMostrarPrevia] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  async function cargarEntidades() {
    try {
      const res = await fetchAuth(`${API_URL}/precios/entidades`)
      const datos = await res.json()
      setEntidades(datos)
      setSeleccionados(todosLosIds(datos))
    } catch {
      showToast("No se pudieron cargar los precios.", "error")
    }
  }

  useEffect(() => { cargarEntidades() }, [])

  const dolarValido = Number(dolarAnterior) > 0 && Number(dolarNuevo) > 0
  const valido = metodo === "porcentual" ? porcentaje !== "" && !isNaN(Number(porcentaje)) : dolarValido
  const variacion = metodo === "porcentual"
    ? Number(porcentaje) || 0
    : dolarValido ? ((Number(dolarNuevo) - Number(dolarAnterior)) / Number(dolarAnterior)) * 100 : 0
  const factor = 1 + variacion / 100

  const filas = entidades
    ? CATEGORIAS.flatMap(({ clave, tipo }) => entidades[clave].filter((e) => seleccionados[clave].has(e.id)).map((e) => ({ ...e, tipo })))
    : []
  const totalSeleccionados = CATEGORIAS.reduce((suma, { clave }) => suma + seleccionados[clave].size, 0)

  function cambiar(setter) {
    return (e) => { setter(e.target.value); setMostrarPrevia(false) }
  }

  function cambiarItem(clave, id) {
    setSeleccionados((anteriores) => {
      const nuevos = new Set(anteriores[clave])
      if (nuevos.has(id)) nuevos.delete(id)
      else nuevos.add(id)
      return { ...anteriores, [clave]: nuevos }
    })
    setMostrarPrevia(false)
  }

  function cambiarCategoria(clave) {
    if (!entidades) return
    setSeleccionados((anteriores) => {
      const ids = entidades[clave].map((e) => e.id)
      const estabanTodos = ids.length > 0 && ids.every((id) => anteriores[clave].has(id))
      return { ...anteriores, [clave]: estabanTodos ? new Set() : new Set(ids) }
    })
    setMostrarPrevia(false)
  }

  async function aplicar() {
    if (!valido || guardando) return
    setGuardando(true)
    try {
      const res = await fetchAuth(`${API_URL}/precios/actualizar`, {
        method: "POST",
        body: JSON.stringify({
          tipo: metodo,
          notas,
          ids_productos: [...seleccionados.productos],
          ids_materias_primas: [...seleccionados.materias_primas],
          ids_insumos: [...seleccionados.insumos],
          ...(metodo === "porcentual"
            ? { porcentaje: Number(porcentaje) }
            : { dolar_anterior: Number(dolarAnterior), dolar_nuevo: Number(dolarNuevo) }),
        }),
      })
      const datos = await res.json()
      if (!res.ok) {
        showToast(datos.error || "Error al actualizar precios", "error")
        return
      }
      showToast(`✓ ${datos.total} precios actualizados (${conSigno(variacion)})`, "exito")
      setPorcentaje(""); setDolarAnterior(""); setDolarNuevo(""); setNotas("")
      setMostrarPrevia(false)
      setConfirmando(false)
      await cargarEntidades()
    } catch {
      showToast("No se pudo conectar con el servidor.", "error")
    } finally {
      setGuardando(false)
    }
  }

  const ejemploMil = <strong>{formatPrecio(1000 * factor)}</strong>

  return (
    <div style={estilos.grilla}>
      <div style={estilos.columna}>
        <div style={estilos.card}>
          <h2 style={estilos.cardTitulo}>Método de actualización</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[["porcentual", "% Porcentaje"], ["dolar", "$ Dólar"]].map(([clave, texto]) => (
              <button
                key={clave}
                style={metodo === clave ? { ...estilos.toggleBtn, ...estilos.toggleActivo } : estilos.toggleBtn}
                onClick={() => setMetodo(clave)}
              >
                {texto}
              </button>
            ))}
          </div>

          {metodo === "porcentual" ? (
            <div style={{ marginTop: "1rem" }}>
              <label style={estilos.label}>Porcentaje de ajuste</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input style={{ ...estilos.input, width: "140px" }} type="number" step="0.5" placeholder="Ej: 10 o -5" value={porcentaje} onChange={cambiar(setPorcentaje)} />
                <span style={estilos.hint}>%</span>
              </div>
              {valido && <p style={{ ...estilos.hint, marginTop: "0.4rem" }}>Un precio de $1.000 quedaría en {ejemploMil}</p>}
            </div>
          ) : (
            <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={estilos.label}>Dólar anterior ($)</label>
                <input style={estilos.input} type="number" min="1" placeholder="Ej: 800" value={dolarAnterior} onChange={cambiar(setDolarAnterior)} />
              </div>
              <div>
                <label style={estilos.label}>Dólar nuevo ($)</label>
                <input style={estilos.input} type="number" min="1" placeholder="Ej: 1000" value={dolarNuevo} onChange={cambiar(setDolarNuevo)} />
              </div>
              {dolarValido && (
                <p style={{ ...estilos.hint, gridColumn: "1/-1", color: colorVariacion(variacion) }}>
                  Variación calculada: <strong>{conSigno(variacion)}</strong> · Un precio de $1.000 quedaría en {ejemploMil}
                </p>
              )}
            </div>
          )}
        </div>

        <div style={estilos.card}>
          <h2 style={estilos.cardTitulo}>
            ¿Qué actualizar?
            {entidades && (
              <span style={{ fontSize: "0.75rem", fontWeight: "500", color: "var(--text-hint)", marginLeft: "0.5rem" }}>
                {totalSeleccionados} seleccionado{totalSeleccionados !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          {entidades ? (
            <SelectorEntidades entidades={entidades} seleccionados={seleccionados} onCambiarItem={cambiarItem} onCambiarCategoria={cambiarCategoria} />
          ) : (
            <p style={{ ...estilos.hint, textAlign: "center", padding: "0.75rem 0" }}>Cargando...</p>
          )}
        </div>

        <div style={estilos.card}>
          <h2 style={estilos.cardTitulo}>Motivo (opcional)</h2>
          <input
            style={{ ...estilos.input, marginTop: "0.5rem" }}
            placeholder="Ej: Ajuste por inflación octubre, variación dólar blue..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>
      </div>

      <div style={estilos.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={estilos.cardTitulo}>{mostrarPrevia ? `Vista previa (${filas.length} ítems)` : "Vista previa"}</h2>
          <button style={{ ...estilos.botonSecundario, opacity: valido ? 1 : 0.5 }} onClick={() => setMostrarPrevia(true)} disabled={!valido}>
            Ver preview
          </button>
        </div>

        {(!mostrarPrevia || filas.length === 0) && (
          <p style={{ ...estilos.hint, textAlign: "center", padding: "1.5rem 0" }}>
            {mostrarPrevia ? "No hay ítems seleccionados." : "Configurá el método y hacé clic en \"Ver preview\" para ver los nuevos precios antes de confirmar."}
          </p>
        )}

        {mostrarPrevia && filas.length > 0 && (
          <>
            <VistaPrevia filas={filas} factor={factor} />
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Se actualizarán <strong>{filas.length}</strong> precios con un ajuste de{" "}
                <strong style={{ color: colorVariacion(variacion) }}>{conSigno(variacion)}</strong>
              </p>
              <button style={estilos.botonPrimario} onClick={() => setConfirmando(true)}>Confirmar actualización</button>
            </div>
          </>
        )}
      </div>

      {confirmando && (
        <Modal titulo="Confirmar actualización de precios" onCerrar={() => !guardando && setConfirmando(false)} ancho="460px">
          <p style={estilos.modalDesc}>
            Estás por actualizar <strong>{filas.length} precios</strong> con un ajuste de{" "}
            <strong style={{ color: colorVariacion(variacion) }}>{conSigno(variacion)}</strong>.
          </p>
          <p style={estilos.modalDesc}>Esta acción modificará los precios actuales. El cambio quedará registrado en el historial.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "center", margin: "1rem 0" }}>
            {CATEGORIAS.filter(({ clave }) => seleccionados[clave].size > 0).map(({ clave, tipo, plural }) => (
              <span key={clave} style={{ ...estilos.modalChip, ...COLOR_TIPO[tipo] }}>{seleccionados[clave].size} {plural}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.25rem" }}>
            <button style={estilos.botonSecundario} onClick={() => setConfirmando(false)} disabled={guardando}>Cancelar</button>
            <button style={{ ...estilos.botonPrimario, opacity: guardando ? 0.6 : 1, minWidth: "160px" }} onClick={aplicar} disabled={guardando}>
              {guardando ? "Aplicando..." : "Sí, actualizar precios"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
