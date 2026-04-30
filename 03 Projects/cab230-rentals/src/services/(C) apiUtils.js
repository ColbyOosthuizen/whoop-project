const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://4.237.58.241:3000'

export async function handleResponse(res) {
  if (res.status === 401) {
    // Broadcast so AuthProvider can clear the stale token
    window.dispatchEvent(new Event('auth:expired'))
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed: ${res.status}`)
  }

  return res.json()
}

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`
}
