import { apiUrl, handleResponse } from './(C) apiUtils'

export async function getStates() {
  return handleResponse(await fetch(apiUrl('/rentals/states')))
}

export async function getPropertyTypes() {
  return handleResponse(await fetch(apiUrl('/rentals/property-types')))
}

export async function searchRentals({ state, propertyType, postcode, page = 1, sortBy, sortOrder } = {}) {
  const params = new URLSearchParams()
  if (state) params.append('state', state)
  if (propertyType) params.append('propertyType', propertyType)
  if (postcode) params.append('postcode', postcode)
  if (sortBy) params.append('sortBy', sortBy)
  if (sortOrder) params.append('sortOrder', sortOrder)
  params.append('page', page)
  return handleResponse(await fetch(apiUrl(`/rentals/search?${params}`)))
}

export async function getRentalById(id) {
  return handleResponse(await fetch(apiUrl(`/rentals/${id}`)))
}
