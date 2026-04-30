import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStates, getPropertyTypes } from '../services/(C) rentalsApi'
import RentalTable from '../components/(C) RentalTable'

export default function RentalSearchPage() {
  const navigate = useNavigate()
  const [states, setStates] = useState([])
  const [propertyTypes, setPropertyTypes] = useState([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [postcode, setPostcode] = useState('')
  const [activeFilters, setActiveFilters] = useState(null)

  useEffect(() => {
    getStates().then(data => setStates(Array.isArray(data) ? data : [])).catch(() => {})
    getPropertyTypes().then(data => setPropertyTypes(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const handleSearch = () => {
    setActiveFilters({ state: selectedState, propertyType: selectedType, postcode })
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Rental Search</h2>

      <div className="card shadow-sm p-4 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label htmlFor="state-select" className="form-label fw-semibold">State</label>
            <select
              id="state-select"
              className="form-select"
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
            >
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label htmlFor="type-select" className="form-label fw-semibold">Property Type</label>
            <select
              id="type-select"
              className="form-select"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label htmlFor="postcode-input" className="form-label fw-semibold">Postcode</label>
            <input
              id="postcode-input"
              type="text"
              className="form-control"
              placeholder="e.g. 4000"
              value={postcode}
              onChange={e => setPostcode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>

      {activeFilters === null ? (
        <p className="text-muted text-center py-5">Use the filters above to search for rentals.</p>
      ) : (
        <RentalTable
          filters={activeFilters}
          onRowClick={id => navigate(`/rentals/${id}`)}
        />
      )}
    </div>
  )
}
