import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';

const GENRES = [
  "Adventure",
  "Puzzle",
  "RPG narrativo",
  "RPG",
  "Shooter",
  "Fighting",
  "Platform",
  "Hack and slash/Beat 'em up",
  "Tactical",
  "Indie",
  "Strategy",
  "Souls-like"
];

export default function UserOnboarding() {
  const { user, refetchUser } = useAuth();
  
  // Si el usuario no está cargado o ya tiene las preferencias, no renderizamos el modal.
  if (!user || (user.available_hours_per_week !== null && user.stress_level_tolerance !== null)) {
    return null;
  }

  // Hide if dismissed 3 or more times
  if (user.onboarding_dismissed_count >= 3) {
    return null;
  }

  const [hours, setHours] = useState('');
  const [stress, setStress] = useState('');
  const [genres, setGenres] = useState([]);
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
        stress_level_tolerance: stress || null,
        preferred_genres: JSON.stringify(genres)
      });
      if (refetchUser) {
        await refetchUser();
      } else {
        window.location.reload();
      }
      addToast('Perfil guardado exitosamente');
    } catch (err) {
      setError('Ocurrió un error al guardar tus preferencias. Por favor, intenta de nuevo.');
      addToast('Error al guardar perfil', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await apiClient.patch('/auth/me', {
        onboarding_dismissed_count: (user.onboarding_dismissed_count || 0) + 1
      });
      if (refetchUser) {
        await refetchUser();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError('Ocurrió un error. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGenre = (g) => {
    if (genres.includes(g)) {
      setGenres(genres.filter((x) => x !== g));
    } else {
      setGenres([...genres, g]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--surface)] border border-[var(--line)] rounded-lg shadow-2xl p-6 relative">
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
              ¿Qué tipo de experiencia buscás?
            </label>
            <select
              id="stress"
              required
              value={stress}
              onChange={(e) => setStress(e.target.value)}
              className="w-full rounded bg-[var(--ink)] border border-[var(--line)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="" disabled>Seleccioná una opción...</option>
              <option value="baja">Relajante (exploración, puzzle, narrativa sin presión)</option>
              <option value="media">Equilibrada (retos justos, acción moderada)</option>
              <option value="alta">Desafiante (Souls-like, competitivo, alta dificultad)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              ¿Qué géneros te gustan?
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    genres.includes(g)
                      ? 'bg-[var(--accent)] text-[var(--ink)] border-[var(--accent)]'
                      : 'bg-[var(--ink)] text-[var(--muted)] border-[var(--line)] hover:border-[var(--accent)]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !hours || !stress}
              className="w-full rounded bg-[var(--accent)] text-[var(--ink)] px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Comenzar'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isSubmitting}
              className="w-full rounded bg-transparent text-[var(--muted)] px-4 py-2 text-sm font-semibold hover:text-[var(--text)] transition-colors disabled:opacity-50"
            >
              Más tarde
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
