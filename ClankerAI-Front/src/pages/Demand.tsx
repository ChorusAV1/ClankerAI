import { categories, categoryDemand, formatNumber } from '../data/demo'
import type { Category } from '../types'
import { MetricCard } from '../components/MetricCard'
import { LineChart } from '../components/LineChart'

interface DemandProps {
  category: Category
  horizon: number
  onCategoryChange: (category: Category) => void
  onHorizonChange: (horizon: number) => void
}

export function Demand({ category, horizon, onCategoryChange, onHorizonChange }: DemandProps) {
  const data = categoryDemand[category]
  const forecast = data.forecast.slice(0, horizon)
  const total = forecast.reduce((sum, value) => sum + value, 0)
  const coverage = Math.round(data.stock / (total / (horizon * 7)))

  return <>
    <div className="filters">
      <label htmlFor="category">Categoría<select id="category" value={category} onChange={event => onCategoryChange(event.target.value as Category)}>{categories.map(item => <option key={item}>{item}</option>)}</select></label>
      <label htmlFor="horizon">Horizonte<select id="horizon" value={horizon} onChange={event => onHorizonChange(Number(event.target.value))}>{[4, 8, 12].map(weeks => <option key={weeks} value={weeks}>{weeks} semanas</option>)}</select></label>
    </div>
    <div className="grid g4 mb" aria-live="polite" aria-atomic="true">
      <MetricCard title={`Demanda prevista (${horizon} sem)`} value={formatNumber(total)} icon="trend" footer="unidades" detail={category} />
      <MetricCard title="Stock actual" value={formatNumber(data.stock)} icon="box" tone="mint" footer="unidades" />
      <MetricCard title="Cobertura estimada" value={`${coverage} d`} icon="clock" tone={coverage < 30 ? 'red' : 'green'} valueTone={coverage < 30 ? 'red' : 'green'} footer={coverage < 30 ? 'Riesgo de quiebre' : 'Nivel saludable'} />
    </div>
    <article className="card">
      <div className="card-head"><h3>Unidades por semana: histórico vs pronóstico</h3><span className="mini-tag">unidades / semana</span></div>
      <LineChart key={`${category}-${horizon}`} label={`Demanda histórica y pronóstico simulado para ${category} a ${horizon} semanas`} count={data.history.length + horizon} junction={data.history.length - 1} series={[
        { name: 'Histórico', values: data.history, color: '#8a9a94' },
        { name: 'Pronóstico IA', values: [data.history.at(-1) ?? 0, ...forecast], color: '#34d399', offset: data.history.length - 1, area: true },
      ]} />
    </article>
  </>
}
