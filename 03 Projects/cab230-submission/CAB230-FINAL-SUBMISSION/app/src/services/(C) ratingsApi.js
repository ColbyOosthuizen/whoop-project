import { apiUrl, handleResponse } from './(C) apiUtils'

export async function getRatedRentals(token) {
  return handleResponse(await fetch(apiUrl('/ratings'), {
    headers: { Authorization: `Bearer ${token}` }
  }))
}

export async function getRatingForRental(id, token) {
  return handleResponse(await fetch(apiUrl(`/ratings/rentals/${id}`), {
    headers: { Authorization: `Bearer ${token}` }
  }))
}

export async function submitRating(id, rating, token) {
  return handleResponse(await fetch(apiUrl(`/ratings/rentals/${id}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rating })
  }))
}
