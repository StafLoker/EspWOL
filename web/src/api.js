const API_PREFIX = '/api'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(method, url, body) {
  let res
  try {
    res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Network error', 0)
  }

  // Auth is HTTP Basic: the browser prompts on the first document load (the
  // firmware gates `/`) and reuses the credentials here. fetch() never shows that
  // prompt itself, so a 401 has to be surfaced as a message.
  if (res.status === 401) {
    throw new ApiError('Session expired. Reload the page to sign in again.', 401)
  }

  if (res.status === 204) return { success: true }

  let data = {}
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }

  if (!res.ok) throw new ApiError(data.message || 'Request failed', res.status)
  return data
}

export const api = {
  // hosts
  getHosts: () => request('GET', `${API_PREFIX}/hosts`),
  addHost: (h) => request('POST', `${API_PREFIX}/hosts`, h),
  updateHost: (id, h) => request('PUT', `${API_PREFIX}/hosts?id=${id}`, h),
  deleteHost: (id) => request('DELETE', `${API_PREFIX}/hosts?id=${id}`),
  importHosts: (arr) => request('POST', `${API_PREFIX}/hosts/import`, arr),
  wakeHost: (id) => request('POST', `${API_PREFIX}/hosts/wake?id=${id}`),
  pingHost: (id) => request('POST', `${API_PREFIX}/hosts/ping?id=${id}`),

  // settings
  getSettings: () => request('GET', `${API_PREFIX}/settings`),
  updateNetwork: (n) => request('PUT', `${API_PREFIX}/settings/network`, n),
  getAuth: () => request('GET', `${API_PREFIX}/account`),
  updateAuth: (a) => request('PUT', `${API_PREFIX}/account`, a),
  getAbout: () => request('GET', `${API_PREFIX}/settings/about`),
  updatePingPeriod: (pingPeriod) =>
    request('PUT', `${API_PREFIX}/settings/ping_period`, { pingPeriod }),
  resetWiFi: () => request('POST', `${API_PREFIX}/settings/reset_wifi`),
}

export { ApiError }
