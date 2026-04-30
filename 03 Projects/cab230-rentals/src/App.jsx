import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/(C) AuthContext'
import NavBar from './components/(C) NavBar'
import ProtectedRoute from './components/(C) ProtectedRoute'
import LandingPage from './pages/(C) LandingPage'
import RentalSearchPage from './pages/(C) RentalSearchPage'
import IndividualRentalPage from './pages/(C) IndividualRentalPage'
import LoginPage from './pages/(C) LoginPage'
import RegisterPage from './pages/(C) RegisterPage'
import RatedRentalsPage from './pages/(C) RatedRentalsPage'

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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
