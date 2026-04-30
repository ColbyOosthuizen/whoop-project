import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { loginUser } from '../services/(C) authApi'
import { useAuth } from '../context/(C) authContextCore'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const registered = location.state?.registered

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await loginUser(email, password)
      login(data.token)
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5 col-lg-4">
          <div className="card shadow-sm p-4">
            <h3 className="text-center mb-2">Login</h3>
            <p className="text-center text-muted small mb-4">
              Log in to rate properties and return to your Rated Rentals dashboard.
            </p>
            {registered && (
              <div className="alert alert-success py-2">Account created! Please log in.</div>
            )}
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="login-email" className="form-label">Email</label>
                <input
                  id="login-email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-3">
                <label htmlFor="login-password" className="form-label">Password</label>
                <input
                  id="login-password"
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Logging in...</> : 'Login'}
              </button>
            </form>
            <p className="text-center text-muted mt-3 mb-0">
              Don't have an account? <Link to="/register" state={{ from: location.state?.from }}>Sign up here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
