import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div>
      <div
        className="text-white text-center d-flex align-items-center justify-content-center"
        style={{
          minHeight: '70vh',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        <div className="container">
          <h1 className="display-3 fw-bold mb-3">Find Your Next Home</h1>
          <p className="lead mb-4 text-white-50">
            Search thousands of rental properties across Australia
          </p>
          <Link to="/search" className="btn btn-primary btn-lg px-5">
            Start Searching
          </Link>
        </div>
      </div>

      <div id="about" className="bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center">
              <h2 className="mb-4">About</h2>
              <p className="lead">
                CAB230 Rentals is a property search platform that helps you find rental
                properties across Australia. Browse listings by state and property type,
                view detailed property information including location maps, and rate properties
                you're interested in.
              </p>
              <p className="text-muted">
                Create a free account to rate properties and track everything you've reviewed
                in your Rated Rentals dashboard.
              </p>
              <div className="row mt-4 g-4">
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm p-3">
                    <h5>Search</h5>
                    <p className="text-muted small">Filter by state and property type to find exactly what you're looking for.</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm p-3">
                    <h5>Explore</h5>
                    <p className="text-muted small">View property details, maps, and nearby listings in the same postcode.</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm p-3">
                    <h5>Rate</h5>
                    <p className="text-muted small">Rate properties and keep track of your favourites in one place.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
