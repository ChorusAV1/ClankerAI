import type { Category, CategoryDemand, Page, Recommendation } from '../types'

// UI fixtures from References/index.html. These are not results from the CSV or a trained model.
export const pages: Record<Page, { title: string; description: string }> = {
  resumen: { title: 'Resumen', description: 'Estado general del inventario y alertas del día' },
  demanda: { title: 'Predicción de demanda', description: 'Explora la demanda prevista por categoría' },
  recs: { title: 'Recomendaciones', description: 'Revisa y decide sobre las sugerencias de la IA' },
  modelo: { title: 'Desempeño del modelo', description: 'Qué tan confiable es la predicción' },
}

export const categoryDemand: Record<Category, CategoryDemand> = {
  Electrónica: {
    history: [120, 130, 125, 140, 150, 145, 160, 170, 165, 180, 190, 185],
    forecast: [200, 215, 230, 250, 240, 225, 210, 205, 200, 195, 190, 185],
    stock: 320,
  },
  Hogar: {
    history: [80, 85, 90, 88, 95, 100, 110, 120, 130, 140, 150, 160],
    forecast: [170, 180, 185, 175, 160, 150, 140, 135, 130, 128, 125, 120],
    stock: 610,
  },
  Ropa: {
    history: [200, 190, 170, 160, 150, 140, 130, 125, 120, 115, 110, 105],
    forecast: [100, 98, 95, 100, 110, 125, 140, 155, 170, 185, 200, 210],
    stock: 1400,
  },
  Juguetes: {
    history: [60, 62, 65, 70, 75, 90, 110, 140, 180, 230, 280, 330],
    forecast: [340, 320, 260, 200, 150, 120, 100, 90, 85, 80, 78, 75],
    stock: 520,
  },
}

export const categories = Object.keys(categoryDemand) as Category[]

export const recommendations: Recommendation[] = [
  { id: 'purchase-headphones', kind: 'compras', product: 'Audífonos BT Pro', category: 'Electrónica', stock: 45, demand: 210, quantity: 180, urgency: 'Alta' },
  { id: 'purchase-fan', kind: 'compras', product: 'Ventilador de torre', category: 'Hogar', stock: 60, demand: 240, quantity: 200, urgency: 'Alta' },
  { id: 'purchase-blocks', kind: 'compras', product: 'Set de bloques 500 pzs', category: 'Juguetes', stock: 120, demand: 300, quantity: 220, urgency: 'Media' },
  { id: 'purchase-charger', kind: 'compras', product: 'Cargador USB-C 65W', category: 'Electrónica', stock: 90, demand: 160, quantity: 90, urgency: 'Media' },
  { id: 'discount-lamp', kind: 'descuentos', product: 'Lámpara de escritorio', category: 'Hogar', stock: 410, coverage: '3.4 meses', discount: 15, releasedCapital: 6200 },
  { id: 'discount-jacket', kind: 'descuentos', product: 'Chamarra ligera', category: 'Ropa', stock: 680, coverage: '5.1 meses', discount: 25, releasedCapital: 11400 },
  { id: 'discount-shirt', kind: 'descuentos', product: 'Playera básica pack 3', category: 'Ropa', stock: 720, coverage: '4.6 meses', discount: 20, releasedCapital: 8900 },
]

export const priorityAlerts = [
  { recommendationId: 'purchase-headphones', text: 'Audífonos BT Pro: quiebre estimado en 6 días', urgency: 'Alta', tone: 'red' },
  { recommendationId: 'purchase-fan', text: 'Ventilador de torre: pico de demanda por temporada', urgency: 'Alta', tone: 'red' },
  { recommendationId: 'discount-lamp', text: 'Lámpara de escritorio: sobrestock 3.4 meses', urgency: 'Media', tone: 'amber' },
  { recommendationId: 'discount-jacket', text: 'Chamarra ligera: baja rotación, aplicar descuento', urgency: 'Media', tone: 'amber' },
] as const

export const inventoryCoverage = [
  { category: 'Electrónica', days: 18, progress: 30, tone: 'red' },
  { category: 'Hogar', days: 52, progress: 85, tone: 'green' },
  { category: 'Ropa', days: 95, progress: 100, tone: 'amber' },
  { category: 'Juguetes', days: 41, progress: 68, tone: 'green' },
] as const

export const modelDemo = {
  name: 'Random Forest',
  mape: 11.8,
  actual: [160, 170, 165, 180, 190, 185, 200, 215, 210, 225, 240, 235],
  predicted: [152, 176, 160, 172, 198, 178, 190, 225, 200, 215, 252, 228],
  categoryErrors: [
    { category: 'Electrónica', mape: 9.7, reliable: true },
    { category: 'Hogar', mape: 11.2, reliable: true },
    { category: 'Ropa', mape: 13.9, reliable: false },
    { category: 'Juguetes', mape: 12.4, reliable: true },
  ],
}

export const formatNumber = (value: number) => value.toLocaleString('en-US')
export const formatMoney = (value: number) => `$${formatNumber(value)}`
