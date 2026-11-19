import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Icon } from './components/Icon'
import { Sidebar } from './components/Sidebar'
import { DataEntry } from './components/DataEntry'
import { ToastStack } from './components/ToastStack'
import { pages, recommendations } from './data/demo'
import { Overview } from './pages/Overview'
import { Demand } from './pages/Demand'
import { Recommendations } from './pages/Recommendations'
import { ModelPerformance } from './pages/ModelPerformance'
import type { Decision, Decisions, Notification, Page, RecommendationKind, Tone } from './types'
import { api } from './services/api'

function subscribeToLocation(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function currentPage(): Page {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return Object.hasOwn(pages, hash) ? hash as Page : 'resumen'
}

function subscribeToScroll(callback: () => void) {
  window.addEventListener('scroll', callback, { passive: true })
  return () => window.removeEventListener('scroll', callback)
}

function isHeaderScrolled() {
  return window.scrollY > 8
}

function App() {
  const page = useSyncExternalStore(subscribeToLocation, currentPage)
  const headerScrolled = useSyncExternalStore(subscribeToScroll, isHeaderScrolled)
  const [menuOpen, setMenuOpen] = useState(false)
  const [entryOpen, setEntryOpen] = useState(false)
  const [tab, setTab] = useState<RecommendationKind>('compras')
  const [selected, setSelected] = useState<string | null>(null)
  const [decisions, setDecisions] = useState<Decisions>({})
  const [notifications, setNotifications] = useState<Notification[]>([])
  const nextNotification = useRef(0)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const dismissNotification = useCallback((id: number) => setNotifications(items => items.filter(item => item.id !== id)), [])

useEffect(() => {
  api.getOverview()
    .then(data => console.log('Backend ClankerAI:', data))
    .catch(error => console.error('Error de conexión:', error))
}, [])

  useEffect(() => {
    document.title = `ClankerAI · ${pages[page].title}`
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [page])

  function notify(title: string, description: string, tone: Tone) {
    const notification = { id: nextNotification.current++, title, description, tone }
    setNotifications(items => [...items.slice(-2), notification])
  }

  function decide(id: string, decision: Decision) {
    if (decisions[id]) return
    setDecisions(current => ({ ...current, [id]: decision }))
    notify(decision === 'approved' ? 'Recomendación aprobada' : 'Recomendación rechazada', 'La decisión quedó registrada en la simulación.', decision === 'approved' ? 'green' : 'red')
  }

  function reset() {
    setDecisions({})
    setSelected(null)
    notify('Simulación reiniciada', 'Las recomendaciones volvieron a estado pendiente.', 'amber')
  }

  function selectRecommendation(id: string) {
    const recommendation = recommendations.find(item => item.id === id)
    if (!recommendation) return
    setTab(recommendation.kind)
    setSelected(id)
    window.location.hash = '/recs'
  }

  function changeTab(next: RecommendationKind) {
    setTab(next)
    setSelected(null)
  }

  return <>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>Saltar al contenido</a>
    <div className="ambient" aria-hidden="true"><span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" /></div>
    <div className="grain" aria-hidden="true" />
    <div className="shell">
      <Sidebar page={page} open={menuOpen} onClose={closeMenu} />
      <button className="sidebar-entry-button" type="button" onClick={() => { setMenuOpen(false); setEntryOpen(true) }}>
        <span aria-hidden="true">＋</span> Ingresar datos
      </button>
      <main inert={menuOpen}>
        <header className={`topbar${headerScrolled ? ' is-scrolled' : ''}`}>
          <div className="topbar-main">
            <button className="icon-btn menu-btn" aria-label="Abrir menú de navegación" aria-controls="sidebar" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Icon name="menu" /></button>
            <div className="topbar-text"><span className="eyebrow">Panel de inventario</span><h1 key={page} className="swap" id="page-title">{pages[page].title}</h1><p className="sub">{pages[page].description}</p></div>
          </div>
          <div className="topbar-actions"><span className="chip"><span className="chip-dot" aria-hidden="true" />Datos simulados</span></div>
        </header>
        <section key={page} className="screen on" id="main-content" tabIndex={-1} aria-labelledby="page-title">
          {page === 'resumen' && <Overview onSelectRecommendation={selectRecommendation} />}
{page === 'demanda' && <Demand />}          {page === 'recs' && <Recommendations tab={tab} onTabChange={changeTab} selected={selected} decisions={decisions} onDecide={decide} onReset={reset} />}
          {page === 'modelo' && <ModelPerformance />}
        </section>
      </main>
    </div>
    <ToastStack notifications={notifications} onDismiss={dismissNotification} />
    {entryOpen && <DataEntry onClose={() => setEntryOpen(false)} onSaved={tipo => {
      setEntryOpen(false)
      notify('Registro guardado', tipo === 'venta' ? 'Venta registrada en data/manual/ventas_nuevas.csv' : 'Cliente registrado en data/manual/clientes_nuevos.csv', 'green')
    }} />}
  </>
}

export default App
