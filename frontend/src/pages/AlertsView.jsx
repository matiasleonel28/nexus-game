import { useState, useEffect, useCallback } from 'react'
import { getAlerts, markAlertRead, evaluateWatches } from '../api/hunter'
import { formatPrice } from '../constants'

const TYPE_LABEL = {
  target_reached: '🎯 Bajó de tu precio objetivo',
  historical_low: '🔥 Tocó su mínimo histórico',
}

export default function AlertsView() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState(null)

  const fetchAlerts = useCallback(async (signal = { current: true }) => {
    if (!signal.current) return
    setLoading(true)
    setError(null)
    try {
      const data = await getAlerts()
      if (signal.current) setAlerts(data)
    } catch (err) {
      if (signal.current) setError(err)
    } finally {
      if (signal.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const signal = { current: true }
    void fetchAlerts(signal)
    return () => { signal.current = false }
  }, [fetchAlerts])

  const handleCheckNow = async () => {
    setChecking(true)
    setError(null)
    setNotice(null)
    try {
      const res = await evaluateWatches()
      const n = res?.nuevas_alertas ?? 0
      setNotice(n > 0 ? `Se generaron ${n} alerta(s) nueva(s).` : 'Sin novedades: ningún juego vigilado alcanzó su objetivo.')
      await fetchAlerts()
    } catch (err) {
      setError(err)
    } finally {
      setChecking(false)
    }
  }

  const handleRead = async (id) => {
    try {
      await markAlertRead(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white p-6 font-sans">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#ff4655] font-bold">Hunter</p>
            <h1 className="text-3xl font-black uppercase tracking-wider text-white">Alertas</h1>
            <p className="text-gray-500 text-xs mt-1">Cuando un juego vigilado baja de tu objetivo o toca su mínimo histórico</p>
          </div>
          <button
            type="button"
            onClick={handleCheckNow}
            disabled={checking}
            className="shrink-0 rounded bg-[#ff4655] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? 'Revisando...' : 'Revisar precios ahora'}
          </button>
        </div>

        {notice && (
          <div className="mb-4 rounded border border-green-900 bg-green-950/30 px-4 py-3 text-green-400 text-sm font-semibold">{notice}</div>
        )}
        {error && (
          <div className="mb-4 rounded border border-red-900 bg-red-950/30 px-4 py-3 text-red-400 text-sm font-semibold">{error.message || String(error)}</div>
        )}

        {loading && <div className="text-center py-16 text-gray-500 font-bold">Cargando alertas...</div>}

        {!loading && alerts.length === 0 && !error && (
          <div className="rounded-lg border border-gray-800 bg-[#11141b] px-6 py-10 text-center text-gray-400">
            <p className="text-sm font-bold uppercase tracking-wider mb-1">Sin alertas todavía</p>
            <p className="text-xs">Poné un precio objetivo a un juego en la Wishlist y tocá "Revisar precios ahora".</p>
          </div>
        )}

        {!loading && alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map(a => (
              <div
                key={a.id}
                className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${
                  a.is_read ? 'border-gray-800 bg-[#0f1218] opacity-60' : 'border-[#ff4655]/40 bg-[#11141b]'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{a.title}</p>
                  <p className="text-gray-400 text-[11px] mt-0.5">
                    {TYPE_LABEL[a.type] || a.type} · {a.store} · {formatPrice(a.price)}
                  </p>
                  <p className="text-gray-600 text-[10px] mt-0.5">
                    {new Date(a.triggered_at).toLocaleString('es-AR')}
                  </p>
                </div>
                {!a.is_read && (
                  <button
                    type="button"
                    onClick={() => handleRead(a.id)}
                    className="shrink-0 rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-gray-700 bg-[#1e2330] text-gray-300 hover:border-[#ff4655] hover:text-[#ff4655] transition"
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
