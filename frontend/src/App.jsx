import { BrowserRouter, NavLink, Routes, Route } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import SearchView from './pages/SearchView'
import WishlistView from './pages/WishlistView'
import HunterView from './pages/HunterView'
import AlertsView from './pages/AlertsView'
import NotFound from './pages/NotFound'
import { GameRefreshProvider } from './context/GameRefreshContext'

const NAV_ITEMS = [
  { path: '/', label: 'Biblioteca' },
  { path: '/search', label: 'Buscar' },
  { path: '/wishlist', label: 'Wishlist' },
  { path: '/hunter', label: 'Hunter' },
  { path: '/alertas', label: 'Alertas' },
]

export default function App() {
  return (
    <GameRefreshProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[var(--ink)] text-[var(--text)]">
          <header className="border-b border-[var(--line)] bg-[var(--ink)]/90 sticky top-0 z-20 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-[var(--text)]">NEXUS</span>
                <span className="font-num text-[var(--accent)] text-sm">/</span>
                <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Biblioteca · Ofertas</span>
              </div>

              <nav className="flex flex-wrap gap-1.5">
                {NAV_ITEMS.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `rounded px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                        isActive
                          ? 'bg-[var(--accent)] text-[var(--ink)]'
                          : 'text-[var(--muted)] hover:text-[var(--accent)]'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </header>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<SearchView />} />
            <Route path="/wishlist" element={<WishlistView />} />
            <Route path="/hunter" element={<HunterView />} />
            <Route path="/alertas" element={<AlertsView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </GameRefreshProvider>
  )
}
