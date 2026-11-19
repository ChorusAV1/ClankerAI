import { useEffect, useState, type FormEvent } from 'react'

const categories = [
  'Grocery', 'Automotive', 'Sports & Fitness', 'Fashion', 'Home & Kitchen',
  'Books', 'Electronics', 'Office Supplies', 'Health & Personal Care',
  'Pet Supplies', 'Toys', 'Beauty',
]

type Props = { onClose: () => void; onSaved: (tipo: string) => void }

export function DataEntry({ onClose, onSaved }: Props) {
  const [tipo, setTipo] = useState<'venta' | 'cliente'>('venta')
  const [categoria, setCategoria] = useState('Grocery')
  const [fecha, setFecha] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [unidades, setUnidades] = useState('1')
  const [monto, setMonto] = useState('0')
  const [cliente, setCliente] = useState('')
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const body = tipo === 'venta'
      ? { fecha, categoria, unidades: Number(unidades), monto_usd: Number(monto), customer_id: cliente.trim() }
      : { customer_id: cliente.trim(), categoria_preferida: categoria, notas: notas.trim() }
    if (tipo === 'cliente' && !cliente.trim()) { setError('Indica el identificador del cliente.'); return }
    if (tipo === 'venta' && (!Number.isInteger(Number(unidades)) || Number(unidades) < 1 || !fecha || Number(monto) < 0)) {
      setError('Comprueba fecha, unidades y monto.'); return
    }
    setEnviando(true)
    try {
      const ruta = tipo === 'venta' ? 'sales' : 'customers'
      const response = await fetch(`http://127.0.0.1:8000/api/data-entry/${ruta}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(typeof result.detail === 'string' ? result.detail : `Error HTTP ${response.status}`)
      }
      onSaved(tipo)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible guardar el registro')
    } finally { setEnviando(false) }
  }

  return <div className="entry-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
    <section className="entry-dialog" role="dialog" aria-modal="true" aria-labelledby="entry-title">
      <header className="entry-head">
        <div><h2 id="entry-title">Ingresar datos</h2><p>Registrar datos nuevos en ClankerAI</p></div>
        <button type="button" className="entry-close" onClick={onClose} aria-label="Cerrar">×</button>
      </header>
      <div className="entry-tabs" role="group" aria-label="Tipo de registro">
        <button type="button" className={tipo === 'venta' ? 'active' : ''} onClick={() => { setTipo('venta'); setError('') }}>Nueva venta</button>
        <button type="button" className={tipo === 'cliente' ? 'active' : ''} onClick={() => { setTipo('cliente'); setError('') }}>Nuevo cliente</button>
      </div>
      <form onSubmit={guardar} className="entry-form">
        <label>Categoría<select value={categoria} onChange={e => setCategoria(e.target.value)}>{categories.map(c => <option value={c} key={c}>{c}</option>)}</select></label>
        {tipo === 'venta' && <div className="entry-grid">
          <label>Fecha<input required type="date" value={fecha} max={new Date().toLocaleDateString('en-CA')} onChange={e => setFecha(e.target.value)} /></label>
          <label>Unidades<input required type="number" min="1" step="1" value={unidades} onChange={e => setUnidades(e.target.value)} /></label>
          <label>Monto (USD)<input required type="number" min="0" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} /></label>
        </div>}
        <label>ID del cliente {tipo === 'venta' && '(opcional)'}<input required={tipo === 'cliente'} maxLength={100} value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Ej. CUST-050001" /></label>
        {tipo === 'cliente' && <label>Notas (opcional)<textarea value={notas} maxLength={500} onChange={e => setNotas(e.target.value)} rows={3}/></label>}
        <p className="entry-hint">Se guardará en <code>data/manual/</code>. No se modifica el Excel original ni se reentrenan los modelos.</p>
        {error && <p role="alert" className="entry-error">{error}</p>}
        <div className="entry-actions">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn ok" disabled={enviando}>{enviando ? 'Guardando...' : 'Guardar registro'}</button>
        </div>
      </form>
    </section>
  </div>
}
