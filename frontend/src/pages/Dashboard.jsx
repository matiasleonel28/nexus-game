import { useState, useEffect, useCallback } from 'react'
import { getBacklog, updateStatus } from '../api/games'
import GameCard from '../components/GameCard'
import { useGameRefresh } from '../context/GameRefreshContext'

export default function Dashboard() {
  const [games, setGames]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  
  // States del nuevo UI
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDuration, setFilterDuration] = useState("all");
  const [sortOption, setSortOption] = useState("duration_asc");

  const [actioning, setActioning] = useState([])

  const { backlogVersion } = useGameRefresh()

  const fetchBacklog = useCallback(async (signal = { current: true }) => {
    if (!signal.current) return

    setLoading(true)
    setError(null)

    try {
      const data = await getBacklog({ sort: sortOption })
      if (!signal.current) return
      setGames(data)
    } catch (err) {
      if (signal.current) {
        setError(err)
      }
    } finally {
      if (signal.current) {
        setLoading(false)
      }
    }
  }, [sortOption])

  useEffect(() => {
    const signal = { current: true }
    void Promise.resolve().then(() => {
      if (signal.current) {
        void fetchBacklog(signal)
      }
    })

    return () => {
      signal.current = false
    }
  }, [fetchBacklog, backlogVersion])

  // Lógica de filtrado en el cliente para el search y la duración
  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterDuration === "short") return game.hltb_main_hours <= 10;
    if (filterDuration === "medium") return game.hltb_main_hours > 10 && game.hltb_main_hours <= 20;
    if (filterDuration === "long") return game.hltb_main_hours > 20;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header / Título de la sección */}
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">
            Backlog & Pending
          </h1>
          <p className="text-gray-500 text-xs mt-1">Gestioná y priorizá tu backlog de juegos</p>
        </div>

        {/* Barra de Búsqueda Superior */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <input 
              type="text" 
              placeholder="SEARCH BACKLOG..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-black font-semibold placeholder-gray-500 px-4 py-3 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-[#ff4655] tracking-wide text-sm"
            />
          </div>
        </div>

        {/* Filtros de Duración y Plataforma */}
        <div className="flex flex-wrap gap-4 items-center mb-8 bg-[#11141b] p-4 rounded-lg border border-gray-800">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Filter By:</span>
          
          {/* Selector de Horas */}
          <select 
            value={filterDuration}
            onChange={(e) => setFilterDuration(e.target.value)}
            className="bg-[#1e2330] border border-gray-700 text-gray-300 text-xs font-bold rounded px-3 py-1.5 focus:outline-none focus:border-[#ff4655]"
          >
            <option value="all">DURATION (ALL)</option>
            <option value="short">SHORT (0-10 HS)</option>
            <option value="medium">MEDIUM (10-20 HS)</option>
            <option value="long">LONG (+20 HS)</option>
          </select>

          {/* Selector de ordenamiento */}
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="ml-auto bg-[#1e2330] border border-gray-700 text-gray-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded transition-colors uppercase tracking-wider focus:outline-none focus:border-[#ff4655]"
          >
            <option value="duration_asc">Sort by: Duration ↑</option>
            <option value="duration_desc">Sort by: Duration ↓</option>
            <option value="value_asc">Sort by: Value ($/h) ⚡</option>
            <option value="price_asc">Sort by: Price ↑</option>
          </select>
        </div>

        {loading && <div className="text-center py-20 text-gray-500 font-bold">Cargando backlog...</div>}
        
        {/* Error State Elegante */}
        {error && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-[#0b0d12]">
            <div className="text-4xl mb-4">📡</div>
            <h3 className="text-xl font-bold text-white mb-2">Sincronización pausada</h3>
            <p className="text-gray-400 max-w-sm mb-6">{error.message || error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-[#ff4655] hover:bg-[#d63b46] text-white font-medium rounded transition"
            >
              Reintentar conexión
            </button>
          </div>
        )}

        {/* Grilla Responsiva de Tarjetas */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                actions={[
                  {
                    label: actioning.includes(`finish-${game.id}`) ? 'Marcando...' : 'Marcar Terminado ✓',
                    onClick: async () => {
                      setError(null)
                      setActioning(prev => [...prev, `finish-${game.id}`])
                      try {
                        await updateStatus(game.id, 'finished')
                        await fetchBacklog()
                      } catch (err) {
                        setError(err)
                      } finally {
                        setActioning(prev => prev.filter(key => key !== `finish-${game.id}`))
                      }
                    },
                    disabled: actioning.includes(`finish-${game.id}`),
                  },
                ]}
              />
            ))}
          </div>
        )}

        {/* Alerta si no hay resultados */}
        {!loading && !error && filteredGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">No se encontraron juegos que coincidan con los filtros o tu backlog está vacío.</p>
          </div>
        )}

      </div>
    </div>
  );
}