import { useMemo, useState } from 'react'
import { productsApi } from '../api.js'
import { money, LOW_STOCK } from '../format.js'
import { Modal, Empty } from '../components/ui.jsx'

const EMPTY_FORM = { name: '', description: '', price: '', stock: '' }

export default function Products({ products, loading, reload, notify }) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | product
  const [toDelete, setToDelete] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...products].sort((a, b) => a.id - b.id)
    if (!q) return list
    return list.filter((p) =>
      `${p.name} ${p.description || ''}`.toLowerCase().includes(q)
    )
  }, [products, query])

  const confirmDelete = async () => {
    try {
      await productsApi.remove(toDelete.id)
      notify(`«${toDelete.name}» eliminado`)
      setToDelete(null)
      reload()
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Catálogo</h2>
          <p className="muted">Datos de <code>product-service</code> · PostgreSQL</p>
        </div>
        <div className="panel-actions">
          <input
            className="search"
            placeholder="Buscar producto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setEditing('new')}>＋ Nuevo producto</button>
        </div>
      </div>

      {loading ? (
        <div className="grid">{[1, 2, 3, 4].map((i) => <div key={i} className="card skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <Empty
          icon="🛍️"
          title={query ? 'Sin resultados' : 'Aún no hay productos'}
          text={query ? 'Prueba con otra búsqueda.' : 'Crea el primero para poder armar pedidos.'}
          action={!query && <button className="btn btn-primary" onClick={() => setEditing('new')}>Crear producto</button>}
        />
      ) : (
        <div className="grid">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onEdit={() => setEditing(p)} onDelete={() => setToDelete(p)} />
          ))}
        </div>
      )}

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => { notify(msg); setEditing(null); reload() }}
          notify={notify}
        />
      )}

      {toDelete && (
        <Modal title="Eliminar producto" onClose={() => setToDelete(null)}>
          <p>¿Seguro que quieres eliminar <strong>{toDelete.name}</strong>? Esta acción no se puede deshacer.</p>
          <div className="modal-foot">
            <button className="btn" onClick={() => setToDelete(null)}>Cancelar</button>
            <button className="btn btn-danger" onClick={confirmDelete}>Eliminar</button>
          </div>
        </Modal>
      )}
    </section>
  )
}

function ProductCard({ product, onEdit, onDelete }) {
  const stock = Number(product.stock)
  const level = stock === 0 ? 'out' : stock <= LOW_STOCK ? 'low' : 'ok'
  const initials = product.name.slice(0, 2).toUpperCase()
  const hue = (product.id * 47) % 360

  return (
    <article className="card product">
      <div className="product-top">
        <div className="product-avatar" style={{ '--hue': hue }}>{initials}</div>
        <span className="product-id">#{product.id}</span>
      </div>
      <h3>{product.name}</h3>
      <p className="product-desc">{product.description || 'Sin descripción'}</p>
      <div className="product-bottom">
        <strong className="price">{money(product.price)}</strong>
        <span className={`stock stock-${level}`}>
          {level === 'out' ? 'Agotado' : `${stock} en stock`}
        </span>
      </div>
      <div className="card-actions">
        <button className="btn btn-sm" onClick={onEdit}>Editar</button>
        <button className="btn btn-sm btn-ghost-danger" onClick={onDelete}>Eliminar</button>
      </div>
    </article>
  )
}

function ProductForm({ product, onClose, onSaved, notify }) {
  const [form, setForm] = useState(
    product
      ? { name: product.name, description: product.description || '', price: product.price, stock: product.stock }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
    }
    try {
      if (product) {
        await productsApi.update(product.id, payload)
        onSaved(`«${payload.name}» actualizado`)
      } else {
        await productsApi.create(payload)
        onSaved(`«${payload.name}» creado`)
      }
    } catch (err) {
      notify(err.message, 'error')
      setSaving(false)
    }
  }

  return (
    <Modal title={product ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label>
          Nombre
          <input required value={form.name} onChange={set('name')} placeholder="Camiseta básica" autoFocus />
        </label>
        <label>
          Descripción
          <textarea rows={2} value={form.description} onChange={set('description')} placeholder="Algodón 100%" />
        </label>
        <div className="form-row">
          <label>
            Precio (COP)
            <input required type="number" min="0" step="100" value={form.price} onChange={set('price')} placeholder="49900" />
          </label>
          <label>
            Stock
            <input required type="number" min="0" step="1" value={form.stock} onChange={set('stock')} placeholder="20" />
          </label>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  )
}
