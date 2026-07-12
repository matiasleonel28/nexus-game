import client from './client'

export const searchGames  = (q)          => client.get('/search', { params: { q } })
export const getBacklog   = (filters={}) => client.get('/backlog', { params: filters })
export const getRecommendation = ()      => client.get('/recommend')
export const getStats     = ()           => client.get('/stats')
export const getWishlist  = ()           => client.get('/wishlist')
export const addToBacklog = (igdb_id, owned_platform) => client.post('/backlog', { igdb_id, owned_platform })
export const addToWishlist= (igdb_id)    => client.post('/wishlist', { igdb_id })
export const updateGame   = (id, patch)  => client.patch(`/games/${id}`, patch)
export const updateStatus = (id, status) => updateGame(id, { status })
export const deleteGame   = (id)         => client.delete(`/games/${id}`)