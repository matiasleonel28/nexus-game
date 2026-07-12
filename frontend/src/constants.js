// Plataformas propias (tu copia del juego), distintas de las de IGDB
export const PLATFORMS = [
  { value: 'pc', label: 'PC / Steam' },
  { value: 'pc_xbox', label: 'PC / Xbox' },
  { value: 'pc_other', label: 'PC / Otro (Epic, GOG…)' },
  { value: 'switch', label: 'Switch' },
  { value: 'switch2', label: 'Switch 2' },
  { value: 'xbox', label: 'Xbox' },
  { value: 'ps5', label: 'PS5' },
]

// Estados de la biblioteca (Módulo Manager)
export const LIBRARY_STATUSES = [
  { value: 'backlog', label: 'Pendiente' },
  { value: 'playing', label: 'Jugando' },
  { value: 'completed', label: 'Completado' },
  { value: 'abandoned', label: 'Abandonado' },
]

export const STORES = [
  { key: 'steam', label: 'Steam' },
  { key: 'eshop', label: 'Nintendo eShop' },
  { key: 'xbox', label: 'Xbox Store' },
]

export const PLATFORM_TO_STORE = {
  'pc': 'steam',
  'pc_xbox': 'xbox',
  'pc_other': 'steam',
  'switch': 'eshop',
  'switch2': 'eshop',
  'xbox': 'xbox',
  'ps5': null,
}

// Mapea label IGDB (lo que devuelve la búsqueda) → values de PLATFORMS que aplican
const IGDB_TO_OWNED = {
  'PC':          ['pc', 'pc_xbox', 'pc_other'],
  'PS4':         ['ps5'],
  'PS5':         ['ps5'],
  'Switch':      ['switch'],
  'Switch 2':    ['switch2'],
  'Xbox One':    ['xbox'],
  'Xbox Series': ['xbox'],
}

export const platformsForGame = (igdbLabels = []) => {
  const values = new Set()
  for (const label of igdbLabels) {
    for (const v of (IGDB_TO_OWNED[label] ?? [])) values.add(v)
  }
  const filtered = PLATFORMS.filter(p => values.has(p.value))
  return filtered.length ? filtered : PLATFORMS
}

export const platformLabel = (v) => PLATFORMS.find(p => p.value === v)?.label ?? null
export const statusLabel = (v) => LIBRARY_STATUSES.find(s => s.value === v)?.label ?? v

// Formatea un monto en la moneda dada (por defecto ARS, locale es-AR)
export const formatPrice = (amount, currency = 'ARS') => {
  if (amount == null) return null
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
  } catch {
    return `$${Number(amount).toFixed(2)}`
  }
}
