import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

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

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: token !== null }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
