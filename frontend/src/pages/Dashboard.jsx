import { useState, useEffect, useCallback } from 'react'
import { getBacklog, updateGame, deleteGame } from '../api/games'
import GameCard from '../components/GameCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { useGameRefresh } from '../context/GameRefreshContext'
import { LIBRARY_STATUSES, PLATFORMS } from '../constants'

const STATUS_TABS = [{ value: 'todos', label: 'Todos' }, ...LIBRARY_STATUSES]

export default function Dashboard() {
  const [games, setGames]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterDuration, setFilterDuration] = useState("all")
  const [sortOption, setSortOption] = useState("duration_asc")
  const [statusFilter, setStatusFilter] = useState("todos")

  const [actioning, setActioning] = useState([])
  const [pendingDelete, setPendingDelete] = useState(null)   // juego a confirmar borrado
  const [deleting, setDeleting] = useState(false)

  const { backlogVersion } = useGameRefresh()

  // silent = recarga los datos sin mostrar el spinner de pantalla completa
  // (evita el "parpadeo" al editar estado/plataforma en el lugar)
  const fetchBacklog = useCallback(async (signal = { current: true }, { silent = false } = {}) => {
    if (!signal.current) return
    if (!silent) setLoading(true)
    setError(null)
    try {
      const params = { sort: sortOption }
      if (statusFilter !== 'todos') params.status = statusFilter
      const data = await getBacklog(params)
      if (!signal.current) return
      setGames(data)
    } catch (err) {
      if (signal.current) setError(err)
    } finally {
      if (signal.current && !silent) setLoading(false)
    }
  }, [sortOption, statusFilter])

  useEffect(() => {
    const signal = { current: true }
    void Promise.resolve().then(() => {
      if (signal.current) void fetchBacklog(signal)
    })
    return () => { signal.current = false }
  }, [fetchBacklog, backlogVersion])

  const handleEdit = async (game, patch) => {
    const key = `edit-${game.id}`
    setActioning(prev => [...prev, key])
    setError(null)
    try {
      await updateGame(game.id, patch)
      await fetchBacklog({ current: true }, { silent: true })   // sin parpadeo
    } catch (err) {
      setError(err)
    } finally {
      setActioning(prev => prev.filter(k => k !== key))
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    setError(null)
    try {
      await deleteGame(pendingDelete.id)
      setPendingDelete(null)
      await fetchBacklog({ current: true }, { silent: true })
    } catch (err) {
      setError(err)
    } finally {
      setDeleting(false)
    }
  }

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    if (filterDuration === "short") return game.hltb_main_hours <= 10
    if (filterDuration === "medium") return game.hltb_main_hours > 10 && game.hltb_main_hours <= 20
    if (filterDuration === "long") return game.hltb_main_hours > 20
    return true
  })

  const selectClass = "w-full bg-[var(--surface-2)] border border-gray-700 text-gray-200 text-[11px] font-bold rounded px-2 py-1.5 focus:outline-none focus:border-[var(--accent)]"

  return (
    <div className="min-h-screen bg-[var(--ink)] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">

        <div className="mb-6">
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">Mi Biblioteca</h1>
          <p className="text-gray-500 text-xs mt-1">Tus juegos por estado y plataforma</p>
        </div>

        {/* Solapas por estado (underline tabs) */}
        <div className="mb-6 flex gap-6 border-b border-[var(--line)] overflow-x-auto">
          {STATUS_TABS.map(tab => {
            const active = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                aria-pressed={active}
                className={`relative -mb-px whitespace-nowrap px-1 pb-3 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors duration-200 ${
                  active ? 'text-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {tab.label}
                <span
                  aria-hidden
                  className={`absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-[var(--accent)] transition-opacity duration-200 ease-out ${
                    active ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            )
          })}
        </div>

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
        <div className="flex flex-wrap gap-4 items-center mb-8 bg-[var(--surface)] p-4 rounded-lg border border-gray-800">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Filter By:</span>
          <select value={filterDuration} onChange={(e) => setFilterDuration(e.target.value)}
            className="bg-[var(--surface-2)] border border-gray-700 text-gray-300 text-xs font-bold rounded px-3 py-1.5 focus:outline-none focus:border-[var(--accent)]">
            <option value="all">DURATION (ALL)</option>
            <option value="short">SHORT (0-10 HS)</option>
            <option value="medium">MEDIUM (10-20 HS)</option>
            <option value="long">LONG (+20 HS)</option>
          </select>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}
            className="ml-auto bg-[var(--surface-2)] border border-gray-700 text-gray-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded transition-colors uppercase tracking-wider focus:outline-none focus:border-[var(--accent)]">
            <option value="duration_asc">Sort by: Duration ↑</option>
            <option value="duration_desc">Sort by: Duration ↓</option>
            <option value="value_asc">Sort by: Value ($/h) ⚡</option>
            <option value="price_asc">Sort by: Price ↑</option>
          </select>
        </div>

        {loading && <div className="text-center py-20 text-gray-500 font-bold">Cargando biblioteca...</div>}

        {error && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-[var(--ink)]">
            <div className="text-4xl mb-4">📡</div>
            <h3 className="text-xl font-bold text-white mb-2">Sincronización pausada</h3>
            <p className="text-gray-400 max-w-sm mb-6">{error.message || error}</p>
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
                  onDelete={() => setPendingDelete(game)}
                />
              )
            })}
          </div>
        )}

        {!loading && !error && filteredGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">No hay juegos en este estado. Agregá desde "Buscar" o cambiá de pestaña.</p>
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
