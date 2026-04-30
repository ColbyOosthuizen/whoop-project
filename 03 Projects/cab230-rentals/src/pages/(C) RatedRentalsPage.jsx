import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRatedRentals } from '../services/(C) ratingsApi'
import { useAuth } from '../context/(C) AuthContext'
import Paginator from '../components/(C) Paginator'

const PAGE_SIZE = 20

export default function RatedRentalsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [allRatings, setAllRatings] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getRatedRentals(token)
      .then(data => {
        const ratings = data.ratings ?? data.data ?? (Array.isArray(data) ? data : [])
        setAllRatings(ratings)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const totalPages = Math.max(1, Math.ceil(allRatings.length / PAGE_SIZE))
  const pageData = allRatings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="mt-2 text-muted">Loading your rated rentals...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">My Rated Rentals</h2>

      {allRatings.length === 0 ? (
        <div className="alert alert-info">
          You haven't rated any rentals yet. <a href="/search">Search for properties</a> to get started.
        </div>
      ) : (
        <>
          <p className="text-muted">{allRatings.length} rated {allRatings.length === 1 ? 'property' : 'properties'}</p>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Property</th>
                  <th>Suburb</th>
                  <th>State</th>
                  <th>Your Rating</th>
                  <th>Date Rated</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((r, i) => (
                  <tr
                    key={r.id ?? r.rental_id ?? i}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/rentals/${r.rental_id ?? r.id}`)}
                  >
                    <td>{r.title ?? r.address ?? r.streetAddress ?? 'Property'}</td>
                    <td>{r.suburb ?? '-'}</td>
                    <td>{r.state ?? '-'}</td>
                    <td>
                      <span style={{ color: '#ffc107', fontSize: '1.1rem' }}>
                        {'★'.repeat(r.rating ?? 0)}
                      </span>
                      <span style={{ color: '#dee2e6', fontSize: '1.1rem' }}>
                        {'★'.repeat(5 - (r.rating ?? 0))}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator
            currentPage={currentPage}
            onPrev={() => setCurrentPage(p => p - 1)}
            onNext={() => setCurrentPage(p => p + 1)}
            hasPrev={currentPage > 1}
            hasNext={currentPage < totalPages}
          />
        </>
      )}
    </div>
  )
}
