import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">404 — Página no encontrada</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Ups, no encontramos esa página</h1>
        <p className="mt-4 text-zinc-400">La ruta que intentaste abrir no existe. Regresa al backlog o busca un juego.</p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Volver al backlog
          </Link>
          <Link
            to="/search"
            className="rounded-full border border-zinc-700 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:border-indigo-500"
          >
            Buscar juegos
          </Link>
        </div>
      </div>
    </div>
  )
}
