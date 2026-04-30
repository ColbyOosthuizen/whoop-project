import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/(C) authApi'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await registerUser(email, password)
      navigate('/login', { state: { registered: true } })
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
            <h3 className="text-center mb-4">Create Account</h3>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creating account...</> : 'Register'}
              </button>
            </form>
            <p className="text-center text-muted mt-3 mb-0">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
