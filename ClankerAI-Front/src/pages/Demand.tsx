import { useEffect, useState } from 'react'
import { api, type CategorySummary, type DemandForecast } from '../services/api'
import { MetricCard } from '../components/MetricCard'

function DemandChart({ data }: { data: DemandForecast }) {
  const historical = data.historico
  const future = data.pronostico
  const all = [...historical, ...future]
  if (all.length < 2) return <p>Sin suficientes datos para graficar.</p>

  const width = 900
  const height = 290
  const left = 58
  const right = 20
  const top = 20
  const bottom = 44
  const values = all.map(point => point.unidades)
  const low = Math.max(0, Math.min(...values) * 0.9)
  const high = Math.max(...values) * 1.1 || 1
  const x = (index: number) => left + (index / (all.length - 1)) * (width - left - right)
  const y = (value: number) => top + ((high - value) / (high - low || 1)) * (height - top - bottom)
  const path = (points: typeof all, offset = 0) => points.map((point, i) => `${i === 0 ? 'M' : 'L'}${x(i + offset).toFixed(1)} ${y(point.unidades).toFixed(1)}`).join(' ')
  const split = historical.length - 1

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfica de demanda histórica y pronosticada" style={{ width: '100%', minWidth: 550 }}>
        {[0, 1, 2, 3, 4].map(n => {
          const value = low + (high - low) * (4 - n) / 4
          return <g key={n}>
            <line x1={left} x2={width - right} y1={y(value)} y2={y(value)} stroke="currentColor" opacity={0.12} />
            <text x={left - 8} y={y(value) + 4} textAnchor="end" fill="currentColor" opacity={0.7} fontSize={11}>{Math.round(value).toLocaleString()}</text>
          </g>
        })}
        <line x1={x(split)} x2={x(split)} y1={top} y2={height - bottom} stroke="#e4ab46" strokeDasharray="5 5" opacity={0.8} />
        <path d={path(historical)} fill="none" stroke="#71c9e9" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <path d={path([historical[historical.length - 1], ...future], split)} fill="none" stroke="#4bd6aa" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {all.map((point, index) => index % 3 === 0 || index === all.length - 1 ?
          <text key={index} x={x(index)} y={height - 16} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.75}>{point.semana_inicio.slice(5)}</text> : null)}
      </svg>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12, marginTop: 6 }}>
        <span style={{ color: '#71c9e9' }}>● Historial simulado</span>
        <span style={{ color: '#4bd6aa' }}>● Predicción del modelo</span>
        <span style={{ color: '#e4ab46' }}>┆ Inicio del pronóstico</span>
      </div>
    </div>
  )
}

export function Demand() {
  const [categorias, setCategorias] = useState<CategorySummary[]>([])
  const [seleccionada, setSeleccionada] = useState('')
  const [semanas, setSemanas] = useState(12)
  const [datos, setDatos] = useState<DemandForecast | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.getCategories()
      .then(items => {
        setCategorias(items)
        if (items.length > 0) setSeleccionada(items[0].categoria)
        else setError('No hay categorías disponibles')
      })
      .catch(() => setError('No se pudieron cargar las categorías'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (!seleccionada) return
    let activo = true
    setDatos(null)
    setError(null)
    api.getDemandForecast(seleccionada, semanas)
      .then(resultado => { if (activo) setDatos(resultado) })
      .catch(() => { if (activo) setError('No se pudo cargar la predicción. Revisa /api/demand-forecast en FastAPI.') })
    return () => { activo = false }
  }, [seleccionada, semanas])

  if (cargando) return <p>Cargando categorías...</p>
  const categoria = categorias.find(item => item.categoria === seleccionada) ?? categorias[0]

  return <>
    <div className="filters">
      <label htmlFor="category">Categoría
        <select id="category" value={seleccionada} onChange={event => setSeleccionada(event.target.value)}>
          {categorias.map(item => <option key={item.categoria} value={item.categoria}>{item.categoria}</option>)}
        </select>
      </label>
      <label htmlFor="weeks">Horizonte
        <select id="weeks" value={semanas} onChange={event => setSemanas(Number(event.target.value))}>
          <option value={4}>4 semanas</option>
          <option value={8}>8 semanas</option>
          <option value={12}>12 semanas</option>
        </select>
      </label>
    </div>

    <div className="grid g4 mb">
      <MetricCard title="Clientes interesados" value={categoria?.clientes.toLocaleString() ?? '—'} icon="trend" footer="Preferencia principal" />
      <MetricCard title="Participación" value={`${categoria?.porcentaje ?? 0}%`} icon="activity" tone="mint" footer="Del total de clientes" />
      <MetricCard title="Demanda prevista" value={datos ? datos.total_previsto.toLocaleString() : '—'} icon="box" tone="amber" footer={`Unidades simuladas · ${semanas} semanas`} />
    </div>

    {error && <article className="card"><p role="alert">{error}</p></article>}
    {!error && !datos && <p>Cargando pronóstico...</p>}
    {datos && <>
      <article className="card mb">
        <div className="card-head">
          <h3>Demanda semanal: {datos.categoria}</h3>
          <span className="mini-tag">Datos simulados</span>
        </div>
        <DemandChart data={datos} />
        <p style={{ opacity: 0.7, fontSize: 12, marginTop: 14 }}>
          Se muestran las últimas 12 semanas históricas y las próximas {semanas} semanas pronosticadas. Las cifras provienen de un historial sintético, no de ventas verificadas.
        </p>
      </article>
      <article className="card mb">
        <div className="card-head"><h3>Pronóstico por semana</h3><span className="mini-tag">Random Forest Regressor</span></div>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Semana de inicio</th><th>Unidades previstas</th></tr></thead>
          <tbody>{datos.pronostico.map(item => <tr key={item.semana_inicio}><td>{item.semana_inicio}</td><td>{item.unidades.toLocaleString()}</td></tr>)}</tbody>
        </table></div>
        {datos.metricas && <p style={{ opacity: 0.7, fontSize: 12, marginTop: 12 }}>
          Evaluación de 12 semanas: WAPE {datos.metricas.wape_porcentaje}% · Referencia promedio móvil {datos.metricas.wape_baseline_4s_porcentaje}%. El modelo todavía no supera esta referencia.
        </p>}
      </article>
    </>}
    <article className="card">
      <div className="card-head"><h3>Preferencias de compra por categoría</h3><span className="mini-tag">Datos del dataset</span></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Categoría</th><th>Clientes</th><th>Participación</th></tr></thead>
        <tbody>{categorias.map(item => <tr key={item.categoria}><td>{item.categoria}</td><td>{item.clientes.toLocaleString()}</td><td>{item.porcentaje}%</td></tr>)}</tbody>
      </table></div>
    </article>
  </>
}