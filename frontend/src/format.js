const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export const money = (value) => cop.format(Number(value) || 0)

export function dateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

export const STATUS = {
  CREATED: { label: 'Creado', tone: 'blue' },
  PAID: { label: 'Pagado', tone: 'violet' },
  SHIPPED: { label: 'Enviado', tone: 'amber' },
  DELIVERED: { label: 'Entregado', tone: 'green' },
  CANCELLED: { label: 'Cancelado', tone: 'red' },
}

export const FLOW = ['CREATED', 'PAID', 'SHIPPED', 'DELIVERED']

// Siguientes estados permitidos desde la interfaz
export function nextStatuses(status) {
  switch (status) {
    case 'CREATED': return ['PAID', 'CANCELLED']
    case 'PAID': return ['SHIPPED', 'CANCELLED']
    case 'SHIPPED': return ['DELIVERED']
    default: return []
  }
}

export const LOW_STOCK = 5
