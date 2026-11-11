import { MetricCard } from '../components/MetricCard'
import { useEffect, useState } from 'react'
import { api, type ModelMetrics } from '../services/api'

export function ModelPerformance() {

const [metrics, setMetrics] = useState<Record<string, ModelMetrics> | null>(null)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  api.getModelPerformance()
    .then(setMetrics)
    .catch(() => setError('No se pudieron cargar las métricas'))
}, [])

if (error) return <p>{error}</p>
if (!metrics) return <p>Cargando métricas...</p>

const modelo = metrics['Random Forest']

  
return <>
  <div className="grid g4 mb">
    <MetricCard
      title="Accuracy"
      value={`${(modelo.accuracy * 100).toFixed(2)}%`}
      icon="activity"
      valueTone="green"
      footer="Precisión en datos de prueba"
    />

    <MetricCard
      title="Modelo"
      value="Random Forest"
      icon="chip"
      tone="mint"
      compact
      footer="Clasificación de riesgo de abandono"
    />

    <MetricCard
      title="F1 Macro"
      value={modelo.f1_macro.toFixed(4)}
      icon="database"
      tone="amber"
      footer="Evaluación de las cinco clases"
    />
  </div>

  <div className="grid g2">
    <article className="card">
      <div className="card-head">
        <h3>Comparación de modelos</h3>
        <span className="mini-tag">Accuracy</span>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Modelo</th>
              <th>Accuracy</th>
              <th>F1 Macro</th>
            </tr>
          </thead>

          <tbody>
            {Object.entries(metrics).map(([nombre, datos]) => (
              <tr key={nombre}>
                <td>{nombre}</td>
                <td>{(datos.accuracy * 100).toFixed(2)}%</td>
                <td>{datos.f1_macro.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>

    <article className="card">
      <div className="card-head">
        <h3>Información del entrenamiento</h3>
      </div>

      <div className="table-wrap">
        <table className="table">
          <tbody>
            <tr>
              <th>Registros totales</th>
              <td>50,000</td>
            </tr>
            <tr>
              <th>Entrenamiento</th>
              <td>40,000</td>
            </tr>
            <tr>
              <th>Prueba</th>
              <td>10,000</td>
            </tr>
            <tr>
              <th>Accuracy entrenamiento</th>
              <td>{(modelo.train_accuracy * 100).toFixed(2)}%</td>
            </tr>
            <tr>
              <th>Tiempo de entrenamiento</th>
              <td>{modelo.tiempo_segundos.toFixed(2)} s</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </div>
</>

}
