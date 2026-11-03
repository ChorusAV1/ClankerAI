import { inventoryCoverage, priorityAlerts } from '../data/demo'
import { Icon } from '../components/Icon'
import { MetricCard } from '../components/MetricCard'

export function Overview({ onSelectRecommendation }: { onSelectRecommendation: (id: string) => void }) {
  return <>
    <div className="grid g4 mb">
      <MetricCard title="Disponibilidad productos clave" value="96.2%" icon="box" footer={<span className="delta up"><span className="arrow" aria-hidden="true">▲</span>1.4 pts</span>} detail="meta > 95%" />
      <MetricCard title="Productos en riesgo de quiebre" value="12" icon="warning" tone="red" footer={<span className="delta down"><span className="arrow" aria-hidden="true">●</span>Próximos 30 días</span>} />
      <MetricCard title="Valor en sobrestock" value="$48,300" icon="dollar" tone="amber" footer={<span className="delta down"><span className="arrow" aria-hidden="true">●</span>9 productos de baja rotación</span>} />
      <MetricCard title="Error del modelo (MAPE)" value="11.8%" icon="activity" tone="mint" footer={<span className="delta up"><span className="arrow" aria-hidden="true">●</span>Meta &lt; 15%</span>} />
    </div>
    <div className="grid g2">
      <article className="card">
        <div className="card-head"><h3>Alertas prioritarias</h3><span className="mini-tag">4 activas</span></div>
        <p className="card-hint">Selecciona una alerta para ver su recomendación</p>
        {priorityAlerts.map(alert => <button key={alert.recommendationId} className="alert" onClick={() => onSelectRecommendation(alert.recommendationId)}>
          <span className="alert-main"><span className={`dot ${alert.tone}`} aria-hidden="true" /><span className="alert-txt">{alert.text}</span></span>
          <span className={`pill ${alert.tone === 'red' ? 'p-no' : 'p-wait'}`}>{alert.urgency}</span><Icon name="chevron" className="chev" />
        </button>)}
      </article>
      <article className="card">
        <div className="card-head"><h3>Cobertura de inventario por categoría</h3><span className="mini-tag">días</span></div>
        <div className="cov">{inventoryCoverage.map(item => <div key={item.category}>
          <div className="cov-top"><span>{item.category}</span><b>{item.days} d</b></div>
          <div className="bar" role="meter" aria-label={`Cobertura de ${item.category}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.days} aria-valuetext={`${item.days} días`}><i className={`bar-${item.tone}`} style={{ width: `${item.progress}%` }} /></div>
        </div>)}</div>
      </article>
    </div>
  </>
}
