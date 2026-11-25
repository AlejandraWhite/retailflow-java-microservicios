import { useEffect, useMemo, useState } from 'react'
import { ordersApi } from '../api.js'
import { money, dateTime, STATUS, FLOW, nextStatuses } from '../format.js'
import { StatusBadge, Empty } from '../components/ui.jsx'

const FILTERS = ['ALL', 'CREATED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function Orders({ orders, loading, selectedId, onSelect, reload, notify, goNew }) {
  const [filter, setFilter] = useState('ALL')

  const visible = useMemo(
    () => (filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  )

  // Selecciona el primero si no hay ninguno elegido
  useEffect(() => {
    if (!selectedId && orders.length) onSelect(orders[0].id)
  }, [orders, selectedId, onSelect])

  if (!loading && orders.length === 0) {
    return (
      <section className="panel">
        <Empty
          icon="🧾"
          title="Todavía no hay pedidos"
          text="Crea un pedido para ver su recorrido por los microservicios."
          action={<button className="btn btn-primary" onClick={goNew}>Crear pedido</button>}
        />
      </section>
    )
  }

  return (
    <section className="orders-layout">
      <div className="panel orders-list">
        <div className="panel-head">
          <h2>Pedidos</h2>
        </div>
        <div className="chips">
          {FILTERS.map((f) => (
            <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'Todos' : STATUS[f].label}
            </button>
          ))}
        </div>
        <ul className="order-rows">
          {visible.map((o) => (
            <li key={o.id}>
              <button className={`order-row ${o.id === selectedId ? 'active' : ''}`} onClick={() => onSelect(o.id)}>
                <div>
                  <strong>#{o.id} · {o.customerName}</strong>
                  <span className="muted">{(o.items || []).length} producto(s)</span>
                </div>
                <div className="order-row-right">
                  <span className="order-total">{money(o.total)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </button>
            </li>
          ))}
          {visible.length === 0 && <li className="muted pad">Sin pedidos en este estado.</li>}
        </ul>
      </div>

      {selectedId && (
        <OrderDetail key={selectedId} id={selectedId} reload={reload} notify={notify} />
      )}
    </section>
  )
}

function OrderDetail({ id, reload, notify }) {
  const [order, setOrder] = useState(null)
  const [events, setEvents] = useState([])
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [o, ev] = await Promise.all([ordersApi.get(id), ordersApi.events(id).catch(() => [])])
      setOrder(o)
      setEvents(Array.isArray(ev) ? ev : [])
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (value) => {
    setBusy(true)
    try {
      await ordersApi.updateStatus(id, value)
      notify(`Pedido #${id} → ${STATUS[value].label}`)
      await Promise.all([load(), reload()])
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!order) return <div className="panel detail skeleton-panel" />

  const cancelled = order.status === 'CANCELLED'
  const step = FLOW.indexOf(order.status)

  return (
    <div className="panel detail">
      <div className="detail-head">
        <div>
          <span className="muted">Pedido #{order.id}</span>
          <h2>{order.customerName}</h2>
          {order.createdAt && <span className="muted">{dateTime(order.createdAt)}</span>}
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className={`progress ${cancelled ? 'progress-cancelled' : ''}`}>
        {FLOW.map((s, i) => (
          <div key={s} className={`progress-step ${!cancelled && i <= step ? 'done' : ''} ${!cancelled && i === step ? 'current' : ''}`}>
            <span className="progress-dot">{!cancelled && i < step ? '✓' : i + 1}</span>
            <span className="progress-label">{STATUS[s].label}</span>
          </div>
        ))}
      </div>
      {cancelled && <p className="cancel-note">Este pedido fue cancelado.</p>}

      {nextStatuses(order.status).length > 0 && (
        <div className="status-actions">
          {nextStatuses(order.status).map((s) => (
            <button
              key={s}
              disabled={busy}
              className={`btn ${s === 'CANCELLED' ? 'btn-ghost-danger' : 'btn-primary'}`}
              onClick={() => changeStatus(s)}
            >
              {s === 'CANCELLED' ? 'Cancelar pedido' : `Marcar como ${STATUS[s].label.toLowerCase()}`}
            </button>
          ))}
        </div>
      )}

      <table className="items">
        <thead>
          <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          {(order.items || []).map((it, i) => (
            <tr key={i}>
              <td>{it.productName || `Producto #${it.productId}`}</td>
              <td>{it.quantity}</td>
              <td>{money(it.unitPrice)}</td>
              <td>{money(Number(it.unitPrice) * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={3}>Total</td><td>{money(order.total)}</td></tr>
        </tfoot>
      </table>

      <div className="timeline">
        <h3>Historial de eventos <span className="tag">MongoDB</span></h3>
        {events.length === 0 ? (
          <p className="muted">Sin eventos registrados.</p>
        ) : (
          <ol>
            {events.map((ev, i) => {
              const type = ev.status || ev.type || ev.eventType || ev.event
              const when = ev.timestamp || ev.occurredAt || ev.createdAt || ev.date
              return (
                <li key={ev.id || i}>
                  <span className={`tl-dot tl-${STATUS[type]?.tone || 'gray'}`} />
                  <div>
                    <strong>{STATUS[type]?.label || type || 'Evento'}</strong>
                    {ev.description && <span className="tl-desc">{ev.description}</span>}
                    {ev.message && <span className="tl-desc">{ev.message}</span>}
                    {when && <span className="muted tl-when">{dateTime(when)}</span>}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
