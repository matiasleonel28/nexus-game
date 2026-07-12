import { useState, useEffect, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { getBacklog, updateGame, deleteGame, getRecommendation } from '../api/games'
import GameCard from '../components/GameCard'
import ConfirmDialog from '../components/ConfirmDialog'
import StatsChart from '../components/StatsChart'
import { useGameRefresh } from '../context/GameRefreshContext'
import { useAuth } from '../context/AuthContext'
import { LIBRARY_STATUSES, PLATFORMS } from '../constants'
import { useToast } from '../context/ToastContext'

const STATUS_TABS = [{ value: 'todos', label: 'Todos' }, ...LIBRARY_STATUSES]

export default function Dashboard() {
  const [games, setGames]     = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  
  const { user } = useAuth()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterDuration, setFilterDuration] = useState("all")
  const [filterCoop, setFilterCoop] = useState(false)
  const [filterCrossplay, setFilterCrossplay] = useState(false)
  const [sortOption, setSortOption] = useState("duration_asc")
  const [statusFilter, setStatusFilter] = useState("todos")

  const [actioning, setActioning] = useState([])
  const [pendingDelete, setPendingDelete] = useState(null)   // juego a confirmar borrado
  const [deleting, setDeleting] = useState(false)

  const { backlogVersion } = useGameRefresh()
  const { addToast } = useToast()

  // silent = recarga los datos sin mostrar el spinner de pantalla completa
  // (evita el "parpadeo" al editar estado/plataforma en el lugar)
  const fetchBacklog = useCallback(async (signal = { current: true }, { silent = false } = {}) => {
    if (!signal.current) return
    if (!silent) setLoading(true)
    setError(null)
    try {
      const params = { sort: sortOption }
      if (statusFilter !== 'todos') params.status = statusFilter
      if (filterCoop) params.coop = true
      if (filterCrossplay) params.crossplay = true
      const data = await getBacklog(params)
      if (!signal.current) return
      setGames(data)
    } catch (err) {
      if (signal.current) setError(err)
    } finally {
      if (signal.current && !silent) setLoading(false)
    }
  }, [sortOption, statusFilter, filterCoop, filterCrossplay])

  useEffect(() => {
    const signal = { current: true }
    void Promise.resolve().then(() => {
      if (signal.current) void fetchBacklog(signal)
    })
    return () => { signal.current = false }
  }, [fetchBacklog, backlogVersion])

  useEffect(() => {
    let active = true
    getRecommendation()
      .then(data => { if (active) setRecommendations(data) })
      .catch(() => {})
    return () => { active = false }
  }, [backlogVersion])

  const handleEdit = async (game, patch) => {
    const key = `edit-${game.id}`
    setActioning(prev => [...prev, key])
    setError(null)
    try {
      await updateGame(game.id, patch)
      await fetchBacklog({ current: true }, { silent: true })   // sin parpadeo
      if (patch.status) addToast('Estado actualizado')
      if (patch.owned_platform) addToast('Plataforma actualizada')
      if ('hours_played' in patch) addToast('Horas registradas')
      if ('enjoyment' in patch) addToast('Disfrute registrado')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setActioning(prev => prev.filter(k => k !== key))
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteGame(pendingDelete.id)
      setPendingDelete(null)
      await fetchBacklog({ current: true }, { silent: true })
      addToast('Juego eliminado')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    // FIX: null <= 10 es true en JS, por eso verificamos que el dato exista antes de comparar
    const hours = game.hltb_main_hours
    if (filterDuration === "short")  return hours != null && hours <= 10
    if (filterDuration === "medium") return hours != null && hours > 10 && hours <= 20
    if (filterDuration === "long")   return hours != null && hours > 20
    return true
  })

  const selectClass = "w-full bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] text-[11px] font-bold rounded px-2 py-1.5 focus:outline-none focus:border-[var(--accent)]"

  return (
    <div className="min-h-screen bg-[var(--ink)] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">

        <div className="mb-6">
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">Mi Biblioteca</h1>
          <p className="text-[var(--muted)] text-xs mt-1">Tus juegos por estado y plataforma</p>
        </div>

        <StatsChart />

        {/* Status chips */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {STATUS_TABS.map(tab => {
            const active = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(active ? 'todos' : tab.value)}
                aria-pressed={active}
                className={`whitespace-nowrap px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full border transition-all duration-200 ${
                  active
                    ? 'bg-[var(--accent)] text-[var(--ink)] border-[var(--accent)]'
                    : 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--text)]'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
          {(statusFilter !== 'todos' || filterCoop || filterCrossplay || filterDuration !== 'all') && (
            <button
              type="button"
              onClick={() => { setStatusFilter('todos'); setFilterCoop(false); setFilterCrossplay(false); setFilterDuration('all'); }}
              className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--danger)] hover:text-white hover:bg-[var(--danger)] border border-[var(--danger)]/40 rounded-full transition-all duration-200 flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Limpiar
            </button>
          )}
        </div>

        {/* Sugerencia del día */}
        {user && (user.available_hours_per_week === null || user.stress_level_tolerance === null) ? (
          <div className="mb-8 p-6 bg-[var(--surface)] border border-[var(--line)] rounded-lg text-center shadow-lg">
            <h2 className="text-lg font-bold text-[var(--text)] uppercase tracking-widest mb-2">Sugerencia del día</h2>
            <p className="text-[var(--muted)] text-sm mb-4">Completá tu perfil para obtener sugerencias personalizadas.</p>
            <NavLink to="/perfil" className="inline-block px-5 py-2.5 bg-[var(--accent)] text-[var(--ink)] font-bold uppercase tracking-wider text-xs rounded transition-colors hover:bg-[var(--accent)]/90">
              Completar perfil
            </NavLink>
          </div>
        ) : recommendations.length > 0 && (
          <div className="mb-8 p-4 bg-[var(--surface)] border border-[var(--accent)]/30 rounded-lg shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]"></div>
            <div className="flex items-center gap-2 mb-4 pl-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <h2 className="text-lg font-bold text-[var(--text)] uppercase tracking-widest">Sugerencia del día</h2>
              <span className="text-[10px] text-[var(--accent)] font-semibold border border-[var(--accent)] rounded px-1.5 py-0.5 ml-2">Personalizado</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pl-3">
              {recommendations.map(game => (
                <div key={game.id} className="flex flex-col gap-2">
                  <GameCard
                    game={game}
                    controls={null} // Opciones limitadas para la recomendación
                    onDelete={() => setPendingDelete(game)}
                  />
                  {game.recommendation_reason && (
                    <div className="text-[10px] text-[var(--accent)] font-semibold bg-[var(--accent)]/10 px-2 py-1.5 rounded border border-[var(--accent)]/20 text-center uppercase tracking-wider">
                      {game.recommendation_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Búsqueda */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="BUSCAR EN LA BIBLIOTECA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--text)] font-medium placeholder-[var(--muted)] px-4 py-3 rounded focus:outline-none focus:border-[var(--accent)] tracking-wide text-sm"
          />
        </div>

        {/* Filtros de duración y orden */}
        <div className="flex flex-wrap gap-4 items-center mb-8 bg-[var(--surface)] p-4 rounded-lg border border-[var(--line)]">
          <span className="text-[var(--muted)] text-xs font-bold uppercase tracking-wider">Filtrar:</span>
          <select value={filterDuration} onChange={(e) => setFilterDuration(e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--line)] text-[var(--muted)] text-xs font-bold rounded px-3 py-1.5 focus:outline-none focus:border-[var(--accent)]">
            <option value="all">Duración (todas)</option>
            <option value="short">Corta (0–10 hs)</option>
            <option value="medium">Media (10–20 hs)</option>
            <option value="long">Larga (+20 hs)</option>
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={filterCoop} onChange={e => setFilterCoop(e.target.checked)}
              className="accent-[var(--accent)] w-3.5 h-3.5" />
            <span className="text-[var(--muted)] text-xs font-bold uppercase tracking-wider">Co-op</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={filterCrossplay} onChange={e => setFilterCrossplay(e.target.checked)}
              className="accent-[var(--accent)] w-3.5 h-3.5" />
            <span className="text-[var(--muted)] text-xs font-bold uppercase tracking-wider">Crossplay</span>
          </label>

          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}
            className="ml-auto bg-[var(--surface-2)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] text-xs font-bold px-3 py-1.5 rounded transition-colors uppercase tracking-wider focus:outline-none focus:border-[var(--accent)]">
            <option value="duration_asc">Ordenar: Duración ↑</option>
            <option value="duration_desc">Ordenar: Duración ↓</option>
            <option value="value_asc">Ordenar: Valor ($/h)</option>
            <option value="price_asc">Ordenar: Precio ↑</option>
            <option value="enjoyment_desc">Ordenar: Disfrute ↓</option>
            <option value="added_desc">Ordenar: Recientes</option>
          </select>
        </div>

        {loading && <div className="text-center py-20 text-[var(--muted)] font-bold">Cargando biblioteca...</div>}

        {error && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-[var(--ink)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 mx-auto">
              <path d="M2 12a10 10 0 0 1 18-6"/><path d="M22 12a10 10 0 0 1-18 6"/><circle cx="12" cy="12" r="2"/>
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">Sincronización pausada</h3>
            <p className="text-[var(--muted)] max-w-sm mb-6">{error.message || error}</p>
            <button onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--ink)] font-medium rounded transition">
              Reintentar conexión
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGames.map((game) => {
              const busy = actioning.includes(`edit-${game.id}`)
              const controls = (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <select
                    aria-label="Estado"
                    value={game.status}
                    disabled={busy}
                    onChange={(e) => handleEdit(game, { status: e.target.value })}
                    className={selectClass}
                  >
                    {LIBRARY_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Plataforma"
                    value={game.owned_platform ?? ''}
                    disabled={busy}
                    onChange={(e) => handleEdit(game, { owned_platform: e.target.value })}
                    className={selectClass}
                  >
                    <option value="" disabled>Plataforma…</option>
                    {PLATFORMS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              )
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  controls={controls}
                  onEdit={handleEdit}
                  onDelete={() => setPendingDelete(game)}
                />
              )
            })}
          </div>
        )}

        {!loading && !error && filteredGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--muted)] font-medium">No tenés juegos que cumplan este filtro. Probá limpiar los filtros o buscá tu primer juego.</p>
          </div>
        )}

      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Eliminar juego"
        message={pendingDelete ? `¿Seguro que querés eliminar "${pendingDelete.title}" de tu biblioteca? Esta acción no se puede deshacer.` : ''}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
