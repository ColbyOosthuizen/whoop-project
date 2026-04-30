import { BrowserRouter, Link, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/(C) AuthContext'
import NavBar from './components/(C) NavBar'
import ProtectedRoute from './components/(C) ProtectedRoute'
import LandingPage from './pages/(C) LandingPage'
import RentalSearchPage from './pages/(C) RentalSearchPage'
import IndividualRentalPage from './pages/(C) IndividualRentalPage'
import LoginPage from './pages/(C) LoginPage'
import RegisterPage from './pages/(C) RegisterPage'
import RatedRentalsPage from './pages/(C) RatedRentalsPage'

function NotFoundPage() {
  return (
    <main className="container py-5 text-center">
      <h1 className="display-5 fw-semibold">Page not found</h1>
      <p className="text-muted mb-4">That rental page does not exist.</p>
      <Link className="btn btn-primary" to="/">Go home</Link>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<RentalSearchPage />} />
          <Route path="/rentals/:id" element={<IndividualRentalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/rated" element={
            <ProtectedRoute>
              <RatedRentalsPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
