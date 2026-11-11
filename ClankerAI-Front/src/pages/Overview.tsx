
import { useEffect, useState } from 'react'
import {
  api,
  type DashboardOverview,
  type CategorySummary,
} from '../services/api'
import { MetricCard } from '../components/MetricCard'

export function Overview(_props: {
  onSelectRecommendation: (id: string) => void
}) {
  const [resumen, setResumen] = useState<DashboardOverview | null>(null)
  const [categorias, setCategorias] = useState<CategorySummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.getOverview(),
      api.getCategories(),
    ])
      .then(([datosResumen, datosCategorias]) => {
        setResumen(datosResumen)
        setCategorias(datosCategorias)
      })
      .catch(() => setError('No se pudieron cargar los datos'))
  }, [])

  if (error) return <p>{error}</p>
  if (!resumen) return <p>Cargando resumen...</p>

  const clientesRiesgo =
    (resumen.riesgo_abandono['High'] ?? 0) +
    (resumen.riesgo_abandono['Very High'] ?? 0)

  const dinero = (valor: number) =>
    valor.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })

  return <>
    <div className="grid g4 mb">
      <MetricCard
        title="Clientes registrados"
        value={resumen.total_clientes.toLocaleString()}
        icon="box"
        footer="Total del dataset"
      />

      <MetricCard
        title="Clientes en riesgo"
        value={clientesRiesgo.toLocaleString()}
        icon="warning"
        tone="red"
        footer="Riesgo alto y muy alto"
      />

      <MetricCard
        title="Gasto total"
        value={dinero(resumen.gasto_total_usd)}
        icon="dollar"
        tone="amber"
        footer="Gasto acumulado de clientes"
      />

      <MetricCard
        title="Valor promedio de pedido"
        value={dinero(resumen.ticket_promedio_usd)}
        icon="activity"
        tone="mint"
        footer="Promedio del dataset"
      />
    </div>

    <div className="grid g2">
      <article className="card">
        <div className="card-head">
          <h3>Distribución de riesgo de abandono</h3>
          <span className="mini-tag">Clientes</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nivel de riesgo</th>
                <th>Clientes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(resumen.riesgo_abandono).map(
                ([riesgo, cantidad]) => (
                  <tr key={riesgo}>
                    <td>{riesgo}</td>
                    <td>{cantidad.toLocaleString()}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card">
        <div className="card-head">
          <h3>Categorías preferidas</h3>
          <span className="mini-tag">Clientes</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Clientes</th>
                <th>Porcentaje</th>
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
    </div>
  </>
}