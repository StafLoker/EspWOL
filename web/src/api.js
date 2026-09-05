const API_PREFIX = '/api'

/**
 * The kinds of failure a request can end in, so a caller can react to each one
 * rather than only being able to show `message`.
 * @readonly
 * @enum {string}
 */
const ApiErrorCode = {
  /** The device could not be reached at all. Retrying may succeed. */
  NETWORK: 'NETWORK',
  /** Credentials were rejected; the page has to be reloaded to sign in again. */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** The device rejected the request as invalid (4xx other than 401). */
  REJECTED: 'REJECTED',
  /** The device failed while handling a valid request (5xx). */
  DEVICE: 'DEVICE',
}

/**
 * A failed API call.
 * @property {number} status HTTP status, or 0 when the request never completed
 * @property {ApiErrorCode} code the kind of failure
 */
class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** Extra attempts after the first, for a request that never reached the device. */
const NETWORK_RETRIES = 2

/** Pause between those attempts, giving a busy ESP8266 time to answer. */
const RETRY_DELAY_MS = 400

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Performs one API call and unwraps its JSON body. A request that never reaches
 * the device is retried, since a single-radio ESP8266 on WiFi drops connections
 * transiently; anything the device actually answered is returned as-is.
 * @throws {ApiError} with `code` set to one of {@link ApiErrorCode}
 */
async function request(method, url, body) {
  const options = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }

  let res = null
  let attempt = 0

  while (res === null && attempt <= NETWORK_RETRIES) {
    try {
      res = await fetch(url, options)
    } catch {
      attempt++
      if (attempt <= NETWORK_RETRIES) await sleep(RETRY_DELAY_MS)
    }
  }

  if (res === null) throw new ApiError('Network error', 0, ApiErrorCode.NETWORK)

  // Auth is HTTP Basic: the browser prompts on the first document load (the
  // firmware gates `/`) and reuses the credentials here. fetch() never shows that
  // prompt itself, so a 401 has to be surfaced as a message.
  if (res.status === 401) {
    throw new ApiError(
      'Session expired. Reload the page to sign in again.',
      401,
      ApiErrorCode.UNAUTHORIZED,
    )
  }

  if (res.status === 204) return { success: true }

  let data = {}
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    throw new ApiError(
      data.message || 'Request failed',
      res.status,
      res.status >= 500 ? ApiErrorCode.DEVICE : ApiErrorCode.REJECTED,
    )
  }
  return data
}

/**
 * Every device endpoint, one method each. All reject with an {@link ApiError}.
 */
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

export { ApiError, ApiErrorCode }
