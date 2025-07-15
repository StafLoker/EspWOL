import { ApiError } from './errors.js'

export class ApiService {
  constructor() {
    this.sessionToken = localStorage.getItem('sessionToken') || null
  }

  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (this.sessionToken) {
      config.headers['X-Session-Token'] = this.sessionToken
    }

    try {
      const response = await fetch(endpoint, config)

      if (response.status === 204) {
        return { success: true, message: 'Operation completed successfully' }
      }

      const data = await response.json()

      if (!response.ok) {
        throw new ApiError(data.message || 'Request failed', response.status, data)
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('Network error', 0, null)
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, { method: 'GET' })
  }

  async post(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    })
  }

  async put(endpoint, data = null, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}
