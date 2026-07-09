import client from './client'

// Precio actual + mínimo histórico por tienda (Steam/eShop/Xbox) en ARS.
// Respuesta: { title, stores: { steam: {current, lowest, cut, currency, url}, ... } }
export const getHunterPrices = (title) => client.get('/hunter/prices', { params: { title } })

// Precios combinados por juego (Steam/Xbox vía ITAD + eShop vía Nintendo)
export const getGamePrices = (gameId)    => client.get(`/hunter/game/${gameId}/prices`)
// Vincular eShop: pegar link del juego en el eShop de EE.UU. -> extrae y cachea el nsuid
export const resolveEshop  = (gameId, url) => client.post('/hunter/eshop/resolve', { game_id: gameId, url })

// Monitor de precios (watches + alertas)
export const evaluateWatches = ()       => client.post('/hunter/evaluate')
export const getAlerts       = (unread) => client.get('/hunter/alerts', { params: unread ? { unread: true } : {} })
export const markAlertRead   = (id)     => client.post(`/hunter/alerts/${id}/read`)
