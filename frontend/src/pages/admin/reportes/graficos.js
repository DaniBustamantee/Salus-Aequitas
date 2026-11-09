import { barY, barX, defineChart } from "@tanstack/charts"
import { pie, polar, radialArc } from "@tanstack/charts/polar"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"

export const VERDE = "#15A35A"
export const NARANJA = "#EF9F27"
export const AZUL = "#378ADD"
export const ROJO = "#E24B4A"
export const VERDE_OSCURO = "#14532D"

export const COLORES = [VERDE, NARANJA, AZUL, ROJO, VERDE_OSCURO]

export const ESTADOS_PEDIDO = ["Pendiente", "Confirmado", "En preparación", "Despachado", "En tránsito", "En entrega", "Entregado", "Cancelado"]

export const COLOR_ESTADO = {
  "Pendiente": NARANJA,
  "Confirmado": AZUL,
  "En preparación": AZUL,
  "Despachado": VERDE_OSCURO,
  "En tránsito": VERDE,
  "En entrega": VERDE,
  "Entregado": VERDE_OSCURO,
  "Cancelado": ROJO,
}

export const TIPOS_ENVIO = ["Completo", "Parcial", "En curso", "Fallido"]
export const COLORES_TIPOS_ENVIO = [VERDE, NARANJA, AZUL, ROJO]

export const COLOR_PROVINCIA = {
  "Córdoba": "#15A35A",
  "Buenos Aires": "#2563EB",
  "Santa Fe": "#EA580C",
  "Mendoza": "#7C3AED",
  "Tucumán": "#C0392B",
  "Entre Ríos": "#0891B2",
  "Salta": "#B45309",
  "Misiones": "#BE185D",
}

export function colorStock(estado) {
  if (estado === "critico") return ROJO
  if (estado === "bajo") return NARANJA
  return VERDE
}

export function graficoBarras(datos, { categoria, valor, color, dominio, colores, horizontal = false, extra = { radius: { end: 4 } } }) {
  const bandas = { scale: () => scaleBand().padding(0.22) }
  const lineal = { scale: scaleLinear, nice: true, grid: true }
  const marca = horizontal
    ? barX(datos, { y: categoria, x: valor, color, inset: 2, ...extra })
    : barY(datos, { x: categoria, y: valor, color, inset: 2, ...extra })

  return defineChart({
    marks: [marca],
    scales: horizontal ? { y: bandas, x: lineal } : { x: bandas, y: lineal },
    color: { domain: dominio, range: colores },
  })
}

export function graficoTorta(datos, campo) {
  const porciones = pie(datos, { value: "valor" })
  return defineChart({
    marks: [polar({
      inset: 8,
      radiusRatio: 0.82,
      marks: [radialArc(porciones, { innerRadius: ({ radius }) => radius * 0.55, cornerRadius: 4, color: campo, key: campo })],
      scales: { angle: null, radius: null },
    })],
    scales: { x: null, y: null },
    color: { domain: datos.map((d) => d[campo]), range: datos.map((d) => d.color) },
  })
}

export function tonosDe(colorBase, cantidad) {
  if (cantidad <= 1) return [colorBase]
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(colorBase.slice(i, i + 2), 16))
  const mezclar = (desde, hasta, t) => Math.round(desde + (hasta - desde) * t)
  return Array.from({ length: cantidad }, (_, i) => {
    const t = i / (cantidad - 1)
    const canal = (c) => mezclar(c * 0.65, c + (255 - c) * 0.45, t).toString(16).padStart(2, "0")
    return "#" + canal(r) + canal(g) + canal(b)
  })
}
