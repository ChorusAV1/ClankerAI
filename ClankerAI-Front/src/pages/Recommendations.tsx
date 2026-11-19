import { useEffect, useState } from 'react'
import type { Decision, Decisions, RecommendationKind } from '../types'
import {
  api,
  type DashboardOverview,
  type CategorySummary,
  type DemandForecast,
} from '../services/api'

interface RecommendationsProps {
  tab: RecommendationKind
  onTabChange: (tab: RecommendationKind) => void
  decisions: Decisions
  selected: string | null
  onDecide: (id: string, decision: Decision) => void
  onReset: () => void
}

interface RecommendationRow {
  id: string
  nombre: string
  cantidad: number
  porcentaje: string
  sugerencia: string
  totalPrevisto?: number
  tendencia?: string
}

function recomendarCompra(datos: DemandForecast): { tendencia: string; sugerencia: string } {
  const valores = datos.pronostico.map(p => p.unidades)
  if (valores.length < 4) {
    return { tendencia: 'Sin datos suficientes', sugerencia: 'Revisar demanda prevista' }
  }
  const primeras = valores.slice(0, 2).reduce((a, b) => a + b, 0) / 2
  const ultimas = valores.slice(-2).reduce((a, b) => a + b, 0) / 2
  const cambio = primeras > 0 ? (ultimas - primeras) / primeras : 0

  // Regla heurística de negocio, NO una segunda predicción del modelo.
  if (cambio > 0.05) return {
    tendencia: 'Creciente',
    sugerencia: 'Evaluar mayor abastecimiento',
  }
  if (cambio < -0.05) return {
    tendencia: 'Decreciente',
    sugerencia: 'Revisar compras futuras',
  }
  return { tendencia: 'Estable', sugerencia: 'Mantener y monitorear surtido' }
}

export function Recommendations({
  tab, onTabChange, decisions, selected, onDecide, onReset,
}: RecommendationsProps) {
  const [categorias, setCategorias] = useState<CategorySummary[]>([])
  const [resumen, setResumen] = useState<DashboardOverview | null>(null)
  const [pronosticos, setPronosticos] = useState<Record<string, DemandForecast>>({})
  const [cargandoDemanda, setCargandoDemanda] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDemanda, setErrorDemanda] = useState(false)

  useEffect(() => {
    let activo = true
    Promise.all([api.getCategories(), api.getOverview()])
      .then(async ([cats, datos]) => {
        if (!activo) return
        setCategorias(cats)
        setResumen(datos)
        // Promesas independientes: si falla una categoría, las demás siguen visibles.
        const resultados = await Promise.allSettled(
          cats.map(cat => api.getDemandForecast(cat.categoria, 4))
        )
        if (!activo) return
        const mapa: Record<string, DemandForecast> = {}
        resultados.forEach((resultado) => {
          if (resultado.status === 'fulfilled') {
            mapa[resultado.value.categoria] = resultado.value
          }
        })
        setPronosticos(mapa)
        setErrorDemanda(resultados.some(r => r.status === 'rejected'))
        setCargandoDemanda(false)
      })
      .catch(() => {
        if (activo) {
          setError('No se pudieron cargar las recomendaciones')
          setCargandoDemanda(false)
        }
      })
    return () => { activo = false }
  }, [])

  if (error) return <p>{error}</p>
  if (!resumen) return <p>Cargando recomendaciones...</p>

  const compras: RecommendationRow[] = categorias
    .filter(cat => pronosticos[cat.categoria])
    .map(cat => {
      const datos = pronosticos[cat.categoria]
      const recomendacion = recomendarCompra(datos)
      return {
        id: `compra-${cat.categoria}`,
        nombre: cat.categoria,
        cantidad: cat.clientes,
        porcentaje: `${cat.porcentaje}%`,
        totalPrevisto: datos.total_previsto,
        ...recomendacion,
      }
    })
    .sort((a, b) => (b.totalPrevisto ?? 0) - (a.totalPrevisto ?? 0))
    .slice(0, 6)

  const acciones: Record<string, string> = {
    'Very High': 'Contacto prioritario y oferta personalizada',
    'High': 'Campaña de recuperación con incentivos',
    'Medium': 'Campaña de fidelización y seguimiento',
  }
  const retencion: RecommendationRow[] = ['Very High', 'High', 'Medium'].map(riesgo => {
    const cantidad = resumen.riesgo_abandono[riesgo] ?? 0
    return {
      id: `retencion-${riesgo}`,
      nombre: riesgo,
      cantidad,
      porcentaje: `${resumen.total_clientes ? (cantidad / resumen.total_clientes * 100).toFixed(2) : '0.00'}%`,
      sugerencia: acciones[riesgo],
    }
  })

  const filas = tab === 'compras' ? compras : retencion
  const completo = filas.length > 0 && filas.every(item => !!decisions[item.id])

  return <>
    <div className="recs-head">
      <div className="tabs" role="tablist">
        <button
          className={`tab${tab === 'compras' ? ' on' : ''}`}
          style={{ color: tab === 'compras' ? '#f5f7f6' : '#a8b7b2' }}
          role="tab"
          aria-selected={tab === 'compras'}
          onClick={() => onTabChange('compras')}
        >
          Oportunidades comerciales
        </button>
        <button
          className={`tab${tab === 'descuentos' ? ' on' : ''}`}
          style={{ color: tab === 'descuentos' ? '#f5f7f6' : '#a8b7b2' }}
          role="tab"
          aria-selected={tab === 'descuentos'}
          onClick={() => onTabChange('descuentos')}
        >
          Retención de clientes
        </button>
      </div>
      <span className="recs-note">
        {tab === 'compras' ? 'Recomendaciones basadas en demanda simulada a 12 semanas' : 'Acciones sugeridas según el riesgo de abandono del dataset'}
      </span>
    </div>

    {completo && <div className="done-banner">
      <b>Revisaste todas las recomendaciones visibles</b>
      <button className="btn ghost" onClick={onReset}>Reiniciar decisiones</button>
    </div>}

    <article className="card">
      <div className="card-head">
        <h3>{tab === 'compras' ? 'Categorías con mayor demanda prevista' : 'Grupos prioritarios para retención'}</h3>
        <span className="mini-tag">{tab === 'compras' ? 'PREDICCIONES SINTÉTICAS' : 'DATOS DEL DATASET'}</span>
      </div>
      {tab === 'compras' && cargandoDemanda && <p style={{ padding: '12px 18px' }}>Cargando pronósticos...</p>}
      {tab === 'compras' && errorDemanda && <p style={{ padding: '12px 18px', color: '#f3c46a' }}>No se pudieron cargar todas las categorías pronosticadas.</p>}
      {tab === 'compras' && !cargandoDemanda && compras.length === 0 && <p style={{ padding: '12px 18px' }}>No hay predicciones disponibles. Comprueba /api/demand-forecast.</p>}
      {(tab !== 'compras' || !cargandoDemanda) && filas.length > 0 && <div className="table-wrap">
        <table className="table recs-table">
          <thead>
            <tr>
              <th>{tab === 'compras' ? 'Categoría' : 'Nivel de riesgo'}</th>
              <th>{tab === 'compras' ? 'Unidades previstas (4 sem.)' : 'Clientes'}</th>
              <th>{tab === 'compras' ? 'Tendencia' : 'Participación'}</th>
              <th>Sugerencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(item => {
              const decision = decisions[item.id]
              return <tr key={item.id} className={selected === item.id ? 'selected-row' : undefined}>
                <td>{item.nombre}</td>
                <td>{(tab === 'compras' ? item.totalPrevisto ?? 0 : item.cantidad).toLocaleString()}</td>
                <td>{tab === 'compras' ? item.tendencia : item.porcentaje}</td>
                <td>{item.sugerencia}</td>
                <td><span className={`pill ${decision === 'approved' ? 'p-ok' : decision === 'rejected' ? 'p-no' : 'p-wait'}`}>
                  {decision === 'approved' ? 'Aprobada' : decision === 'rejected' ? 'Rechazada' : 'Pendiente'}
                </span></td>
                <td className="td-actions">{!decision ? <span className="action-buttons">
                  <button className="btn ok" onClick={() => onDecide(item.id, 'approved')}>Aprobar</button>
                  <button className="btn no" onClick={() => onDecide(item.id, 'rejected')}>Rechazar</button>
                </span> : <span className="muted-note">Registrada</span>}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>}
    </article>
  </>
}
