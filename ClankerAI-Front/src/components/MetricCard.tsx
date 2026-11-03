import type { ReactNode } from 'react'
import type { Tone } from '../types'
import { Icon } from './Icon'
import type { IconName } from './Icon'

interface MetricCardProps {
  title: string
  value: ReactNode
  icon: IconName
  tone?: Tone
  valueTone?: Tone
  footer: ReactNode
  detail?: string
  compact?: boolean
}

export function MetricCard({ title, value, icon, tone = 'green', valueTone, footer, detail, compact }: MetricCardProps) {
  return (
    <article className={`card kpi tint-${tone}`}>
      <div className="kpi-head"><h3>{title}</h3><span className="kpi-ic"><Icon name={icon} /></span></div>
      <b className={`kpi-val${valueTone ? ` text-${valueTone}` : ''}${compact ? ' kpi-val-compact' : ''}`}>{value}</b>
      <div className="kpi-foot"><span>{footer}</span>{detail && <small>{detail}</small>}</div>
    </article>
  )
}
