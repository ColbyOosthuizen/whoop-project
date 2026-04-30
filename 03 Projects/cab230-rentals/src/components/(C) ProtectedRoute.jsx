import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/(C) authContextCore'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const from = `${location.pathname}${location.search}${location.hash}`

  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from }} />
}
