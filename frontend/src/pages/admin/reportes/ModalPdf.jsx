import { useState } from "react"
import Modal from "../../../components/ui/Modal"
import { fetchAuth, API_URL } from "../../../services/fetchAuth"
import { useToast } from "../../../context/ToastContext"
import { estilos } from "./estilos"

function haceDias(dias) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)
  return fecha.toISOString().slice(0, 10)
}

const ATAJOS = [
  { texto: "Hoy", dias: 0 },
  { texto: "7 días", dias: 7 },
  { texto: "30 días", dias: 30 },
  { texto: "90 días", dias: 90 },
]

export default function ModalPdf({ onCerrar }) {
  const { showToast } = useToast()
  const [desde, setDesde] = useState(haceDias(30))
  const [hasta, setHasta] = useState(haceDias(0))
  const [generando, setGenerando] = useState(false)

  async function descargar() {
    setGenerando(true)
    try {
      const res = await fetchAuth(`${API_URL}/reportes-pdf/completo?desde=${desde}&hasta=${hasta}`)
      if (!res.ok) throw new Error()
      const enlace = document.createElement("a")
      enlace.href = URL.createObjectURL(await res.blob())
      enlace.download = `reporte-${desde}-${hasta}.pdf`
      enlace.click()
      URL.revokeObjectURL(enlace.href)
      onCerrar()
    } catch {
      showToast("No se pudo generar el PDF.", "error")
    } finally {
      setGenerando(false)
    }
  }

  return (
    <Modal titulo="Generar reporte PDF" onCerrar={onCerrar} ancho="380px">
      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>Accesos rápidos</p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {ATAJOS.map(({ texto, dias }) => {
          const activo = desde === haceDias(dias) && hasta === haceDias(0)
          return (
            <button
              key={texto}
              style={activo ? { ...estilos.filtroBtn, ...estilos.filtroBtnActivo } : estilos.filtroBtn}
              onClick={() => { setDesde(haceDias(dias)); setHasta(haceDias(0)) }}
            >
              {texto}
            </button>
          )
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
        <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
          Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={estilos.campoFecha} />
        </label>
        <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
          Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={estilos.campoFecha} />
        </label>
      </div>

      <div style={estilos.formAcciones}>
        <button style={estilos.botonSecundario} onClick={onCerrar}>Cancelar</button>
        <button style={{ ...estilos.botonPrimario, opacity: generando ? 0.6 : 1 }} onClick={descargar} disabled={generando}>
          {generando ? "Generando..." : "Generar PDF"}
        </button>
      </div>
    </Modal>
  )
}
