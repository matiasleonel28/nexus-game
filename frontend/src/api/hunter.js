import client from './client'

// Precio actual + mínimo histórico por tienda (Steam/eShop/Xbox) en ARS.
// Respuesta: { title, stores: { steam: {current, lowest, cut, currency, url}, ... } }
export const getHunterPrices = (title) => client.get('/hunter/prices', { params: { title } })
