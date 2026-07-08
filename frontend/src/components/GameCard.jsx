function getButtonClass(variant = 'primary') {
  const base = 'w-full rounded mt-3 px-3 py-2 text-xs font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60'
  if (variant === 'danger') {
    return `${base} border border-red-600 bg-transparent text-[#ff4655] hover:bg-red-600 hover:text-white`
  }
  if (variant === 'secondary') {
    return `${base} border border-gray-700 bg-[#1e2330] text-gray-300 hover:border-[#ff4655] hover:text-[#ff4655]`
  }
  return `${base} bg-[#ff4655] text-white hover:bg-red-600`
}

export default function GameCard({ game, actions = [] }) {
  const getHighResCover = (url) => {
    if (!url) return "https://via.placeholder.com/264x352?text=No+Cover";
    const cleanUrl = url.startsWith('//') ? `https:${url}` : url;
    return cleanUrl.replace('t_thumb', 't_cover_big');
  };

  const isSearch = !game.status;

  return (
    <div className="flex flex-col bg-[#11141b] border border-gray-800 rounded-lg overflow-hidden hover:border-[#ff4655] transition-all duration-300 shadow-xl group">
      
      {/* Contenedor de la Carátula */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-900">
        <img 
          src={getHighResCover(game.cover_url)} 
          alt={`Carátula de ${game.title}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Badge flotante si tiene Coop */}
        {game.has_coop && (
          <span className="absolute top-2 right-2 bg-[#ff4655] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow">
            Co-op
          </span>
        )}
      </div>

      {/* Cuerpo de la Tarjeta */}
      <div className="p-4 flex flex-col flex-grow justify-between bg-[#11141b]">
        <div>
          {/* Título del Juego */}
          <h3 className="text-white font-bold text-base line-clamp-1 group-hover:text-[#ff4655] transition-colors" title={game.title}>
            {game.title}
          </h3>
          
          {/* Sección HLTB */}
          {!isSearch && (
            <div className="mt-3 flex justify-between items-end">
              <div>
                <p className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold">
                  Main Story
                </p>
                <p className="text-[#ff4655] text-2xl font-black mt-0.5 leading-none">
                  {game.hltb_main_hours ? `${game.hltb_main_hours}H` : '--'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">
                  100%
                </p>
                <p className="text-white text-sm font-bold mt-0.5 leading-none">
                  {game.hltb_completionist_hours ? `${game.hltb_completionist_hours}H` : '--'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          {/* Sección Inferior: Plataformas y Precio */}
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
            {/* Plataformas */}
            <div className="flex gap-1.5 flex-wrap">
              {game.platforms?.map((plat) => (
                <span 
                  key={plat} 
                  className="bg-[#1e2330] text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded"
                >
                  {plat}
                </span>
              ))}
            </div>
            
            {/* Precio (Si no es búsqueda) */}
            {!isSearch && (
              <div className="text-right flex flex-col items-end">
                <p className="text-white text-xs font-bold">
                  {game.current_price != null ? `$${game.current_price.toFixed(2)}` : 'Sin precio'}
                </p>
                {game.current_price != null && game.price_store && (
                  <span className="text-gray-500 text-[10px] font-semibold uppercase">{game.price_store}</span>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción (dinámicos según la vista) */}
          {actions.length > 0 && (
            <div className="mt-1 grid gap-2">
              {actions.map((action, index) => (
                <button
                  key={`${action.label}-${index}`}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={getButtonClass(action.variant)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}