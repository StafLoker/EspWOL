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
  getHosts: () => request('GET', '/hosts'),
  addHost: (h) => request('POST', '/hosts', h),
  updateHost: (id, h) => request('PUT', `/hosts?id=${id}`, h),
  deleteHost: (id) => request('DELETE', `/hosts?id=${id}`),
  importHosts: (arr) => request('POST', '/hosts/import', arr),
  wakeHost: (id) => request('POST', `/hosts/wake?id=${id}`),
  pingHost: (id) => request('POST', `/hosts/ping?id=${id}`),

  // settings
  getSettings: () => request('GET', '/settings'),
  updateNetwork: (n) => request('PUT', '/settings/network', n),
  getAuth: () => request('GET', '/account'),
  updateAuth: (a) => request('PUT', '/account', a),
  getAbout: () => request('GET', '/settings/about'),
  updatePingPeriod: (pingPeriod) =>
    request('PUT', '/settings/ping_period', { pingPeriod }),
  resetWiFi: () => request('POST', '/settings/reset_wifi'),
}

export { ApiError }
