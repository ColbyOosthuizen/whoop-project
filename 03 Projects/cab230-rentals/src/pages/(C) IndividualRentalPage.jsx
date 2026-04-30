import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRentalById, searchRentals } from '../services/(C) rentalsApi'
import { getRatingForRental, submitRating } from '../services/(C) ratingsApi'
import { useAuth } from '../context/(C) AuthContext'
import RentalMap from '../components/(C) RentalMap'
import StarRating from '../components/(C) StarRating'

export default function IndividualRentalPage() {
  const { id } = useParams()
  const { isAuthenticated, token } = useAuth()
  const [rental, setRental] = useState(null)
  const [samePostcode, setSamePostcode] = useState([])
  const [currentRating, setCurrentRating] = useState(null)
  const [ratingError, setRatingError] = useState(null)
  const [ratingSuccess, setRatingSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setRental(null)
    setSamePostcode([])

    getRentalById(id)
      .then(async (data) => {
        setRental(data)
        try {
          const res = await searchRentals(data.state, null, 1)
          const all = res.rentals ?? res.data ?? (Array.isArray(res) ? res : [])
          setSamePostcode(
            all.filter(r => String(r.postcode) === String(data.postcode) && String(r.id) !== String(id)).slice(0, 5)
          )
        } catch (_) {}
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
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
  const lat = rental.latitude ?? rental.lat
  const lng = rental.longitude ?? rental.lng ?? rental.lon

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
              { label: 'Parking', value: rental.parking ?? rental.parks ?? '-' },
              { label: 'Agency', value: rental.agency ?? '-' },
            ].map(({ label, value }) => (
              <div key={label} className="col-6 col-md-4">
                <div className="card border-0 bg-light p-3 h-100">
                  <small className="text-muted">{label}</small>
                  <strong>{value}</strong>
                </div>
              </div>
            ))}
          </div>

          {rental.description && (
            <div className="mb-4">
              <h5>Description</h5>
              <p className="text-muted">{rental.description}</p>
            </div>
          )}

          <div className="mb-4">
            <h5>Rate this property</h5>
            {ratingSuccess && <div className="alert alert-success py-2">Rating saved!</div>}
            {ratingError && <div className="alert alert-danger py-2">{ratingError}</div>}
            <StarRating currentRating={currentRating} onRate={handleRate} disabled={!isAuthenticated} />
            {!isAuthenticated && (
              <p className="text-muted small mt-2">
                <Link to="/login">Log in</Link> to rate this property.
              </p>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          {lat && lng ? (
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
