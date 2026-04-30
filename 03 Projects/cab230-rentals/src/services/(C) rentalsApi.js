import { apiUrl, handleResponse } from './(C) apiUtils'

export async function getStates() {
  return handleResponse(await fetch(apiUrl('/rentals/states')))
}

export async function getPropertyTypes() {
  return handleResponse(await fetch(apiUrl('/rentals/property-types')))
}

export async function searchRentals(state, propertyType, page = 1) {
  const params = new URLSearchParams()
  if (state) params.append('state', state)
  if (propertyType) params.append('propertyType', propertyType)
  params.append('page', page)
  return handleResponse(await fetch(apiUrl(`/rentals/search?${params}`)))
}

export async function getRentalById(id) {
  return handleResponse(await fetch(apiUrl(`/rentals/${id}`)))
}
