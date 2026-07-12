import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--ink)] text-white">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">404 — Página no encontrada</p>
        <h1 className="mt-4 text-4xl font-bold text-[var(--text)]">Ups, no encontramos esa página</h1>
        <p className="mt-4 text-[var(--muted)]">La ruta que intentaste abrir no existe. Regresa al backlog o busca un juego.</p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/"
            className="rounded bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--accent-strong)]"
          >
            Volver al backlog
          </Link>
          <Link
            to="/search"
            className="rounded border border-[var(--line)] bg-transparent px-6 py-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Buscar juegos
          </Link>
        </div>
      </div>
    </div>
  )
}
