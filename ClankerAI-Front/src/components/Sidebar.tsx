import { useEffect, useRef } from 'react'
import type { Page } from '../types'
import { pages } from '../data/demo'
import { BrandMark, Icon } from './Icon'
import type { IconName } from './Icon'

const navigation: { page: Page; icon: IconName }[] = [
  { page: 'resumen', icon: 'grid' },
  { page: 'demanda', icon: 'trend' },
  { page: 'recs', icon: 'sparkles' },
  { page: 'modelo', icon: 'activity' },
]

interface SidebarProps {
  page: Page
  pending: number
  open: boolean
  onClose: () => void
}

export function Sidebar({ page, pending, open, onClose }: SidebarProps) {
  const sidebar = useRef<HTMLElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    const desktop = window.matchMedia('(min-width: 981px)')
    function handleDesktop() { if (desktop.matches) onClose() }
    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const items = sidebar.current?.querySelectorAll<HTMLElement>('a[href], button')
      if (!items?.length) return
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    desktop.addEventListener('change', handleDesktop)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKey)
      desktop.removeEventListener('change', handleDesktop)
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  return (
    <>
      <aside ref={sidebar} id="sidebar" className={open ? 'sidebar sidebar-open' : 'sidebar'} role={open ? 'dialog' : undefined} aria-modal={open || undefined} aria-label="Navegación principal">
        <div className="brand">
          <span className="logo-slot"><BrandMark /></span>
          <div className="brand-txt"><b>Clanker<span>AI</span></b><small>Inventario asistido</small></div>
          <button ref={closeButton} className="icon-btn close-btn" aria-label="Cerrar menú" onClick={onClose}><Icon name="close" /></button>
        </div>
        <nav className="nav-list" aria-label="Secciones del panel">
          <span className="nav-ind" aria-hidden="true" style={{ transform: `translateY(${navigation.findIndex(item => item.page === page) * 46}px)` }} />
          {navigation.map(item => <a key={item.page} href={`#/${item.page}`} className={`nav${page === item.page ? ' on' : ''}`} aria-current={page === item.page ? 'page' : undefined} onClick={onClose}>
            <Icon name={item.icon} /><span className="nav-label">{pages[item.page].title}</span>
            {item.page === 'recs' && <span className={`badge${pending === 0 ? ' zero' : ''}`} aria-label={`${pending} recomendaciones pendientes`}>{pending}</span>}
          </a>)}
        </nav>
        <div className="side-foot"><span className="avatar" aria-hidden="true">EC</span><div><b>Encargado de compras</b><small>Tienda demo · Prototipo v0.1</small></div></div>
      </aside>
      <div className={`backdrop${open ? ' on' : ''}`} onClick={onClose} aria-hidden="true" />
    </>
  )
}
