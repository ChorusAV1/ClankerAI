import type { SVGProps } from 'react'

const paths = {
  grid: <><rect x="3" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" /></>,
  trend: <><path d="M3 17.5 8.5 12l4 3.8L21 7" /><path d="M15.5 7H21v5.5" /></>,
  sparkles: <><path d="m12 3.5 1.7 4.8 4.8 1.7-4.8 1.7-1.7 4.8-1.7-4.8L5.5 10l4.8-1.7Z" /><path d="m18.4 15.4.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6Z" /></>,
  activity: <path d="M3 12h3l2.2-6 3.6 12 2.4-8 1.6 2H21" />,
  box: <><path d="M21 8.5v7a2 2 0 0 1-1.05 1.76l-7 3.9a2 2 0 0 1-1.9 0l-7-3.9A2 2 0 0 1 3 15.5v-7a2 2 0 0 1 1.05-1.76l7-3.9a2 2 0 0 1 1.9 0l7 3.9A2 2 0 0 1 21 8.5Z" /><path d="m3.3 7.2 8.7 4.9 8.7-4.9M12 21v-8.9" /></>,
  warning: <><path d="m10.3 3.9-8.1 13.8a1.9 1.9 0 0 0 1.7 2.9h16.2a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z" /><path d="M12 9v4M12 16.8h.01" /></>,
  dollar: <><path d="M12 5v14" /><path d="M15.5 9.3c0-1.5-1.6-2.6-3.5-2.6s-3.5 1.1-3.5 2.6 1.6 2.6 3.5 2.6 3.5 1.1 3.5 2.6-1.6 2.6-3.5 2.6-3.5-1.1-3.5-2.6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  chip: <><rect x="7" y="7" width="10" height="10" rx="2.5" /><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" /></>,
  database: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  check: <path d="m5 12.5 4.2 4.2L19 7" />,
  reset: <><path d="M20 11a8 8 0 1 0-2.3 6.3" /><path d="M20 4v7h-7" /></>,
}

export type IconName = keyof typeof paths

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>
}

export function BrandMark() {
  return (
    <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true" focusable="false">
      <defs><linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6ee7b7" /><stop offset="52%" stopColor="#34d399" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs>
      <rect x="1" y="1" width="38" height="38" rx="12" fill="url(#brand-gradient)" stroke="rgba(255,255,255,.45)" strokeWidth=".8" />
      <path d="M26.2 14.2a7.6 7.6 0 1 0 0 11.6" fill="none" stroke="#04130d" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="27.6" cy="13.2" r="1.9" fill="#04130d" />
    </svg>
  )
}
