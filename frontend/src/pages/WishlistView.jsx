import { useState, useEffect, useCallback } from 'react'
import { getWishlist, updateStatus, deleteGame, updateGame } from '../api/games'
import { getGamePrices, resolveEshop } from '../api/hunter'
import GameCard from '../components/GameCard'
import { useGameRefresh } from '../context/GameRefreshContext'
import { STORES, formatPrice } from '../constants'

const storeLabel = (key) => STORES.find(s => s.key === key)?.label ?? key

export default function WishlistView() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [actioning, setActioning] = useState([])
  const [drafts, setDrafts] = useState({})   // id -> { store, target }
  const [prices, setPrices] = useState({})   // id -> { steam:{...}, eshop:{...}, xbox:{...} }
  const [eshopLinks, setEshopLinks] = useState({})   // id -> url del eShop US

  const { wishlistVersion, refreshBacklog } = useGameRefresh()

  const draftFor = (game) => drafts[game.id] ?? {
    store: game.watch_store || 'steam',
    target: game.target_price ?? '',
  }

  const setDraft = (id, patch) =>
    setDrafts(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }))

  const handleWatch = async (game) => {
    const d = draftFor(game)
    const target = parseFloat(d.target)
    if (Number.isNaN(target) || target <= 0) {
      setError({ message: 'Ingresá un precio objetivo válido (ej: 5000).' })
      return
    }
    setError(null); setSuccess(null)
    setActioning(prev => [...prev, `watch-${game.id}`])
    try {
      await updateGame(game.id, { target_price: target, watch_store: d.store })
      setSuccess(`Vigilando "${game.title}" en ${d.store} ≤ ${formatPrice(target)}.`)
      await fetchWishlist({ current: true })
    } catch (err) {
      setError(err)
    } finally {
      setActioning(prev => prev.filter(k => k !== `watch-${game.id}`))
    }
  }

  const fetchWishlist = useCallback(async (signal = { current: true }) => {
    if (!signal.current) return
    setLoading(true)
    setError(null)
    try {
      const data = await getWishlist()
      if (!signal.current) return
      setGames(data)
      // Precios combinados por juego (Steam/Xbox ITAD + eShop Nintendo), en paralelo
      data.forEach(async (g) => {
        try {
          const pr = await getGamePrices(g.id)
          if (signal.current) setPrices(prev => ({ ...prev, [g.id]: pr.stores || {} }))
        } catch { /* precio opcional: si falla, la tarjeta muestra "sin datos" */ }
      })
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

  const handleResolveEshop = async (game) => {
    const url = (eshopLinks[game.id] || '').trim()
    if (!url) { setError({ message: 'Pegá el link del juego en el eShop de EE.UU.' }); return }
    setError(null); setSuccess(null)
    setActioning(prev => [...prev, `eshop-${game.id}`])
    try {
      const res = await resolveEshop(game.id, url)
      if (res?.eshop) {
        setPrices(prev => ({ ...prev, [game.id]: { ...(prev[game.id] || {}), eshop: res.eshop } }))
      }
      setSuccess(`eShop vinculado a "${game.title}".`)
      await fetchWishlist({ current: true })
    } catch (err) {
      setError(err)
    } finally {
      setActioning(prev => prev.filter(k => k !== `eshop-${game.id}`))
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
    <div className="min-h-screen bg-[var(--ink)] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">Wishlist</h1>
          <p className="text-gray-500 text-xs mt-1">Aquí verás tus juegos guardados en wishlist.</p>
        </div>

        {loading && <div className="text-center py-10 text-gray-500 font-bold uppercase tracking-wider">Cargando wishlist...</div>}
        
        {/* Error State Elegante */}
        {error && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-[var(--ink)]">
            <div className="text-4xl mb-4">📡</div>
            <h3 className="text-xl font-bold text-white mb-2">Sincronización pausada</h3>
            <p className="text-gray-400 max-w-sm mb-6">{error.message || error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--ink)] font-medium rounded transition"
            >
              Reintentar conexión
            </button>
          </div>
        )}

        {success && <div className="mb-6 rounded-lg border border-green-500 bg-green-950/50 px-4 py-3 text-green-200">{success}</div>}

        {!loading && games.length === 0 && !error && (
          <div className="rounded-lg border border-gray-800 bg-[var(--surface)] px-6 py-8 text-gray-400">
            <p className="text-lg font-bold uppercase tracking-wider mb-2">No hay juegos en la wishlist.</p>
            <p className="text-sm">Busca un juego y agrégalo desde la pestaña Buscar.</p>
          </div>
        )}

        {!loading && games.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {games.map(game => {
              const isMoving = actioning.includes(`move-${game.id}`)
              const isDeleting = actioning.includes(`delete-${game.id}`)
              const isWatching = actioning.includes(`watch-${game.id}`)
              const eshopResolving = actioning.includes(`eshop-${game.id}`)
              const d = draftFor(game)
              const storePrice = prices[game.id]?.[d.store]
              const hasPrices = prices[game.id] !== undefined
              const targetNum = parseFloat(d.target)
              const belowTarget = storePrice?.current != null && !Number.isNaN(targetNum) && targetNum > 0 && storePrice.current <= targetNum

              const watchControls = (
                <div className="mt-3 rounded border border-gray-800 bg-[var(--surface-3)] p-2">
                  {game.target_price != null && (
                    <p className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-wider mb-1.5">
                      🎯 Vigilando {game.watch_store || 'steam'} ≤ {formatPrice(game.target_price)}
                    </p>
                  )}

                  {/* Precio actual ITAD para la tienda seleccionada */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-bold">Ahora en {storeLabel(d.store)}</span>
                    <span className="text-right">
                      {storePrice?.current != null ? (
                        <span className={`font-num text-base ${belowTarget ? 'text-[var(--positive)]' : 'text-[var(--text)]'}`}>
                          {formatPrice(storePrice.current, storePrice.currency)}
                          {storePrice.cut > 0 && <span className="text-[var(--accent)] text-[10px] font-bold ml-1 font-sans">-{storePrice.cut}%</span>}
                        </span>
                      ) : (
                        <span className="text-[var(--muted)] text-[11px] font-bold">{hasPrices ? 'sin datos' : '…'}</span>
                      )}
                    </span>
                  </div>
                  {belowTarget && (
                    <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-2">✓ ¡Por debajo de tu objetivo!</p>
                  )}

                  {/* Vincular eShop: solo si mirás eShop y el juego no tiene nsuid aún */}
                  {d.store === 'eshop' && !game.eshop_nsuid && (
                    <div className="mb-2 border-t border-gray-800 pt-2">
                      <p className="text-[10px] text-gray-500 mb-1">Pegá el link del juego en el <span className="text-gray-300">eShop de EE.UU.</span> para traer su precio:</p>
                      <input
                        type="text"
                        placeholder="https://www.nintendo.com/us/store/products/..."
                        value={eshopLinks[game.id] || ''}
                        onChange={(e) => setEshopLinks(prev => ({ ...prev, [game.id]: e.target.value }))}
                        className="w-full bg-[var(--surface-2)] border border-gray-700 text-gray-200 text-[10px] rounded px-2 py-1.5 focus:outline-none focus:border-[var(--accent)] placeholder-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleResolveEshop(game)}
                        disabled={eshopResolving}
                        className="w-full mt-1.5 rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-gray-700 bg-[var(--surface-2)] text-gray-300 hover:border-[var(--accent)] hover:text-[var(--accent)] transition disabled:opacity-60"
                      >
                        {eshopResolving ? 'Vinculando...' : 'Vincular eShop'}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      aria-label="Tienda a vigilar"
                      value={d.store}
                      onChange={(e) => setDraft(game.id, { store: e.target.value })}
                      className="bg-[var(--surface-2)] border border-gray-700 text-gray-200 text-[11px] font-bold rounded px-2 py-1.5 focus:outline-none focus:border-[var(--accent)]"
                    >
                      {STORES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="Precio objetivo"
                      value={d.target}
                      onChange={(e) => setDraft(game.id, { target: e.target.value })}
                      className="bg-[var(--surface-2)] border border-gray-700 text-gray-200 text-[11px] font-bold rounded px-2 py-1.5 focus:outline-none focus:border-[var(--accent)] placeholder-gray-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleWatch(game)}
                    disabled={isWatching}
                    className="w-full mt-2 rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--ink)] transition disabled:opacity-60"
                  >
                    {isWatching ? 'Guardando...' : (game.target_price != null ? 'Actualizar vigilancia' : 'Vigilar precio')}
                  </button>
                </div>
              )

              return (
                <GameCard
                  key={game.id}
                  game={game}
                  controls={watchControls}
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
