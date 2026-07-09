import client from './client'

// Precio actual + mínimo histórico por tienda (Steam/eShop/Xbox) en ARS.
// Respuesta: { title, stores: { steam: {current, lowest, cut, currency, url}, ... } }
export const getHunterPrices = (title) => client.get('/hunter/prices', { params: { title } })

// Monitor de precios (watches + alertas)
export const evaluateWatches = ()       => client.post('/hunter/evaluate')
export const getAlerts       = (unread) => client.get('/hunter/alerts', { params: unread ? { unread: true } : {} })
export const markAlertRead   = (id)     => client.post(`/hunter/alerts/${id}/read`)
