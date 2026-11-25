import { useCallback, useEffect, useMemo, useState } from 'react'
import { productsApi, ordersApi } from './api.js'
import { money, LOW_STOCK } from './format.js'
import { Stat, Toasts } from './components/ui.jsx'
import Products from './pages/Products.jsx'
import NewOrder from './pages/NewOrder.jsx'
import Orders from './pages/Orders.jsx'

const TABS = [
  { id: 'products', label: 'Catálogo', icon: '▦' },
  { id: 'new-order', label: 'Nuevo pedido', icon: '＋' },
  { id: 'orders', label: 'Pedidos', icon: '☰' },
]

export default function App() {
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState({ products: null, orders: null })
  const [toasts, setToasts] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const data = await productsApi.list()
      setProducts(Array.isArray(data) ? data : [])
      setHealth((h) => ({ ...h, products: true }))
    } catch (e) {
      setHealth((h) => ({ ...h, products: false }))
    }
  }, [])

  const loadOrders = useCallback(async () => {
    try {
      const data = await ordersApi.list()
      setOrders(Array.isArray(data) ? [...data].sort((a, b) => b.id - a.id) : [])
      setHealth((h) => ({ ...h, orders: true }))
    } catch (e) {
      setHealth((h) => ({ ...h, orders: false }))
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([loadProducts(), loadOrders()])
    setLoading(false)
  }, [loadProducts, loadOrders])

  useEffect(() => { refreshAll() }, [refreshAll])

  const stats = useMemo(() => {
    const revenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + Number(o.total || 0), 0)
    const low = products.filter((p) => Number(p.stock) <= LOW_STOCK).length
    const active = orders.filter((o) => ['CREATED', 'PAID', 'SHIPPED'].includes(o.status)).length
    return { revenue, low, active }
  }, [orders, products])

  const openOrder = (id) => {
    setSelectedOrderId(id)
    setTab('orders')
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
              <path d="M8 10h16l-2.2 11H10.2z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
              <path d="M12 10a4 4 0 0 1 8 0" fill="none" stroke="currentColor" strokeWidth="2.6" />
            </svg>
          </div>
          <div>
            <strong>RetailFlow</strong>
            <span>Gestión de pedidos</span>
          </div>
        </div>

        <nav className="nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-item ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              {t.label}
              {t.id === 'orders' && stats.active > 0 && <span className="nav-count">{stats.active}</span>}
            </button>
          ))}
        </nav>

        <div className="services">
          <span className="services-title">Microservicios</span>
          <ServiceDot name="product-service" port="8081" ok={health.products} />
          <ServiceDot name="order-service" port="8082" ok={health.orders} />
          <button className="link-btn" onClick={refreshAll}>↻ Reintentar conexión</button>
        </div>
      </aside>

      <main className="main">
        <header className="stats">
          <Stat label="Ingresos" value={money(stats.revenue)} hint="Pedidos no cancelados" accent />
          <Stat label="Pedidos" value={orders.length} hint={`${stats.active} en curso`} />
          <Stat label="Productos" value={products.length} hint="En catálogo" />
          <Stat label="Stock bajo" value={stats.low} hint={`≤ ${LOW_STOCK} unidades`} />
        </header>

        {health.products === false && health.orders === false && !loading && (
          <div className="alert">
            No hay conexión con el backend. Revisa que los contenedores estén arriba con
            <code>docker compose up -d</code> y pulsa «Reintentar conexión».
          </div>
        )}

        {tab === 'products' && (
          <Products products={products} loading={loading} reload={loadProducts} notify={notify} />
        )}
        {tab === 'new-order' && (
          <NewOrder
            products={products}
            notify={notify}
            onCreated={async (order) => {
              await Promise.all([loadOrders(), loadProducts()])
              openOrder(order.id)
            }}
          />
        )}
        {tab === 'orders' && (
          <Orders
            orders={orders}
            loading={loading}
            selectedId={selectedOrderId}
            onSelect={setSelectedOrderId}
            reload={loadOrders}
            notify={notify}
            goNew={() => setTab('new-order')}
          />
        )}
      </main>

      <Toasts items={toasts} />
    </div>
  )
}

function ServiceDot({ name, port, ok }) {
  const state = ok === null ? 'pending' : ok ? 'up' : 'down'
  return (
    <div className="service">
      <span className={`dot dot-${state}`} />
      <span className="service-name">{name}</span>
      <span className="service-port">:{port}</span>
    </div>
  )
}
