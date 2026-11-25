// Cliente HTTP de RetailFlow. Todas las rutas pasan por /api (proxy de Vite o nginx).
const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const body = await res.json()
      message = body.message || body.error || body.detail || message
      if (body.errors && typeof body.errors === 'object') {
        message = Object.values(body.errors).join(' · ')
      }
    } catch {
      /* respuesta sin JSON */
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const productsApi = {
  list: () => request('/products'),
  create: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
}

export const ordersApi = {
  list: () => request('/orders'),
  get: (id) => request(`/orders/${id}`),
  create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, value) => request(`/orders/${id}/status?value=${value}`, { method: 'PUT' }),
  events: (id) => request(`/orders/${id}/events`),
}
