import { apiUrl, handleResponse } from './(C) apiUtils'

export async function loginUser(email, password) {
  return handleResponse(await fetch(apiUrl('/user/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }))
}

export async function registerUser(email, password) {
  return handleResponse(await fetch(apiUrl('/user/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }))
}
