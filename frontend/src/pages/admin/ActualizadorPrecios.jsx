import { useState } from "react"
import PanelActualizar from "./precios/PanelActualizar"
import HistorialPrecios from "./precios/HistorialPrecios"
import { estilos } from "./precios/estilos"

const PESTANAS = [["actualizar", "Actualizador"], ["historial", "Historial de cambios"]]

export default function ActualizadorPrecios() {
  const [pestana, setPestana] = useState("actualizar")

  return (
    <div>
      <div style={estilos.encabezado}>
        <div>
          <h1 style={estilos.titulo}>Actualización de Precios</h1>
          <p style={estilos.subtitulo}>Actualizá precios por porcentaje o variación del dólar con historial completo</p>
        </div>
      </div>

      <div style={estilos.tabs}>
        {PESTANAS.map(([clave, texto]) => (
          <button
            key={clave}
            style={pestana === clave ? { ...estilos.tab, ...estilos.tabActivo } : estilos.tab}
            onClick={() => setPestana(clave)}
          >
            {texto}
          </button>
        ))}
      </div>

      {pestana === "actualizar" ? <PanelActualizar /> : <HistorialPrecios />}
    </div>
  )
}
