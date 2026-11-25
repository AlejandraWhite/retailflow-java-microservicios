import { useMemo, useState } from 'react'
import { ordersApi } from '../api.js'
import { money } from '../format.js'
import { Empty } from '../components/ui.jsx'

export default function NewOrder({ products, notify, onCreated }) {
  const [customerName, setCustomerName] = useState('')
  const [cart, setCart] = useState({}) // { productId: quantity }
  const [sending, setSending] = useState(false)

  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ product: byId[id], qty }))
    .filter((l) => l.product && l.qty > 0)

  const estimated = lines.reduce((s, l) => s + Number(l.product.price) * l.qty, 0)
  const units = lines.reduce((s, l) => s + l.qty, 0)

  const change = (product, delta) => {
    setCart((c) => {
      const next = Math.max(0, Math.min(Number(product.stock), (c[product.id] || 0) + delta))
      const copy = { ...c }
      if (next === 0) delete copy[product.id]
      else copy[product.id] = next
      return copy
    })
  }

  const submit = async () => {
    setSending(true)
    try {
      const order = await ordersApi.create({
        customerName: customerName.trim(),
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
      })
      notify(`Pedido #${order.id} creado · ${money(order.total)}`)
      setCart({})
      setCustomerName('')
      onCreated(order)
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setSending(false)
    }
  }

  const available = products.filter((p) => Number(p.stock) > 0)

  return (
    <section className="order-layout">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Nuevo pedido</h2>
            <p className="muted">Elige productos; <code>order-service</code> valida el stock y calcula el total</p>
          </div>
        </div>

        {available.length === 0 ? (
          <Empty icon="📦" title="No hay productos con stock" text="Agrega productos en el catálogo para poder vender." />
        ) : (
          <div className="pick-list">
            {available.map((p) => {
              const qty = cart[p.id] || 0
              return (
                <div key={p.id} className={`pick ${qty ? 'picked' : ''}`}>
                  <div className="pick-info">
                    <strong>{p.name}</strong>
                    <span className="muted">{money(p.price)} · {p.stock} disponibles</span>
                  </div>
                  <div className="stepper">
                    <button onClick={() => change(p, -1)} disabled={!qty} aria-label="Quitar">−</button>
                    <span>{qty}</span>
                    <button onClick={() => change(p, 1)} disabled={qty >= p.stock} aria-label="Agregar">+</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <aside className="panel cart">
        <h3>Resumen</h3>
        <label className="form">
          Cliente
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre del cliente" />
        </label>

        {lines.length === 0 ? (
          <p className="muted cart-empty">El carrito está vacío.</p>
        ) : (
          <ul className="cart-lines">
            {lines.map((l) => (
              <li key={l.product.id}>
                <span>{l.qty} × {l.product.name}</span>
                <span>{money(l.product.price * l.qty)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="cart-total">
          <span>Total estimado <small>({units} uds.)</small></span>
          <strong>{money(estimated)}</strong>
        </div>

        <button
          className="btn btn-primary btn-block"
          disabled={!customerName.trim() || lines.length === 0 || sending}
          onClick={submit}
        >
          {sending ? 'Creando pedido…' : 'Confirmar pedido'}
        </button>

        <div className="flow-hint">
          <span>Al confirmar:</span>
          <ol>
            <li>Se guarda en PostgreSQL</li>
            <li>Evento <code>CREATED</code> en MongoDB</li>
            <li>Mensaje a SQS → Lambda → factura en S3</li>
          </ol>
        </div>
      </aside>
    </section>
  )
}
