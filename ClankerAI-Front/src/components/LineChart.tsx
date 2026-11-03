import { useId, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { formatNumber } from '../data/demo'

interface Series {
  name: string
  values: number[]
  color: string
  offset?: number
  area?: boolean
}

interface LineChartProps {
  series: Series[]
  count: number
  label: string
  junction?: number
  compact?: boolean
}

type Point = [number, number]

// Cubic interpolation follows the reference chart, including its shared forecast junction.
function curve(points: Point[]) {
  if (!points.length) return ''
  let path = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const previous = points[i - 1] ?? points[i]
    const start = points[i]
    const end = points[i + 1]
    const next = points[i + 2] ?? end
    path += ` C${start[0] + (end[0] - previous[0]) * .18},${start[1] + (end[1] - previous[1]) * .18} ${end[0] - (next[0] - start[0]) * .18},${end[1] - (next[1] - start[1]) * .18} ${end[0]},${end[1]}`
  }
  return path
}

export function LineChart({ series, count, label, junction, compact }: LineChartProps) {
  const gradientId = useId().replace(/:/g, '')
  const [active, setActive] = useState<number | null>(null)
  const width = 640, height = 280, left = 46, right = 16, top = 24, bottom = 34
  const baseline = height - bottom
  const maximum = Math.max(1, ...series.flatMap(item => item.values)) * 1.14
  const x = (index: number) => left + index * (width - left - right) / Math.max(count - 1, 1)
  const y = (value: number) => baseline - value / maximum * (height - top - bottom)
  const every = Math.max(1, Math.ceil(count / 7))
  const activeIndex = active === null ? null : Math.min(active, count - 1)
  const activeValues = activeIndex === null ? [] : series.flatMap(item => {
    const value = item.values[activeIndex - (item.offset ?? 0)]
    return value === undefined ? [] : [{ ...item, value }]
  })

  function handlePointer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const position = (event.clientX - bounds.left) / bounds.width * width
    setActive(Math.max(0, Math.min(count - 1, Math.round((position - left) / (width - left - right) * (count - 1)))))
  }

  function handleKey(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === 'Escape') setActive(null)
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    if (event.key === 'Home') setActive(0)
    else if (event.key === 'End') setActive(count - 1)
    else setActive(Math.max(0, Math.min(count - 1, (activeIndex ?? 0) + (event.key === 'ArrowRight' ? 1 : -1))))
  }

  return (
    <>
      <div className={`chart-wrap${compact ? ' chart-compact' : ''}`}>
        <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label}. Usa las flechas para explorar las semanas.`} tabIndex={0} onPointerMove={handlePointer} onPointerLeave={() => setActive(null)} onFocus={() => setActive(0)} onBlur={() => setActive(null)} onKeyDown={handleKey}>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity=".26" /><stop offset="70%" stopColor="#34d399" stopOpacity=".05" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" /></linearGradient></defs>
          {Array.from({ length: 5 }, (_, index) => {
            const position = top + index * (baseline - top) / 4
            return <g key={index}><line className="chart-grid" x1={left} x2={width - right} y1={position} y2={position} /><text className="axis" x={left - 8} y={position + 3} textAnchor="end">{Math.round(maximum * (1 - index / 4))}</text></g>
          })}
          {Array.from({ length: Math.ceil(count / every) }, (_, index) => index * every).map(index => <text key={index} className="axis" x={x(index)} y={baseline + 18} textAnchor="middle">S{index + 1}</text>)}
          {series.map(item => {
            const points: Point[] = item.values.map((value, index) => [x(index + (item.offset ?? 0)), y(value)])
            const path = curve(points)
            const first = points[0]
            const last = points[points.length - 1]
            if (!first || !last) return null
            return <g key={item.name}>
              {item.area && <path className="area" d={`${path} L${last[0]},${baseline} L${first[0]},${baseline} Z`} fill={`url(#${gradientId})`} />}
              <path className="chart-line" pathLength="1" d={path} stroke={item.color} />
              <circle className="dot-end" cx={last[0]} cy={last[1]} r="3.2" fill={item.color} />
            </g>
          })}
          {junction !== undefined && <g>
            <line className="junction-line" x1={x(junction)} x2={x(junction)} y1={top} y2={baseline} />
            <text className="now" x={x(junction)} y={top - 8} textAnchor="middle">HOY</text>
            <circle cx={x(junction)} cy={y(series[0].values.at(-1) ?? 0)} r="3.4" fill="#34d399" stroke="#0b0f0e" strokeWidth="2" />
          </g>}
          {activeIndex !== null && <g>
            <line className="h-line" x1={x(activeIndex)} x2={x(activeIndex)} y1={top} y2={baseline} />
            {activeValues.map(item => <circle key={item.name} className="h-dot" cx={x(activeIndex)} cy={y(item.value)} r="4" fill={item.color} />)}
          </g>}
        </svg>
        {activeIndex !== null && <div className="chart-tip on" style={{ left: `${Math.max(24, Math.min(76, x(activeIndex) / width * 100))}%`, top: '12%' }}>
          <b>Semana {activeIndex + 1}</b>
          {activeValues.map(item => <div key={item.name} className="tip-row"><i className="tip-dot" style={{ background: item.color }} />{item.name}<strong>{formatNumber(item.value)}</strong></div>)}
        </div>}
      </div>
      <div className="legend">{series.map(item => <span key={item.name} className="lg"><i style={{ background: item.color }} />{item.name}</span>)}</div>
      <span className="sr-only" role="status">{activeIndex !== null ? `Semana ${activeIndex + 1}. ${activeValues.map(item => `${item.name}: ${item.value} unidades`).join('. ')}` : ''}</span>
    </>
  )
}
