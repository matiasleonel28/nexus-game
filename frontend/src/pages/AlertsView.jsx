import { useState, useEffect, useCallback } from 'react'
import { getAlerts, markAlertRead, evaluateWatches } from '../api/hunter'
import { formatPrice } from '../constants'
import { useToast } from '../context/ToastContext'

const TYPE_LABEL = {
  target_reached: 'Bajó de tu precio objetivo',
  historical_low: 'Tocó su mínimo histórico',
}

const TYPE_ICON = {
  target_reached: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1 text-[var(--accent)]">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  historical_low: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1 text-[var(--positive)]">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
}

export default function AlertsView() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState(null)
  
  const { addToast } = useToast()

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
      addToast(err.message, 'error')
    } finally {
      setChecking(false)
    }
  }

  const handleRead = async (id) => {
    try {
      await markAlertRead(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
      addToast('Alerta marcada como leída')
    } catch (err) {
      setError(err)
      addToast(err.message, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--ink)] text-white p-6 font-sans">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)] font-bold">Hunter</p>
            <h1 className="text-3xl font-black uppercase tracking-wider text-white">Alertas</h1>
            <p className="text-[var(--muted)] text-xs mt-1">Cuando un juego vigilado baja de tu objetivo o toca su mínimo histórico</p>
          </div>
          <button
            type="button"
            onClick={handleCheckNow}
            disabled={checking}
            className="shrink-0 rounded bg-[var(--accent)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? 'Revisando...' : 'Revisar precios ahora'}
          </button>
        </div>

        {notice && (
          <div className="mb-4 rounded border border-[var(--positive)]/30 bg-[var(--positive)]/5 px-4 py-3 text-[var(--positive)] text-sm font-semibold">{notice}</div>
        )}
        {error && (
          <div className="mb-4 rounded border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-4 py-3 text-[var(--danger)] text-sm font-semibold">{error.message || String(error)}</div>
        )}

        {loading && <div className="text-center py-16 text-[var(--muted)] font-bold">Cargando alertas...</div>}

        {!loading && alerts.length === 0 && !error && (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center text-[var(--muted)]">
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
                  a.is_read ? 'border-[var(--line)] bg-[var(--surface-3)] opacity-60' : 'border-[var(--accent)]/40 bg-[var(--surface)]'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{a.title}</p>
                  <p className="text-[var(--muted)] text-[11px] mt-0.5 flex items-center">
                    {TYPE_ICON[a.type]}{TYPE_LABEL[a.type] || a.type} · {a.store} · <span className="font-num ml-1">{formatPrice(a.price)}</span>
                  </p>
                  <p className="text-[var(--muted)] text-[10px] mt-0.5">
                    {new Date(a.triggered_at).toLocaleString('es-AR')}
                  </p>
                </div>
                {!a.is_read && (
                  <button
                    type="button"
                    onClick={() => handleRead(a.id)}
                    className="shrink-0 rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-[var(--line)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
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
