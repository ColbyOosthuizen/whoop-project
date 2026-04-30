import { useState } from 'react'

export default function StarRating({ currentRating, onRate, disabled }) {
  const [hovered, setHovered] = useState(0)
  const filled = hovered || currentRating || 0

  return (
    <div className="d-flex align-items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          onClick={() => !disabled && onRate(i)}
          onMouseEnter={() => !disabled && setHovered(i)}
          onMouseLeave={() => !disabled && setHovered(0)}
          style={{
            fontSize: '2rem',
            cursor: disabled ? 'default' : 'pointer',
            color: i <= filled ? '#ffc107' : '#dee2e6',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
      {currentRating && (
        <span className="text-muted ms-2 small">Your rating: {currentRating}/5</span>
      )}
    </div>
  )
}
