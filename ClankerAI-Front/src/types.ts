export type Page = 'resumen' | 'demanda' | 'recs' | 'modelo'
export type Category = 'Electrónica' | 'Hogar' | 'Ropa' | 'Juguetes'
export type RecommendationKind = 'compras' | 'descuentos'
export type Decision = 'approved' | 'rejected'
export type Decisions = Partial<Record<string, Decision>>
export type Tone = 'green' | 'mint' | 'red' | 'amber'

export interface CategoryDemand {
  history: number[]
  forecast: number[]
  stock: number
}

interface BaseRecommendation {
  id: string
  product: string
  category: Category
  stock: number
}

export interface PurchaseRecommendation extends BaseRecommendation {
  kind: 'compras'
  demand: number
  quantity: number
  urgency: 'Alta' | 'Media'
}

export interface DiscountRecommendation extends BaseRecommendation {
  kind: 'descuentos'
  coverage: string
  discount: number
  releasedCapital: number
}

export type Recommendation = PurchaseRecommendation | DiscountRecommendation

export interface Notification {
  id: number
  title: string
  description: string
  tone: Tone
}
