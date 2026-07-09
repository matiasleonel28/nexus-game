import { useState } from 'react'
import { getHunterPrices } from '../api/hunter'
import { STORES, formatPrice } from '../constants'

export default function HunterView() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)   // { title, stores }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchedTitle, setSearchedTitle] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    const t = query.trim()
    if (!t) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await getHunterPrices(t)
      setResult(data)
      setSearchedTitle(t)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const stores = result?.stores ?? {}
  const hasAnyData = Object.keys(stores).length > 0

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white p-6 font-sans">
      <div className="max-w-3xl mx-auto">

        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#ff4655] font-bold">Hunter</p>
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">Cazador de ofertas</h1>
          <p className="text-gray-500 text-xs mt-1">Precios en pesos (ARS) en Steam, Nintendo eShop y Xbox Store</p>
        </div>

        {/* Buscador */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="TÍTULO DEL JUEGO (EJ: HOLLOW KNIGHT)..."
            className="flex-1 rounded bg-[#11141b] border border-gray-800 px-4 py-3 text-sm text-white font-semibold placeholder-gray-600 outline-none focus:border-[#ff4655] tracking-wide"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-[#ff4655] px-8 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Buscando...' : 'Cazar precios'}
          </button>
        </form>

        {error && (
          <div className="mb-6 rounded border border-red-900 bg-red-950/30 px-4 py-3 text-red-400 text-sm font-semibold">
            {error.message || String(error)}
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-gray-500 font-bold">Consultando precios...</div>
        )}

        {!loading && result && !hasAnyData && (
          <div className="rounded-lg border border-gray-800 bg-[#11141b] px-6 py-10 text-center text-gray-400">
            <p className="text-sm font-bold uppercase tracking-wider text-[#ff4655] mb-1">Sin datos de precio</p>
            <p className="text-xs">No encontramos precios de "{searchedTitle}" en Steam/eShop/Xbox. Probá con otro título.</p>
          </div>
        )}

        {!loading && hasAnyData && (
          <div>
            <h2 className="text-lg font-bold text-white mb-3">{result.title || searchedTitle}</h2>
            <div className="space-y-3">
              {STORES.map(store => {
                const p = stores[store.key]
                const currency = p?.currency || 'ARS'
                const current = p?.current
                const lowest = p?.lowest
                const cut = p?.cut
                const isHistoricLow = current != null && lowest != null && current <= lowest * 1.001

                return (
                  <div key={store.key} className="rounded-lg border border-gray-800 bg-[#11141b] p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm">{store.label}</p>
                      {p ? (
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          Mínimo histórico: {formatPrice(lowest, currency) ?? '—'}
                          {isHistoricLow && <span className="ml-2 text-[#ff4655] font-bold">🔥 ¡en su mínimo!</span>}
                        </p>
                      ) : (
                        <p className="text-gray-600 text-[11px] mt-0.5">Sin datos en esta tienda</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      {p && current != null ? (
                        <>
                          <p className="text-white text-lg font-black leading-none">
                            {formatPrice(current, currency)}
                          </p>
                          {cut > 0 && (
                            <span className="inline-block mt-1 bg-[#ff4655] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              -{cut}%
                            </span>
                          )}
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noreferrer"
                              className="block text-[10px] text-gray-500 hover:text-[#ff4655] mt-1 uppercase tracking-wider font-bold">
                              Ver oferta ↗
                            </a>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-600 text-sm">—</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
