export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  const borderColor = {
    success: 'var(--positive)',
    error: 'var(--danger)',
    warning: 'var(--accent)',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg
                     bg-[var(--surface)] border border-[var(--line)] text-[var(--text)] text-sm
                     animate-[toast-in_0.25s_ease-out]"
          style={{ borderLeftWidth: '4px', borderLeftColor: borderColor[toast.type] || borderColor.success }}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-[var(--muted)] hover:text-[var(--text)] transition-colors shrink-0"
            aria-label="Cerrar"
          >
            {/* SVG X icon (Lucide) */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
