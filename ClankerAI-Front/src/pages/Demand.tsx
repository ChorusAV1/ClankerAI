
import { useEffect, useState } from 'react'
import { api, type CategorySummary } from '../services/api'
import { MetricCard } from '../components/MetricCard'

export function Demand() {
  const [categorias, setCategorias] = useState<CategorySummary[]>([])
  const [seleccionada, setSeleccionada] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getCategories()
      .then(datos => {
        setCategorias(datos)
        if (datos.length > 0) {
          setSeleccionada(datos[0].categoria)
        }
      })
      .catch(() => setError('No se pudieron cargar las categorías'))
  }, [])

  if (error) return <p>{error}</p>
  if (!categorias.length) return <p>Cargando categorías...</p>

  const categoria = categorias.find(
    item => item.categoria === seleccionada
  ) ?? categorias[0]

  return <>
    <div className="filters">
      <label htmlFor="category">
        Categoría
        <select
          id="category"
          value={seleccionada}
          onChange={event => setSeleccionada(event.target.value)}
        >
          {categorias.map(item => (
            <option key={item.categoria} value={item.categoria}>
              {item.categoria}
            </option>
          ))}
        </select>
      </label>
    </div>

    <div className="grid g4 mb">
      <MetricCard
        title="Clientes interesados"
        value={categoria.clientes.toLocaleString()}
        icon="trend"
        footer="Preferencia principal"
      />

      <MetricCard
        title="Participación"
        value={`${categoria.porcentaje}%`}
        icon="activity"
        tone="mint"
        footer="Del total de clientes"
      />

      <MetricCard
        title="Categorías analizadas"
        value={categorias.length.toString()}
        icon="box"
        tone="amber"
        footer="Dataset de e-commerce"
      />
    </div>

    <article className="card">
      <div className="card-head">
        <h3>Preferencias de compra por categoría</h3>
        <span className="mini-tag">Datos reales</span>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Clientes</th>
              <th>Participación</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map(item => (
              <tr key={item.categoria}>
                <td>{item.categoria}</td>
                <td>{item.clientes.toLocaleString()}</td>
                <td>{item.porcentaje}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  </>
}
