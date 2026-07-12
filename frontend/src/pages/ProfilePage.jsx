import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'
import { useToast } from '../context/ToastContext'

const EXPERIENCE_OPTIONS = [
  { value: 'baja', label: 'Relajante', desc: 'Exploración, puzzle, narrativa sin presión' },
  { value: 'media', label: 'Equilibrada', desc: 'Retos justos, acción moderada' },
  { value: 'alta', label: 'Desafiante', desc: 'Souls-like, competitivo, alta dificultad' },
]

const GENRE_OPTIONS = [
  'RPG', 'Adventure', 'Shooter', 'Platform', 'Puzzle', 'Strategy',
  'Indie', 'Simulator', 'Racing', 'Sport', 'Fighting',
  "Hack and slash/Beat 'em up", 'Visual Novel', 'Turn-based strategy',
  'Point-and-click', 'Real Time Strategy',
]

export default function ProfilePage() {
  const { user, refetchUser } = useAuth()
  const { addToast } = useToast()

  const [hours, setHours] = useState('')
  const [experience, setExperience] = useState('')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setHours(user.available_hours_per_week != null ? String(user.available_hours_per_week) : '')
      setExperience(user.stress_level_tolerance || '')
      try {
        setSelectedGenres(user.preferred_genres ? JSON.parse(user.preferred_genres) : [])
      } catch (e) {
        setSelectedGenres([])
      }
    }
  }, [user])

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiClient.patch('/auth/me', {
        available_hours_per_week: hours ? parseInt(hours, 10) : null,
        stress_level_tolerance: experience || null,
        preferred_genres: selectedGenres.length > 0 ? JSON.stringify(selectedGenres) : null,
      })
      if (refetchUser) await refetchUser()
      addToast('Preferencias guardadas')
    } catch {
      addToast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--ink)] text-[var(--text)] p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black uppercase tracking-wider text-[var(--text)]">Mi Perfil</h1>
          <p className="text-[var(--muted)] text-xs mt-1">Tus preferencias de juego</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-6">
          <div className="mb-6 pb-4 border-b border-[var(--line)]">
            <p className="text-[var(--muted)] text-[10px] uppercase tracking-[0.15em] font-semibold mb-1">Email</p>
            <p className="text-[var(--text)] text-sm">{user?.email}</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="profile-hours" className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">
                Horas disponibles por semana
              </label>
              <input
                id="profile-hours"
                type="number"
                min="1"
                max="168"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full max-w-xs rounded bg-[var(--ink)] border border-[var(--line)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-num"
                placeholder="Ej: 10"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                ¿Qué tipo de experiencia buscás?
              </p>
              <div className="grid gap-2">
                {EXPERIENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperience(opt.value)}
                    className={`w-full text-left rounded border px-4 py-3 transition-all ${
                      experience === opt.value
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[var(--line)] bg-[var(--ink)] hover:border-[var(--accent)]/50'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${experience === opt.value ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>
                      {opt.label}
                    </span>
                    <span className="block text-xs text-[var(--muted)] mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Géneros favoritos
              </p>
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border transition-all ${
                      selectedGenres.includes(genre)
                        ? 'bg-[var(--accent)] text-[var(--ink)] border-[var(--accent)]'
                        : 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--text)]'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded bg-[var(--accent)] text-[var(--ink)] px-6 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
