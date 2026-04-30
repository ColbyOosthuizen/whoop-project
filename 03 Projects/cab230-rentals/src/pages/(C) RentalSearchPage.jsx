import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStates, getPropertyTypes, searchRentals } from '../services/(C) rentalsApi'
import RentalTable from '../components/(C) RentalTable'
import Paginator from '../components/(C) Paginator'

export default function RentalSearchPage() {
  const navigate = useNavigate()
  const [states, setStates] = useState([])
  const [propertyTypes, setPropertyTypes] = useState([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [results, setResults] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    getStates().then(data => {
      const list = data
      setStates(Array.isArray(list) ? list : [])
    }).catch(() => {})

    getPropertyTypes().then(data => {
      const list = data
      setPropertyTypes(Array.isArray(list) ? list : [])
    }).catch(() => {})
  }, [])

  const doSearch = async (page) => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchRentals(selectedState, selectedType, page)
      const rentals = data.data
      setResults(rentals)
      const pagination = data.pagination ?? {}
      if (pagination.hasNext !== undefined) {
        setHasNext(pagination.hasNext)
      } else if (pagination.nextPage !== undefined) {
        setHasNext(pagination.nextPage !== null)
      } else {
        setHasNext(rentals.length === 10)
      }
    } catch (e) {
      setError(e.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    setHasSearched(true)
    doSearch(1)
  }

  const handlePrev = () => {
    const p = currentPage - 1
    setCurrentPage(p)
    doSearch(p)
  }

  const handleNext = () => {
    const p = currentPage + 1
    setCurrentPage(p)
    doSearch(p)
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Rental Search</h2>

      <div className="card shadow-sm p-4 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label fw-semibold">State</label>
            <select className="form-select" value={selectedState} onChange={e => setSelectedState(e.target.value)}>
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Property Type</label>
            <select className="form-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
              <option value="">All Types</option>
              {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <button className="btn btn-primary w-100" onClick={handleSearch} disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" />Searching...</>
              ) : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {hasSearched && !loading && results.length === 0 && !error && (
        <div className="alert alert-info">No rentals found. Try different filters.</div>
      )}

      {results.length > 0 && (
        <>
          <RentalTable rowData={results} onRowClick={(id) => navigate(`/rentals/${id}`)} />
          <Paginator
            currentPage={currentPage}
            onPrev={handlePrev}
            onNext={handleNext}
            hasPrev={currentPage > 1}
            hasNext={hasNext}
          />
        </>
      )}
    </div>
  )
}
