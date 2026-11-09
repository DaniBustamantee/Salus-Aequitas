import { estilos } from "./estilos"

export function EstadoCliente({ cliente }) {
  if (!cliente.fecha_aprobacion) return <span style={estilos.badgePendiente}>Pendiente</span>
  if (cliente.activo) return <span style={estilos.badgeActivo}>Activo</span>
  return <span style={estilos.badgeInactivo}>Inactivo</span>
}

export function Campo({ label, error, children }) {
  return (
    <div>
      <label style={estilos.label}>{label}</label>
      {children}
      {error && <p style={estilos.errorCampo}>{error}</p>}
    </div>
  )
}

export function SelectorZona({ zonas, value, onChange, name }) {
  return (
    <select style={estilos.input} name={name} value={value} onChange={onChange}>
      <option value="">Sin zona</option>
      {zonas.filter((z) => z.activa).map((z) => (
        <option key={z.id_zona} value={z.id_zona}>{z.nombre}</option>
      ))}
    </select>
  )
}
