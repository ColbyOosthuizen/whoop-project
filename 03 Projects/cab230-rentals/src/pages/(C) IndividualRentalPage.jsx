import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getRentalById, searchRentals } from '../services/(C) rentalsApi'
import { getRatingForRental, submitRating } from '../services/(C) ratingsApi'
import { useAuth } from '../context/(C) authContextCore'
import RentalMap from '../components/(C) RentalMap'
import StarRating from '../components/(C) StarRating'

function formatDescription(description) {
  return String(description)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
}

export default function IndividualRentalPage() {
  const { id } = useParams()
  const location = useLocation()
  const { isAuthenticated, token } = useAuth()
  const [rental, setRental] = useState(null)
  const [samePostcode, setSamePostcode] = useState([])
  const [currentRating, setCurrentRating] = useState(null)
  const [ratingError, setRatingError] = useState(null)
  const [ratingSuccess, setRatingSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadRental() {
      setLoading(true)
      setError(null)
      setRental(null)
      setSamePostcode([])

      try {
        const data = await getRentalById(id)
        if (ignore) return
        setRental(data)

        try {
          const res = await searchRentals(data.state, null, 1)
          if (ignore) return
          const all = res.data
          setSamePostcode(
            all.filter(r => String(r.postcode) === String(data.postcode) && String(r.id) !== String(id)).slice(0, 5)
          )
        } catch {
          // Same-postcode suggestions are optional; keep the main rental page usable.
        }
      } catch (e) {
        if (!ignore) setError(e.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadRental()

    return () => {
      ignore = true
    }
  }, [id])

  useEffect(() => {
    if (!isAuthenticated || !id) return
    getRatingForRental(id, token)
      .then(data => setCurrentRating(data.rating ?? null))
      .catch(() => {})
  }, [id, isAuthenticated, token])

  const handleRate = async (value) => {
    setRatingError(null)
    setRatingSuccess(false)
    try {
      await submitRating(id, value, token)
      setCurrentRating(value)
      setRatingSuccess(true)
    } catch (e) {
      setRatingError(e.message)
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="mt-2 text-muted">Loading property...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
        <Link to="/search" className="btn btn-outline-secondary">Back to Search</Link>
      </div>
    )
  }

  if (!rental) return null

  const address = rental.streetAddress ?? rental.address ?? 'Address not available'
  const descriptionLines = rental.description ? formatDescription(rental.description) : []
  const lat = rental.latitude
  const lng = rental.longitude
  const hasMapCoordinates = lat != null && lng != null

  return (
    <div className="container py-4">
      <Link to="/search" className="text-muted text-decoration-none small">&larr; Back to search</Link>

      <div className="row mt-3">
        <div className="col-lg-8">
          <h2>{rental.title ?? address}</h2>
          <p className="text-muted fs-5">{address}, {rental.suburb}, {rental.state} {rental.postcode}</p>

          <div className="row g-3 mb-4">
            {[
              { label: 'Weekly Rent', value: rental.rent ? `$${rental.rent}` : '-' },
              { label: 'Property Type', value: rental.propertyType ?? '-' },
              { label: 'Bedrooms', value: rental.bedrooms ?? '-' },
              { label: 'Bathrooms', value: rental.bathrooms ?? '-' },
              { label: 'Parking', value: rental.parkingSpaces ?? '-' },
              { label: 'Agency', value: rental.agencyName ?? '-' },
            ].map(({ label, value }) => (
              <div key={label} className="col-6 col-md-4">
                <div className="card border-0 bg-light p-3 h-100">
                  <small className="text-muted">{label}</small>
                  <strong>{value}</strong>
                </div>
              </div>
            ))}
          </div>

          {descriptionLines.length > 0 && (
            <div className="mb-4">
              <h5>Description</h5>
              <div className="text-muted">
                {descriptionLines.map((line, index) => (
                  <p className="mb-2" key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <h5>Rate this property</h5>
            {ratingSuccess && <div className="alert alert-success py-2">Rating saved!</div>}
            {ratingError && <div className="alert alert-danger py-2">{ratingError}</div>}
            <StarRating currentRating={currentRating} onRate={handleRate} disabled={!isAuthenticated} />
            {!isAuthenticated && (
              <p className="text-muted small mt-2">
                <Link to="/login" state={{ from: `${location.pathname}${location.search}${location.hash}` }}>Log in</Link> to rate this property.
              </p>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          {hasMapCoordinates ? (
            <div className="mb-4">
              <h5>Location</h5>
              <RentalMap lat={lat} lng={lng} address={address} />
            </div>
          ) : (
            <div className="alert alert-secondary">Map not available for this property.</div>
          )}
        </div>
      </div>

      {samePostcode.length > 0 && (
        <div className="mt-4">
          <h5>Other rentals in postcode {rental.postcode}</h5>
          <ul className="list-group">
            {samePostcode.map(r => (
              <li key={r.id} className="list-group-item d-flex justify-content-between align-items-center">
                <Link to={`/rentals/${r.id}`} className="text-decoration-none">
                  {r.title ?? r.streetAddress ?? r.address}
                </Link>
                <span className="badge bg-primary rounded-pill">${r.rent}/wk</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
