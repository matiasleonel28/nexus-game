import { useState, useEffect, useCallback } from 'react'
import { getWishlist, updateStatus, deleteGame } from '../api/games'
import GameCard from '../components/GameCard'
import { useGameRefresh } from '../context/GameRefreshContext'

export default function WishlistView() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [actioning, setActioning] = useState([])

  const { wishlistVersion, refreshBacklog } = useGameRefresh()

  const fetchWishlist = useCallback(async (signal = { current: true }) => {
    if (!signal.current) return
    setLoading(true)
    setError(null)
    try {
      const data = await getWishlist()
      if (!signal.current) return
      setGames(data)
    } catch (err) {
      if (signal.current) {
        setError(err)
      }
    } finally {
      if (signal.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const signal = { current: true }
    void Promise.resolve().then(() => {
      if (signal.current) {
        void fetchWishlist(signal)
      }
    })
    return () => {
      signal.current = false
    }
  }, [fetchWishlist, wishlistVersion])

  const handleMoveToBacklog = async id => {
    setError(null)
    setSuccess(null)
    setActioning(prev => [...prev, `move-${id}`])

    try {
      await updateStatus(id, 'pendiente')
      setSuccess('Juego movido a tu biblioteca (Pendiente).')
      refreshBacklog()
      await fetchWishlist({ current: true })
    } catch (err) {
      setError(err)
    } finally {
      setActioning(prev => prev.filter(key => key !== `move-${id}`))
    }
  }

  const handleRemove = async id => {
    setError(null)
    setSuccess(null)
    setActioning(prev => [...prev, `delete-${id}`])

    try {
      await deleteGame(id)
      setSuccess('Juego eliminado de la wishlist.')
      await fetchWishlist({ current: true })
    } catch (err) {
      setError(err)
    } finally {
      setActioning(prev => prev.filter(key => key !== `delete-${id}`))
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">Wishlist</h1>
          <p className="text-gray-500 text-xs mt-1">Aquí verás tus juegos guardados en wishlist.</p>
        </div>

        {loading && <div className="text-center py-10 text-gray-500 font-bold uppercase tracking-wider">Cargando wishlist...</div>}
        
        {/* Error State Elegante */}
        {error && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-[#0b0d12]">
            <div className="text-4xl mb-4">📡</div>
            <h3 className="text-xl font-bold text-white mb-2">Sincronización pausada</h3>
            <p className="text-gray-400 max-w-sm mb-6">{error.message || error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-[#ff4655] hover:bg-[#d63b46] text-white font-medium rounded transition"
            >
              Reintentar conexión
            </button>
          </div>
        )}

        {success && <div className="mb-6 rounded-lg border border-green-500 bg-green-950/50 px-4 py-3 text-green-200">{success}</div>}

        {!loading && games.length === 0 && !error && (
          <div className="rounded-lg border border-gray-800 bg-[#11141b] px-6 py-8 text-gray-400">
            <p className="text-lg font-bold uppercase tracking-wider mb-2">No hay juegos en la wishlist.</p>
            <p className="text-sm">Busca un juego y agrégalo desde la pestaña Buscar.</p>
          </div>
        )}

        {!loading && games.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {games.map(game => {
              const isMoving = actioning.includes(`move-${game.id}`)
              const isDeleting = actioning.includes(`delete-${game.id}`)

              return (
                <GameCard
                  key={game.id}
                  game={game}
                  actions={[
                    {
                      label: isMoving ? 'Moviendo...' : 'Mover a Biblioteca',
                      onClick: () => handleMoveToBacklog(game.id),
                      disabled: isMoving,
                    },
                    {
                      label: isDeleting ? 'Eliminando...' : 'Eliminar de wishlist',
                      onClick: () => handleRemove(game.id),
                      disabled: isDeleting,
                      variant: 'danger',
                    },
                  ]}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
