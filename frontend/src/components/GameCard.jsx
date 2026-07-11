import { platformLabel, formatPrice, PLATFORM_TO_STORE } from '../constants'

function getButtonClass(variant = 'primary') {
  const base = 'w-full rounded mt-3 px-3 py-2 text-xs font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60'
  if (variant === 'danger') {
    return `${base} border border-[var(--danger)]/60 bg-transparent text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white`
  }
  if (variant === 'secondary') {
    return `${base} border border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]`
  }
  return `${base} bg-[var(--accent)] text-[var(--ink)] hover:bg-[var(--accent-strong)]`
}

export default function GameCard({ game, actions = [], controls = null, onDelete = null, showOwnedPlatform = true }) {
  const getHighResCover = (url) => {
    if (!url) return "https://via.placeholder.com/264x352?text=No+Cover";
    const cleanUrl = url.startsWith('//') ? `https:${url}` : url;
    return cleanUrl.replace('t_thumb', 't_cover_big');
  };

  const isSearch = !game.status;
  const ownedLabel = platformLabel(game.owned_platform);
  const preferredStore = PLATFORM_TO_STORE[game.owned_platform];
  // Match si es la tienda exacta O si es PC y la tienda es PC compatible (steam/xbox)
  const isMatch = game.price_store === preferredStore || (game.owned_platform?.startsWith('pc') && ['steam', 'xbox'].includes(game.price_store));
  const isUnownedOrCollection = !game.owned_platform || game.owned_platform === 'ps5';
  const priceColor = isMatch ? 'text-[var(--positive)] font-bold drop-shadow-[0_0_5px_rgba(var(--positive-rgb),0.3)]' : (isUnownedOrCollection ? 'text-[var(--muted)] opacity-70' : 'text-[var(--text)]');

  return (
    <div className="flex flex-col bg-[var(--surface)] border border-[var(--line)] rounded-lg overflow-hidden hover:border-[var(--accent)] transition-colors duration-200 group">

      {/* Carátula */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--surface-3)]">
        <img
          src={getHighResCover(game.cover_url)}
          alt={`Carátula de ${game.title}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {game.has_coop && (
          <span className="absolute top-2 right-2 bg-[var(--accent)] text-[var(--ink)] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Co-op
          </span>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title="Eliminar"
            aria-label="Eliminar"
            className="absolute top-2 left-2 z-10 rounded bg-black/60 text-gray-200 p-1.5 backdrop-blur-sm opacity-80 hover:opacity-100 hover:bg-[var(--danger)] hover:text-white transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Cuerpo */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-[var(--text)] font-semibold text-base line-clamp-1 group-hover:text-[var(--accent)] transition-colors" title={game.title}>
            {game.title}
          </h3>

          {/* Tu plataforma */}
          {!isSearch && showOwnedPlatform && (
            <div className="mt-1.5">
              {ownedLabel ? (
                <span className="inline-block bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {ownedLabel}
                </span>
              ) : (
                <span className="inline-block bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--line)] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Sin plataforma
                </span>
              )}
            </div>
          )}

          {/* Firma: horas HLTB en mono tabular */}
          {!isSearch && (
            <div className="mt-4 flex justify-between items-end">
              <div>
                <p className="text-[var(--muted)] text-[10px] uppercase tracking-[0.15em] font-semibold mb-1">Historia</p>
                <p className="font-num text-[var(--accent)] text-3xl leading-none">
                  {game.hltb_main_hours ? game.hltb_main_hours : '—'}
                  {game.hltb_main_hours ? <span className="text-[var(--muted)] text-base ml-0.5">h</span> : null}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[var(--muted)] text-[10px] uppercase tracking-[0.15em] font-semibold mb-1">100%</p>
                <p className="font-num text-[var(--text)] text-lg leading-none">
                  {game.hltb_completionist_hours ? `${game.hltb_completionist_hours}h` : '—'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          {/* Plataformas IGDB + precio */}
          <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between gap-2">
            <div className="flex gap-1.5 flex-wrap">
              {game.platforms?.map((plat) => (
                <span key={plat} className="bg-[var(--surface-2)] text-[var(--muted)] text-[10px] font-bold px-2 py-0.5 rounded">
                  {plat}
                </span>
              ))}
            </div>

            {!isSearch && (
              <div className={`text-right flex flex-col items-end shrink-0 transition-all ${priceColor}`}>
                <p className="font-num text-sm">
                  {game.current_price != null ? formatPrice(game.current_price, game.price_currency) : <span className="text-[var(--muted)] font-sans opacity-100 font-normal text-xs drop-shadow-none">Sin precio</span>}
                </p>
                {game.current_price != null && game.price_store && (
                  <span className={`text-[10px] font-semibold uppercase ${isMatch ? 'text-[var(--positive)] opacity-90' : 'text-[var(--muted)]'}`}>
                    {game.price_store} {isMatch && '✓'}
                  </span>
                )}
              </div>
            )}
          </div>

          {controls}

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
