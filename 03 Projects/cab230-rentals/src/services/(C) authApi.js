const BASE_URL = 'http://4.237.58.241:3000'

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function loginUser(email, password) {
  return handleResponse(await fetch(`${BASE_URL}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }))
}

export async function registerUser(email, password) {
  return handleResponse(await fetch(`${BASE_URL}/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }))
}
