import { modelDemo } from '../data/demo'
import { LineChart } from '../components/LineChart'
import { MetricCard } from '../components/MetricCard'

export function ModelPerformance() {
  return <>
    <div className="grid g4 mb">
      <MetricCard title="MAPE global" value={`${modelDemo.mape}%`} icon="activity" valueTone="green" footer="Meta < 15%" />
      <MetricCard title="Modelo" value={modelDemo.name} icon="chip" tone="mint" compact footer="Regresión de demanda" />
      <MetricCard title="Datos de entrenamiento" value="2 años" icon="database" tone="amber" footer="Ventas e inventario semanales" />
    </div>
    <div className="grid g2">
      <article className="card">
        <div className="card-head"><h3>Real vs predicho (últimas 12 semanas)</h3><span className="mini-tag">unidades</span></div>
        <LineChart compact label="Comparación simulada de demanda real y predicha en las últimas 12 semanas" count={12} series={[
          { name: 'Real', values: modelDemo.actual, color: '#8a9a94' },
          { name: 'Predicho', values: modelDemo.predicted, color: '#34d399', area: true },
        ]} />
      </article>
      <article className="card">
        <div className="card-head"><h3>Error por categoría</h3><span className="mini-tag">MAPE</span></div>
        <div className="table-wrap"><table className="table">
          <caption className="sr-only">Error simulado del modelo por categoría</caption>
          <thead><tr><th scope="col">Categoría</th><th scope="col">MAPE</th><th scope="col">Estado</th></tr></thead>
          <tbody>{modelDemo.categoryErrors.map(item => <tr key={item.category}>
            <td data-label="Categoría">{item.category}</td><td data-label="MAPE"><span className="num">{item.mape}%</span></td><td data-label="Estado"><span className={`pill ${item.reliable ? 'p-ok' : 'p-wait'}`}>{item.reliable ? 'Confiable' : 'Revisar'}</span></td>
          </tr>)}</tbody>
        </table></div>
      </article>
    </div>
  </>
}
