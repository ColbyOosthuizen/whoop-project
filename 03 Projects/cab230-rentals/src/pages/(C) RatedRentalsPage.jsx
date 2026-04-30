import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getRatedRentals } from '../services/(C) ratingsApi'
import { getRentalById } from '../services/(C) rentalsApi'
import { useAuth } from '../context/(C) authContextCore'
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
    async function load() {
      try {
        const data = await getRatedRentals(token)
        const ratings = data.data ?? []
        const enriched = await Promise.all(
          ratings.map(async r => {
            try {
              const rental = await getRentalById(r.rentalId)
              return { ...rental, id: r.rentalId, rating: r.rating, dateTime: r.dateTime }
            } catch {
              return { id: r.rentalId, rating: r.rating, dateTime: r.dateTime }
            }
          })
        )
        setAllRatings(enriched)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
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
          You haven't rated any rentals yet. <Link to="/search">Search for properties</Link> to get started.
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
                    key={r.id ?? i}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/rentals/${r.id}`)}
                  >
                    <td>{r.title ?? r.streetAddress ?? 'Property'}</td>
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
                      {r.dateTime ? new Date(r.dateTime).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages}
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
