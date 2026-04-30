const BASE_URL = 'http://4.237.58.241:3000'

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function getStates() {
  return handleResponse(await fetch(`${BASE_URL}/rentals/states`))
}

export async function getPropertyTypes() {
  return handleResponse(await fetch(`${BASE_URL}/rentals/property-types`))
}

export async function searchRentals(state, propertyType, page = 1) {
  const params = new URLSearchParams()
  if (state) params.append('state', state)
  if (propertyType) params.append('propertyType', propertyType)
  params.append('page', page)
  return handleResponse(await fetch(`${BASE_URL}/rentals/search?${params}`))
}

export async function getRentalById(id) {
  return handleResponse(await fetch(`${BASE_URL}/rentals/${id}`))
}
