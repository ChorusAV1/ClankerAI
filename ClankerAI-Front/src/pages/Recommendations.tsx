
import { useEffect, useState } from 'react'
import type {
  Decision,
  Decisions,
  RecommendationKind,
} from '../types'
import {
  api,
  type DashboardOverview,
  type CategorySummary,
} from '../services/api'

interface RecommendationsProps {
  tab: RecommendationKind
  onTabChange: (tab: RecommendationKind) => void
  decisions: Decisions
  selected: string | null
  onDecide: (id: string, decision: Decision) => void
  onReset: () => void
}

export function Recommendations({
  tab,
  onTabChange,
  decisions,
  selected,
  onDecide,
  onReset,
}: RecommendationsProps) {
  const [categorias, setCategorias] = useState<CategorySummary[]>([])
  const [resumen, setResumen] = useState<DashboardOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.getCategories(), api.getOverview()])
      .then(([cats, datos]) => {
        setCategorias(cats)
        setResumen(datos)
      })
      .catch(() => setError('Error al cargar recomendaciones'))
  }, [])

  if (error) return <p>{error}</p>
  if (!resumen) return <p>Cargando recomendaciones...</p>

  const compras = [...categorias]
    .sort((a, b) => b.clientes - a.clientes)
    .slice(0, 6)
    .map(item => ({
      id: `compra-${item.categoria}`,
      nombre: item.categoria,
      cantidad: item.clientes,
      porcentaje: `${item.porcentaje}%`,
      sugerencia: 'Evaluar surtido',
    }))

  const descuentos = ['Very High', 'High', 'Medium']
    .map(riesgo => ({
      id: `retencion-${riesgo}`,
      nombre: riesgo,
      cantidad: resumen.riesgo_abandono[riesgo] ?? 0,
      porcentaje: `${(
        (resumen.riesgo_abandono[riesgo] ?? 0) /
        resumen.total_clientes * 100
      ).toFixed(2)}%`,
      sugerencia: 'Evaluar campaña de retención',
    }))

  const filas = tab === 'compras' ? compras : descuentos
  const completo = filas.every(item => decisions[item.id])

  return <>
    <div className="recs-head">
      <div className="tabs" role="tablist">
        <button
          className={`tab${tab === 'compras' ? ' on' : ''}`}
          role="tab"
          aria-selected={tab === 'compras'}
          onClick={() => onTabChange('compras')}
        >
          Oportunidades comerciales
        </button>

        <button
          className={`tab${tab === 'descuentos' ? ' on' : ''}`}
          role="tab"
          aria-selected={tab === 'descuentos'}
          onClick={() => onTabChange('descuentos')}
        >
          Retención de clientes
        </button>
      </div>

      <span className="recs-note">
        Sugerencias exploratorias basadas en el dataset
      </span>
    </div>

    {completo && (
      <div className="done-banner">
        <b>Revisaste todas las recomendaciones</b>
        <button className="btn ghost" onClick={onReset}>
          Reiniciar decisiones
        </button>
      </div>
    )}

    <article className="card">
      <div className="card-head">
        <h3>
          {tab === 'compras'
            ? 'Categorías con mayor interés'
            : 'Grupos prioritarios para retención'}
        </h3>
        <span className="mini-tag">Datos reales</span>
      </div>

      <div className="table-wrap">
        <table className="table recs-table">
          <thead>
            <tr>
              <th>
                {tab === 'compras' ? 'Categoría' : 'Nivel de riesgo'}
              </th>
              <th>Clientes</th>
              <th>Participación</th>
              <th>Sugerencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filas.map(item => {
              const decision = decisions[item.id]

              return (
                <tr
                  key={item.id}
                  className={
                    selected === item.id ? 'selected-row' : undefined
                  }
                >
                  <td>{item.nombre}</td>
                  <td>{item.cantidad.toLocaleString()}</td>
                  <td>{item.porcentaje}</td>
                  <td>{item.sugerencia}</td>

                  <td>
                    <span className={`pill ${
                      decision === 'approved'
                        ? 'p-ok'
                        : decision === 'rejected'
                          ? 'p-no'
                          : 'p-wait'
                    }`}>
                      {decision === 'approved'
                        ? 'Aprobada'
                        : decision === 'rejected'
                          ? 'Rechazada'
                          : 'Pendiente'}
                    </span>
                  </td>

                  <td className="td-actions">
                    {!decision ? (
                      <span className="action-buttons">
                        <button
                          className="btn ok"
                          onClick={() => onDecide(item.id, 'approved')}
                        >
                          Aprobar
                        </button>
                        <button
                          className="btn no"
                          onClick={() => onDecide(item.id, 'rejected')}
                        >
                          Rechazar
                        </button>
                      </span>
                    ) : (
                      <span className="muted-note">Registrada</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </article>
  </>
}