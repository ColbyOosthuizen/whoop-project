import { useState, useEffect } from 'react'
import { AuthContext } from './(C) authContextCore'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cab230_token'))

  const login = (newToken) => {
    localStorage.setItem('cab230_token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('cab230_token')
    setToken(null)
  }

  useEffect(() => {
    window.addEventListener('auth:expired', logout)
    return () => window.removeEventListener('auth:expired', logout)
  }, [])

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}
