// Plataformas propias (tu copia del juego), distintas de las de IGDB
export const PLATFORMS = [
  { value: 'pc', label: 'PC / Steam' },
  { value: 'pc_xbox', label: 'PC / Xbox' },
  { value: 'pc_other', label: 'PC / Otro (Epic, GOG…)' },
  { value: 'switch2', label: 'Switch 2' },
  { value: 'xbox', label: 'Xbox' },
  { value: 'ps5', label: 'PS5' },
]

// Estados de la biblioteca (Módulo Manager)
export const LIBRARY_STATUSES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'jugando', label: 'Jugando' },
  { value: 'completado', label: 'Completado' },
  { value: 'abandonado', label: 'Abandonado' },
]

export const platformLabel = (v) => PLATFORMS.find(p => p.value === v)?.label ?? null
export const statusLabel = (v) => LIBRARY_STATUSES.find(s => s.value === v)?.label ?? v
