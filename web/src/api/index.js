// =============================================================================
// API SERVICES - Servicios para llamadas a la API del ESP8266 v3.0.0
// =============================================================================

class ApiError extends Error {
  constructor(message, status, response) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.response = response
  }
}

class ApiService {
  constructor() {
    this.sessionToken = localStorage.getItem('sessionToken') || null
  }

  // Método base para realizar peticiones HTTP
  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Agregar session token si existe
    if (this.sessionToken) {
      config.headers['X-Session-Token'] = this.sessionToken
    }

    try {
      const response = await fetch(endpoint, config)

      // Manejar respuesta 204 (No Content) para DELETE
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

  // Métodos GET, POST, PUT, DELETE
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

// =============================================================================
// AUTH SERVICE - Servicio de autenticación
// =============================================================================

class AuthService extends ApiService {
  async login(username, password) {
    const response = await this.post('/login', { username, password })

    if (response.success && response.token) {
      this.sessionToken = response.token
      localStorage.setItem('sessionToken', response.token)
      localStorage.setItem('username', response.username)
    }

    return response
  }

  async logout() {
    const response = await this.post('/logout')
    this.sessionToken = null
    localStorage.removeItem('sessionToken')
    localStorage.removeItem('username')
    return response
  }

  getStoredUsername() {
    return localStorage.getItem('username')
  }
}

// =============================================================================
// HOST SERVICE - Servicio de gestión de hosts
// =============================================================================

class HostService extends ApiService {
  async getAllHosts() {
    const response = await this.get('/hosts')
    return {
      hosts: response.data || [],
      metadata: response.metadata || {},
    }
  }

  async getHost(id) {
    const response = await this.get('/hosts', { id })
    return response.data
  }

  async addHost(hostData) {
    return this.post('/hosts', hostData)
  }

  async updateHost(id, hostData) {
    return this.put('/hosts', hostData, { id })
  }

  async deleteHost(id) {
    return this.delete(`/hosts?id=${id}`)
  }

  async importHosts(hosts) {
    return this.post('/hosts/import', hosts)
  }
}

// =============================================================================
// NETWORK SERVICE - Servicio de red (WOL y ping)
// =============================================================================

class NetworkService extends ApiService {
  async wakeHost(id) {
    return this.post(`/hosts/wake?id=${id}`)
  }

  async pingHost(id) {
    return this.post(`/hosts/ping?id=${id}`)
  }
}

// =============================================================================
// SETTINGS SERVICE - Servicio de configuración
// =============================================================================

class SettingsService extends ApiService {
  async getAllSettings() {
    const response = await this.get('/settings')
    return response.data
  }

  async getNetworkSettings() {
    const response = await this.get('/settings/network')
    return response.data
  }

  async updateNetworkSettings(networkConfig) {
    return this.put('/settings/network', networkConfig)
  }

  async getAuthSettings() {
    const response = await this.get('/settings/auth')
    return response.data
  }

  async updateAuthSettings(authConfig) {
    return this.put('/settings/auth', authConfig)
  }

  async getAbout() {
    const response = await this.get('/settings/about')
    return response.data
  }

  async getPingPeriod() {
    const response = await this.get('/settings/ping_period')
    return response.data
  }

  async updatePingPeriod(pingPeriod) {
    return this.put('/settings/ping_period', { pingPeriod })
  }

  async resetWiFi() {
    return this.post('/settings/reset_wifi')
  }
}

// =============================================================================
// API CLIENT - Cliente principal
// =============================================================================

class ApiClient {
  constructor() {
    this.auth = new AuthService()
    this.hosts = new HostService()
    this.network = new NetworkService()
    this.settings = new SettingsService()
  }

  setSessionToken(token) {
    this.auth.sessionToken = token
    this.hosts.sessionToken = token
    this.network.sessionToken = token
    this.settings.sessionToken = token
  }

  clearSession() {
    this.setSessionToken(null)
    localStorage.removeItem('sessionToken')
    localStorage.removeItem('username')
  }

  async login(username, password) {
    const response = await this.auth.login(username, password)
    if (response.success && response.token) {
      this.setSessionToken(response.token)
    }
    return response
  }

  async logout() {
    const response = await this.auth.logout()
    this.clearSession()
    return response
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function isValidMACAddress(mac) {
  const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/
  return macRegex.test(mac)
}

function isValidIPv4(ip) {
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return ipRegex.test(ip)
}

function handleApiError(error) {
  if (error instanceof ApiError) {
    return error.message
  }
  return 'Network error'
}

export function getImportStatus(importResult) {
  const { imported, ignored, total } = importResult

  if (imported === 0 && ignored > 0) {
    return {
      type: 'error',
      color: 'red',
      icon: 'cancel',
    }
  } else if (ignored > imported) {
    return {
      type: 'warning',
      color: 'yellow',
      icon: 'warning',
    }
  } else if (imported > 0) {
    return {
      type: 'success',
      color: 'green',
      icon: 'check_circle',
    }
  } else {
    return {
      type: 'info',
      color: 'blue',
      icon: 'info',
    }
  }
}

// =============================================================================
// EXPORT - Cliente API configurado
// =============================================================================

// Las peticiones siempre van al mismo dominio donde está alojada la aplicación
export const apiClient = new ApiClient()

// Auto-configurar el token al cargar
const storedToken = localStorage.getItem('sessionToken')
if (storedToken) {
  apiClient.setSessionToken(storedToken)
}

export { ApiError, handleApiError, isValidMACAddress, isValidIPv4 }
