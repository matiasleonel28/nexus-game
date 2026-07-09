import { useEffect } from 'react'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  busy = false,
}) {
  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-gray-800 bg-[var(--surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl leading-none">⚠️</span>
          <h3 className="text-lg font-black uppercase tracking-wider text-white leading-tight">
            {title}
          </h3>
        </div>

        <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded px-4 py-2 text-xs font-bold uppercase tracking-wider border border-gray-700 bg-[var(--surface-2)] text-gray-300 hover:border-[var(--accent)] hover:text-[var(--accent)] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[var(--danger)] text-white hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
