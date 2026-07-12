import { useState } from 'react'
import { searchGames, addToBacklog, addToWishlist } from '../api/games'
import GameCard from '../components/GameCard'
import { useGameRefresh } from '../context/GameRefreshContext'
import { platformsForGame } from '../constants'
import { useToast } from '../context/ToastContext'

export default function SearchView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [adding, setAdding] = useState(new Set())
  const [platformByGame, setPlatformByGame] = useState({})   // igdb_id -> plataforma elegida

  const { refreshBacklog, refreshWishlist } = useGameRefresh()
  const { addToast } = useToast()

  const handleSearch = async (event) => {
    event.preventDefault()
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setError('Escribe el título de un juego para buscar.')
      setSuccess(null)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setHasSearched(false)
    setResults([])

    try {
      const data = await searchGames(trimmedQuery)
      setResults(data || [])
    } catch (err) {
      setError(err)
      console.error('Search error:', err)
    } finally {
      setLoading(false)
      setHasSearched(true)
    }
  }

  const handleAdd = async (igdbId, target) => {
    const actionKey = `${target}-${igdbId}`
    setError(null)
    setSuccess(null)
    
    setAdding((prev) => new Set(prev).add(actionKey))

    try {
      const game = results.find(g => g.igdb_id === igdbId)
      if (target === 'backlog') {
        const fallback = platformsForGame(game?.platforms)[0]?.value ?? 'pc'
        await addToBacklog(igdbId, platformByGame[igdbId] ?? fallback)
        refreshBacklog()
        addToast(`${game.title} agregado a tu Biblioteca`)
      } else {
        await addToWishlist(igdbId)
        refreshWishlist()
        addToast(`${game.title} agregado a tu Wishlist`)
      }
    } catch (err) {
      console.error(`Add to ${target} error:`, err)
      if (err.status === 409) {
        addToast('Ya tenés este juego', 'warning')
      } else {
        addToast(err.message, 'error')
      }
    } finally {
      setAdding((prev) => {
        const newSet = new Set(prev)
        newSet.delete(actionKey)
        return newSet
      })
    }
  }

  return (
    <main className="min-h-screen bg-[var(--ink)] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">
            Explorar Juegos
          </h1>
          <p className="text-[var(--muted)] text-xs mt-1 uppercase font-semibold">
            Buscá un juego y sumalo a tu biblioteca o wishlist
          </p>
        </header>

        {/* Buscador */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setError(null)
              setSuccess(null)
            }}
            className="flex-1 rounded bg-[var(--surface)] border border-[var(--line)] px-4 py-3 text-sm text-white font-semibold placeholder-[var(--muted)] shadow-md outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] tracking-wide transition-all"
            placeholder="BUSCAR EN LA BASE DE DATOS (EJ: HOLLOW KNIGHT)..."
            aria-label="Buscar juego"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-[var(--accent)] px-8 py-3 text-sm font-bold uppercase tracking-wider text-[var(--ink)] transition-colors hover:bg-[var(--accent-strong)] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {/* Notificaciones */}
        {error && (
          <div className="mb-6 rounded border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-4 py-3 text-[var(--danger)] text-sm font-semibold tracking-wide">
            {error.message || error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded border border-[var(--positive)]/30 bg-[var(--positive)]/5 px-4 py-3 text-[var(--positive)] text-sm font-semibold tracking-wide">
            {success}
          </div>
        )}

        {/* Estados Vacíos */}
        {!loading && !hasSearched && (
          <div className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-12 text-center text-[var(--muted)]">
            <p className="text-sm font-bold tracking-wider uppercase">
              Ingresa un término arriba para comenzar la búsqueda.
            </p>
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <div className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-12 text-center text-[var(--muted)]">
            <p className="text-sm font-bold tracking-wider uppercase text-[var(--accent)]">
              No se encontraron resultados
            </p>
            <p className="text-xs mt-2">Intenta con otros términos para "{query.trim()}".</p>
          </div>
        )}

        {/* Grilla de Resultados */}
        {!loading && results.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((game) => {
              const isAddingBacklog = adding.has(`backlog-${game.igdb_id}`)
              const isAddingWishlist = adding.has(`wishlist-${game.igdb_id}`)

              const availablePlatforms = platformsForGame(game.platforms)
              const selectedPlatform = platformByGame[game.igdb_id] ?? availablePlatforms[0]?.value
              const platformPicker = availablePlatforms.length > 1 ? (
                <div className="mt-3">
                  <label className="block text-[var(--muted)] text-[10px] font-bold uppercase tracking-wider mb-1">
                    ¿En qué plataforma lo jugás?
                  </label>
                  <select
                    aria-label="Plataforma"
                    value={selectedPlatform}
                    onChange={(e) => setPlatformByGame(prev => ({ ...prev, [game.igdb_id]: e.target.value }))}
                    className="w-full bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] text-[11px] font-bold rounded px-2 py-1.5 focus:outline-none focus:border-[var(--accent)]"
                  >
                    {availablePlatforms.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              ) : null
              return (
                <GameCard
                  key={game.igdb_id}
                  game={game}
                  controls={platformPicker}
                  actions={[
                    {
                      label: isAddingBacklog ? 'Guardando...' : 'Añadir a Biblioteca',
                      onClick: () => handleAdd(game.igdb_id, 'backlog'),
                      disabled: isAddingBacklog || isAddingWishlist,
                      variant: 'primary',
                    },
                    {
                      label: isAddingWishlist ? 'Guardando...' : 'Añadir Wishlist',
                      onClick: () => handleAdd(game.igdb_id, 'wishlist'),
                      disabled: isAddingBacklog || isAddingWishlist,
                      variant: 'secondary',
                    },
                  ]}
                />
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}
