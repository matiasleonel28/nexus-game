import client from './client'

export const searchGames  = (q)          => client.get('/search', { params: { q } })
export const getBacklog   = (filters={}) => client.get('/backlog', { params: filters })
export const getWishlist  = ()           => client.get('/wishlist')
export const addToBacklog = (igdb_id)    => client.post('/backlog', { igdb_id })
export const addToWishlist= (igdb_id)    => client.post('/wishlist', { igdb_id })
export const updateStatus = (id, status) => client.patch(`/games/${id}`, { status })
export const deleteGame   = (id)         => client.delete(`/games/${id}`)