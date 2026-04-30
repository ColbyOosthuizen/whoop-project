export default function Paginator({ currentPage, totalPages, onPrev, onNext, hasPrev, hasNext }) {
  return (
    <div className="d-flex align-items-center gap-3 my-3">
      <button className="btn btn-outline-secondary" onClick={onPrev} disabled={!hasPrev}>
        &laquo; Previous
      </button>
      <span className="text-muted">
        Page {currentPage}{totalPages ? ` of ${totalPages}` : ''}
      </span>
      <button className="btn btn-outline-secondary" onClick={onNext} disabled={!hasNext}>
        Next &raquo;
      </button>
    </div>
  )
}
