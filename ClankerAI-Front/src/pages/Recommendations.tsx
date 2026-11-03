import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { Decision, Decisions, RecommendationKind } from '../types'
import { formatMoney, recommendations } from '../data/demo'
import { Icon } from '../components/Icon'

interface RecommendationsProps {
  tab: RecommendationKind
  onTabChange: (tab: RecommendationKind) => void
  decisions: Decisions
  selected: string | null
  onDecide: (id: string, decision: Decision) => void
  onReset: () => void
}

export function Recommendations({ tab, onTabChange, decisions, selected, onDecide, onReset }: RecommendationsProps) {
  const selectedRow = useRef<HTMLTableRowElement>(null)
  const rows = recommendations.filter(item => item.kind === tab)
  const complete = recommendations.every(item => decisions[item.id])
  const columns = tab === 'compras'
    ? ['Producto', 'Categoría', 'Stock', 'Demanda 30d', 'Compra sugerida', 'Urgencia', 'Estado', 'Acciones']
    : ['Producto', 'Categoría', 'Stock', 'Cobertura', 'Descuento sugerido', 'Capital liberado', 'Estado', 'Acciones']

  useEffect(() => {
    if (!selected) return
    const frame = requestAnimationFrame(() => {
      selectedRow.current?.focus({ preventScroll: true })
      selectedRow.current?.scrollIntoView({ block: 'center', behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [selected])

  function handleTabKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 'compras' : event.key === 'End' ? 'descuentos' : tab === 'compras' ? 'descuentos' : 'compras'
    onTabChange(next)
    event.currentTarget.querySelector<HTMLButtonElement>(`#tab-${next}`)?.focus()
  }

  return <>
    <div className="recs-head">
      <div className="tabs" role="tablist" aria-label="Tipo de recomendación" onKeyDown={handleTabKey}>
        <span className={`tab-ind${tab === 'descuentos' ? ' tab-ind-right' : ''}`} aria-hidden="true" />
        <button className={`tab${tab === 'compras' ? ' on' : ''}`} id="tab-compras" role="tab" aria-selected={tab === 'compras'} aria-controls="recommendation-panel" tabIndex={tab === 'compras' ? 0 : -1} onClick={() => onTabChange('compras')}>Compras sugeridas</button>
        <button className={`tab${tab === 'descuentos' ? ' on' : ''}`} id="tab-descuentos" role="tab" aria-selected={tab === 'descuentos'} aria-controls="recommendation-panel" tabIndex={tab === 'descuentos' ? 0 : -1} onClick={() => onTabChange('descuentos')}>Descuentos sugeridos</button>
      </div>
      <span className="recs-note"><Icon name="sparkles" />Decisiones simuladas, no afectan inventario real</span>
    </div>
    {complete && <div className="done-banner" role="status">
      <span className="done-ic"><Icon name="check" /></span>
      <div><b>Revisaste todas las recomendaciones</b><small>Puedes reiniciar la simulación para volver a evaluarlas.</small></div>
      <button className="btn ghost" onClick={onReset}>Reiniciar demo</button>
    </div>}
    <article className="card" id="recommendation-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
      <div className="table-wrap">
        <table className="table recs-table">
          <caption className="sr-only">{tab === 'compras' ? 'Compras sugeridas' : 'Descuentos sugeridos'} de demostración</caption>
          <thead><tr>{columns.map(column => <th key={column} scope="col" className={column === 'Acciones' ? 'th-actions' : undefined}>{column === 'Acciones' ? <span className="sr-only">Acciones</span> : column}</th>)}</tr></thead>
          <tbody>{rows.map(item => {
            const decision = decisions[item.id]
            return <tr key={item.id} ref={item.id === selected ? selectedRow : undefined} tabIndex={item.id === selected ? -1 : undefined} className={item.id === selected ? 'selected-row' : undefined}>
              <td data-label="Producto">{item.product}</td><td data-label="Categoría">{item.category}</td><td data-label="Stock"><span className="num">{item.stock}</span></td>
              {item.kind === 'compras' ? <>
                <td data-label="Demanda 30d"><span className="num">{item.demand}</span></td><td data-label="Compra sugerida">+{item.quantity} uds</td><td data-label="Urgencia">{item.urgency}</td>
              </> : <>
                <td data-label="Cobertura">{item.coverage}</td><td data-label="Descuento sugerido">{item.discount}%</td><td data-label="Capital liberado"><span className="num">{formatMoney(item.releasedCapital)}</span></td>
              </>}
              <td data-label="Estado"><span className={`pill ${decision === 'approved' ? 'p-ok' : decision === 'rejected' ? 'p-no' : 'p-wait'}`}>
                {!decision && <i className="pdot" aria-hidden="true" />}{decision === 'approved' ? 'Aprobada' : decision === 'rejected' ? 'Rechazada' : 'Pendiente'}
              </span></td>
              <td className="td-actions" data-label="Acciones">{decision ? <span className="muted-note">Registrada</span> : <span className="action-buttons">
                <button className="btn ok" aria-label={`Aprobar ${item.product}`} onClick={() => onDecide(item.id, 'approved')}>Aprobar</button>
                <button className="btn no" aria-label={`Rechazar ${item.product}`} onClick={() => onDecide(item.id, 'rejected')}>Rechazar</button>
              </span>}</td>
            </tr>
          })}</tbody>
        </table>
      </div>
    </article>
  </>
}
