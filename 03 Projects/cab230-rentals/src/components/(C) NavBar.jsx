import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/(C) AuthContext'

export default function NavBar() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">CAB230 Rentals</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
            <li className="nav-item"><a className="nav-link" href="/#about">About</a></li>
            <li className="nav-item"><Link className="nav-link" to="/search">Rental Search</Link></li>
            {isAuthenticated ? (
              <>
                <li className="nav-item"><Link className="nav-link" to="/rated">Rated Rentals</Link></li>
                <li className="nav-item">
                  <button className="btn btn-outline-light btn-sm ms-2" onClick={handleLogout}>Log Out</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><Link className="nav-link" to="/register">Register</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
