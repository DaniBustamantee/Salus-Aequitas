import { useState, useEffect } from "react"
import Modal from "../../../components/ui/Modal"
import { fetchAuth, API_URL } from "../../../services/fetchAuth"
import { obtenerProvincias, obtenerLocalidades } from "../../../services/georef"
import { useToast } from "../../../context/ToastContext"
import { formatearCuit, validarCuitDigito } from "../../../utils/cuit"
import { Campo, SelectorZona } from "./Componentes"
import { estilos } from "./estilos"

const FORM_VACIO = {
  razon_social: "", cuil_cuit: "", email: "",
  telefono: "", direccion: "", ciudad: "", provincia: "", id_zona: "",
}

function validar(form) {
  const errores = {}
  if (!form.razon_social.trim()) errores.razon_social = "Campo obligatorio"
  if (!form.cuil_cuit.trim()) errores.cuil_cuit = "Campo obligatorio"
  else if (!/^\d{2}-\d{8}-\d{1}$/.test(form.cuil_cuit)) errores.cuil_cuit = "Formato inválido (XX-XXXXXXXX-X)"
  else if (!validarCuitDigito(form.cuil_cuit)) errores.cuil_cuit = "CUIL/CUIT inválido"
  if (!form.email.trim()) errores.email = "Campo obligatorio"
  else if (!/\S+@\S+\.\S+/.test(form.email)) errores.email = "Email inválido"
  if (form.telefono && !/^[\d\s+\-()]{8,15}$/.test(form.telefono)) errores.telefono = "Teléfono inválido (8 a 15 dígitos)"
  if (!form.provincia) errores.provincia = "Campo obligatorio"
  if (!form.ciudad) errores.ciudad = "Campo obligatorio"
  return errores
}

export default function ModalNuevoCliente({ zonas, onCerrar, onCreado }) {
  const { showToast } = useToast()
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})
  const [provincias, setProvincias] = useState([])
  const [ciudades, setCiudades] = useState([])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    obtenerProvincias().then(setProvincias).catch(() => {})
  }, [])

  function cambiar(campo, valor) {
    setForm((anterior) => ({ ...anterior, [campo]: valor }))
    if (errores[campo]) setErrores((anterior) => ({ ...anterior, [campo]: "" }))
  }

  async function cambiarProvincia(provincia) {
    setForm((anterior) => ({ ...anterior, provincia, ciudad: "" }))
    if (errores.provincia) setErrores((anterior) => ({ ...anterior, provincia: "" }))
    setCiudades([])
    if (!provincia) return
    try {
      setCiudades(await obtenerLocalidades(provincia))
    } catch {
      setCiudades([])
    }
  }

  async function guardar() {
    const erroresValidacion = validar(form)
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion)
      return
    }
    setGuardando(true)
    try {
      const { cuil_cuit, ...resto } = form
      const res = await fetchAuth(`${API_URL}/clientes`, {
        method: "POST",
        body: JSON.stringify({ ...resto, cuit: cuil_cuit, id_zona: form.id_zona || null }),
      })
      if (!res.ok) {
        const error = await res.json()
        showToast(error.error || "Error al crear el cliente.", "error")
        return
      }
      showToast("Cliente creado correctamente.", "exito")
      onCreado()
    } catch {
      showToast("No se pudo conectar con el servidor.", "error")
    } finally {
      setGuardando(false)
    }
  }

  const input = (campo, extra = {}) => (
    <input style={estilos.input} value={form[campo]} onChange={(e) => cambiar(campo, e.target.value)} {...extra} />
  )

  return (
    <Modal titulo="Nuevo cliente" onCerrar={onCerrar}>
      <div style={estilos.formGrilla}>
        <Campo label="Razón social" error={errores.razon_social}>{input("razon_social")}</Campo>
        <Campo label="CUIL / CUIT" error={errores.cuil_cuit}>
          {input("cuil_cuit", {
            placeholder: "XX-XXXXXXXX-X",
            onChange: (e) => cambiar("cuil_cuit", e.target.value.replace(/\D/g, "").slice(0, 11)),
            onBlur: (e) => setForm((anterior) => ({ ...anterior, cuil_cuit: formatearCuit(e.target.value) })),
          })}
        </Campo>
        <Campo label="Email" error={errores.email}>{input("email")}</Campo>
        <Campo label="Teléfono" error={errores.telefono}>{input("telefono")}</Campo>
        <Campo label="Provincia" error={errores.provincia}>
          <select style={estilos.input} value={form.provincia} onChange={(e) => cambiarProvincia(e.target.value)}>
            <option value="">Seleccioná una provincia</option>
            {provincias.map((p) => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Ciudad" error={errores.ciudad}>
          <select style={estilos.input} value={form.ciudad} disabled={!form.provincia} onChange={(e) => cambiar("ciudad", e.target.value)}>
            <option value="">{form.provincia ? "Seleccioná una ciudad" : "Primero seleccioná provincia"}</option>
            {ciudades.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Dirección">{input("direccion")}</Campo>
        <Campo label="Zona">
          <SelectorZona zonas={zonas} value={form.id_zona} onChange={(e) => cambiar("id_zona", e.target.value)} />
        </Campo>
      </div>
      <div style={estilos.formAcciones}>
        <button style={estilos.botonSecundario} onClick={onCerrar}>Cancelar</button>
        <button style={estilos.botonPrimario} onClick={guardar} disabled={guardando}>
          {guardando ? "Creando..." : "Crear cliente"}
        </button>
      </div>
    </Modal>
  )
}
