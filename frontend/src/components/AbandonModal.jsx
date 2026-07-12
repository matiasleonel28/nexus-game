import { useState, useEffect } from 'react';

const MOTIVATIONAL_QUOTES = [
  "Tu tiempo vale más que un juego malo.",
  "A otra cosa mariposa.",
  "La vida es muy corta para jugar cosas que no disfrutas.",
  "Hay miles de juegos excelentes esperando por vos.",
  "Abandonar a tiempo es una victoria."
];

export default function AbandonModal({ open, game, onConfirm, onCancel, busy }) {
  const [reason, setReason] = useState('');
  const [quote, setQuote] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-lg shadow-2xl p-6 relative">
        <h2 className="text-xl font-black uppercase tracking-wider text-white mb-2">Abandonar juego</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Estás por abandonar <strong className="text-[var(--text)]">{game?.title}</strong>.
        </p>
        
        <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded p-3 mb-4 text-center">
          <p className="text-[var(--accent)] font-semibold text-sm italic">
            "{quote}"
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
            ¿Por qué lo abandonás? (Opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-24 bg-[var(--ink)] border border-[var(--line)] rounded px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-none"
            placeholder="Ej: Mucho grindeo, aburrido, historia floja..."
            maxLength={500}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-white transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onConfirm(reason)}
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-[var(--danger)] text-white rounded hover:bg-[var(--danger)]/90 transition-colors disabled:opacity-50"
          >
            {busy ? 'Guardando...' : 'Confirmar abandono'}
          </button>
        </div>
      </div>
    </div>
  );
}
