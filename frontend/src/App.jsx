import { BrowserRouter, NavLink, Routes, Route } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import SearchView from './pages/SearchView'
import WishlistView from './pages/WishlistView'
import NotFound from './pages/NotFound'
import { GameRefreshProvider } from './context/GameRefreshContext'

const NAV_ITEMS = [
  { path: '/', label: 'Biblioteca' },
  { path: '/search', label: 'Buscar' },
  { path: '/wishlist', label: 'Wishlist' },
]

export default function App() {
  return (
    <GameRefreshProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0b0d12] text-white font-sans">
          <header className="border-b border-gray-800 bg-[#0b0d12]/95 sticky top-0 z-10 backdrop-blur-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#ff4655] font-bold">Game Manager</p>
                <h1 className="text-xl font-black uppercase tracking-wider text-white">Mi colección</h1>
              </div>

              <nav className="flex flex-wrap gap-3">
                {NAV_ITEMS.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                        isActive
                          ? 'bg-[#ff4655] text-white shadow-md'
                          : 'bg-[#11141b] border border-gray-800 text-gray-400 hover:border-[#ff4655] hover:text-[#ff4655]'
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </GameRefreshProvider>
  )
}
