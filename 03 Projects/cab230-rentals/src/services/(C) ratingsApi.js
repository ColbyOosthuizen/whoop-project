const BASE_URL = 'http://4.237.58.241:3000'

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function getRatedRentals(token) {
  return handleResponse(await fetch(`${BASE_URL}/ratings`, {
    headers: { Authorization: `Bearer ${token}` }
  }))
}

export async function getRatingForRental(id, token) {
  return handleResponse(await fetch(`${BASE_URL}/ratings/rentals/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }))
}

export async function submitRating(id, rating, token) {
  return handleResponse(await fetch(`${BASE_URL}/ratings/rentals/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rating })
  }))
}
