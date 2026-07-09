import { useState } from 'react'
import { searchGames, addToBacklog, addToWishlist } from '../api/games'
import GameCard from '../components/GameCard'
import { useGameRefresh } from '../context/GameRefreshContext'
import { PLATFORMS } from '../constants'

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
      if (target === 'backlog') {
        await addToBacklog(igdbId, platformByGame[igdbId] ?? 'pc')
        refreshBacklog()
        setSuccess('¡Juego añadido a tu Biblioteca exitosamente!')
      } else {
        await addToWishlist(igdbId)
        refreshWishlist()
        setSuccess('¡Juego añadido a tu Wishlist exitosamente!')
      }
    } catch (err) {
      setError(err)
      console.error(`Add to ${target} error:`, err)
    } finally {
      setAdding((prev) => {
        const newSet = new Set(prev)
        newSet.delete(actionKey)
        return newSet
      })
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0d12] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">
            Explorar Juegos
          </h1>
          <p className="text-gray-500 text-xs mt-1 uppercase font-semibold">
            Encuentra nuevos títulos en IGDB y organízalos
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
            className="flex-1 rounded bg-[#11141b] border border-gray-800 px-4 py-3 text-sm text-white font-semibold placeholder-gray-600 shadow-md outline-none focus:border-[#ff4655] focus:ring-1 focus:ring-[#ff4655] tracking-wide transition-all"
            placeholder="BUSCAR EN LA BASE DE DATOS (EJ: HOLLOW KNIGHT)..."
            aria-label="Buscar juego"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-[#ff4655] px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-600 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {/* Notificaciones */}
        {error && (
          <div className="mb-6 rounded border border-red-900 bg-red-950/30 px-4 py-3 text-red-400 text-sm font-semibold tracking-wide">
            {error.message || error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded border border-green-900 bg-green-950/30 px-4 py-3 text-green-400 text-sm font-semibold tracking-wide">
            {success}
          </div>
        )}

        {/* Estados Vacíos */}
        {!loading && !hasSearched && (
          <div className="mb-6 rounded-lg border border-gray-800 bg-[#11141b] px-4 py-12 text-center text-gray-500">
            <p className="text-sm font-bold tracking-wider uppercase">
              Ingresa un término arriba para comenzar la búsqueda.
            </p>
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <div className="mb-6 rounded-lg border border-gray-800 bg-[#11141b] px-4 py-12 text-center text-gray-500">
            <p className="text-sm font-bold tracking-wider uppercase text-[#ff4655]">
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

              const selectedPlatform = platformByGame[game.igdb_id] ?? 'pc'
              const platformPicker = (
                <div className="mt-3">
                  <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                    ¿En qué plataforma lo tenés/jugás?
                  </label>
                  <select
                    aria-label="Plataforma"
                    value={selectedPlatform}
                    onChange={(e) => setPlatformByGame(prev => ({ ...prev, [game.igdb_id]: e.target.value }))}
                    className="w-full bg-[#1e2330] border border-gray-700 text-gray-200 text-[11px] font-bold rounded px-2 py-1.5 focus:outline-none focus:border-[#ff4655]"
                  >
                    {PLATFORMS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              )
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
