import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';

export default function UserOnboarding() {
  const { user, refetchUser } = useAuth();
  
  // Si el usuario no está cargado o ya tiene las preferencias, no renderizamos el modal.
  if (!user || (user.available_hours_per_week !== null && user.stress_level_tolerance !== null)) {
    return null;
  }

  const [hours, setHours] = useState('');
  const [stress, setStress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await apiClient.patch('/auth/me', {
        available_hours_per_week: hours ? parseInt(hours, 10) : null,
        stress_level_tolerance: stress || null
      });
      // Refrescar el usuario en el contexto para ocultar el modal
      if (refetchUser) {
        await refetchUser();
      } else {
        // Fallback si no hay refetchUser: recargar para forzar el flujo
        window.location.reload();
      }
      addToast('Perfil guardado');
    } catch (err) {
      setError('Ocurrió un error al guardar tus preferencias. Por favor, intenta de nuevo.');
      addToast('Error al guardar perfil', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-lg shadow-2xl p-6">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text)] mb-2">¡Bienvenido a Nexus!</h2>
          <p className="text-sm text-[var(--muted)]">
            Para personalizar tu experiencia, contanos un poco sobre tus hábitos de juego.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded p-3 bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="hours" className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">
              Horas disponibles (semanales)
            </label>
            <input
              id="hours"
              type="number"
              min="1"
              max="168"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full rounded bg-[var(--ink)] border border-[var(--line)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-num"
              placeholder="Ej: 10"
            />
          </div>

          <div>
            <label htmlFor="stress" className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">
              Tolerancia al estrés
            </label>
            <select
              id="stress"
              required
              value={stress}
              onChange={(e) => setStress(e.target.value)}
              className="w-full rounded bg-[var(--ink)] border border-[var(--line)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="" disabled>Seleccioná una opción...</option>
              <option value="baja">Baja (Prefiero juegos relajantes, sin mucha penalización)</option>
              <option value="media">Media (Me gustan los retos justos, algo equilibrado)</option>
              <option value="alta">Alta (Busco dificultad extrema, Souls-like, no me molesta frustrarme)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !hours || !stress}
            className="w-full rounded bg-[var(--accent)] text-[var(--ink)] px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? 'Guardando...' : 'Comenzar'}
          </button>
        </form>
      </div>
    </div>
  );
}
