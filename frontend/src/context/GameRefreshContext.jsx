import { createContext, useContext, useState, useCallback } from 'react'

const GameRefreshContext = createContext(null)

export function GameRefreshProvider({ children }) {
  const [backlogVersion, setBacklogVersion] = useState(0)
  const [wishlistVersion, setWishlistVersion] = useState(0)

  const refreshBacklog = useCallback(() => {
    setBacklogVersion(value => value + 1)
  }, [])

  const refreshWishlist = useCallback(() => {
    setWishlistVersion(value => value + 1)
  }, [])

  return (
    <GameRefreshContext.Provider
      value={{ backlogVersion, wishlistVersion, refreshBacklog, refreshWishlist }}
    >
      {children}
    </GameRefreshContext.Provider>
  )
}

export function useGameRefresh() {
  const context = useContext(GameRefreshContext)
  if (!context) {
    throw new Error('useGameRefresh must be used within GameRefreshProvider')
  }
  return context
}
