export function formatPrecio(valor) {
  if (valor == null || valor === "") return "—"
  return "$" + Number(valor).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function plural(cantidad, palabra) {
  return `${cantidad} ${palabra}${cantidad !== 1 ? "s" : ""}`
}
