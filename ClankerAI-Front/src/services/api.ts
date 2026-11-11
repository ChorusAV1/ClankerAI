
const API_URL = 'http://127.0.0.1:8000/api'

async function getData<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`)

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export interface DashboardOverview {
  total_clientes: number
  gasto_total_usd: number
  ticket_promedio_usd: number
  riesgo_abandono: Record<string, number>
}

export interface CategorySummary {
  categoria: string
  clientes: number
  porcentaje: number
}

export interface ModelMetrics {
  accuracy: number
  f1_macro: number
  train_accuracy: number
  tiempo_segundos: number
  archivo: string
}

export const api = {
  getOverview: () =>
    getData<DashboardOverview>('/overview'),

  getCategories: () =>
    getData<CategorySummary[]>('/categories'),

  getModelPerformance: () =>
    getData<Record<string, ModelMetrics>>('/model/performance'),
}
