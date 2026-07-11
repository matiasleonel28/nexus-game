import { useState, useEffect } from 'react'
import { BrowserRouter, NavLink, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import SearchView from './pages/SearchView'
import WishlistView from './pages/WishlistView'
import HunterView from './pages/HunterView'
import AlertsView from './pages/AlertsView'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import NotFound from './pages/NotFound'
import { GameRefreshProvider } from './context/GameRefreshContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getAlerts } from './api/hunter';
import UserOnboarding from './components/UserOnboarding';

const NAV_ITEMS = [
  { path: '/', label: 'Biblioteca' },
  { path: '/search', label: 'Buscar' },
  { path: '/wishlist', label: 'Wishlist' },
  { path: '/hunter', label: 'Hunter' },
  { path: '/alertas', label: 'Alertas' },
]

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--ink)] text-[var(--muted)] text-sm">
        Verificando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      {/* Rutas protegidas que usan el layout Shell */}
      <Route path="/" element={
        <ProtectedRoute>
          <GameRefreshProvider>
            <Shell />
          </GameRefreshProvider>
        </ProtectedRoute>
      }>
        {/* Estas son las rutas que se renderizarán dentro de <Outlet /> en Shell */}
        <Route index element={<Dashboard />} />
        <Route path="search" element={<SearchView />} />
        <Route path="wishlist" element={<WishlistView />} />
        <Route path="hunter" element={<HunterView />} />
        <Route path="alertas" element={<AlertsView />} />
      </Route>
      {/* Ruta de Not Found fuera del layout protegido */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

function Shell() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  useEffect(() => {
    let active = true
    getAlerts(true)
      .then(data => { if (active) setUnreadAlerts(Array.isArray(data) ? data.length : 0) })
      .catch(() => {})
    return () => { active = false }
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[var(--ink)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--ink)]/90 sticky top-0 z-20 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[var(--text)]">NEXUS</span>
            <span className="font-num text-[var(--accent)] text-sm">/</span>
            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Biblioteca · Ofertas</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <nav className="flex flex-wrap gap-1.5">
              {NAV_ITEMS.map(item => (
                <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => `relative rounded px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${ isActive ? 'bg-[var(--accent)] text-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--accent)]' }`}>
                  {item.label}
                  {item.path === '/alertas' && unreadAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[var(--danger)] text-white text-[10px] font-bold font-num px-1">
                      {unreadAlerts > 99 ? '99+' : unreadAlerts}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Separador + email + logout */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[var(--line)]">
              {user?.email && (
                <span className="hidden md:block text-[10px] text-[var(--muted)] max-w-[120px] truncate" title={user.email}>
                  {user.email}
                </span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                className="rounded px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main key={location.pathname} className="page-enter relative">
        <UserOnboarding />
        {/* Outlet renderizará la ruta hija que coincida (Dashboard, Search, etc.) */}
        <Outlet />
      </main>
    </div>
  )
}
