// =============================================================================
// API SERVICES - Servicios para llamadas a la API del ESP8266
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
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
    this.sessionId = localStorage.getItem('sessionId') || null
  }

  // Método base para realizar peticiones HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Agregar session ID si existe
    if (this.sessionId) {
      config.headers['X-Session-Id'] = this.sessionId
    }

    try {
      const response = await fetch(url, config)
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

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
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

    if (response.success && response.sessionId) {
      this.sessionId = response.sessionId
      localStorage.setItem('sessionId', response.sessionId)
      localStorage.setItem('username', response.username)
    }

    return response
  }

  async logout() {
    try {
      const response = await this.post('/logout', {
        sessionId: this.sessionId,
      })

      this.sessionId = null
      localStorage.removeItem('sessionId')
      localStorage.removeItem('username')

      return response
    } catch (error) {
      // Limpiar datos locales aunque falle la petición
      this.sessionId = null
      localStorage.removeItem('sessionId')
      localStorage.removeItem('username')
      throw error
    }
  }

  isAuthenticated() {
    return this.sessionId !== null
  }

  getUsername() {
    return localStorage.getItem('username')
  }
}

// =============================================================================
// HOST SERVICE - Servicio de gestión de hosts
// =============================================================================

class HostService extends ApiService {
  async getAllHosts() {
    return this.get('/hosts')
  }

  async getHost(id) {
    return this.get('/hosts', { id })
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

  async getHostsStatus() {
    return this.get('/hosts/status')
  }

  async importHosts(hostsArray) {
    return this.post('/import', hostsArray)
  }
}

// =============================================================================
// NETWORK SERVICE - Servicio de red (WOL y ping)
// =============================================================================

class NetworkService extends ApiService {
  async wakeHost(id) {
    return this.post('/wake', null, { id })
  }

  async pingHost(id) {
    return this.post('/ping', null, { id })
  }
}

// =============================================================================
// SETTINGS SERVICE - Servicio de configuración
// =============================================================================

class SettingsService extends ApiService {
  // Network Settings
  async getNetworkSettings() {
    return this.get('/networkSettings')
  }

  async updateNetworkSettings(networkConfig) {
    return this.put('/networkSettings', networkConfig)
  }

  // Authentication Settings
  async getAuthenticationSettings() {
    return this.get('/authenticationSettings')
  }

  async updateAuthenticationSettings(authConfig) {
    return this.put('/authenticationSettings', authConfig)
  }

  // About
  async getAbout() {
    return this.get('/about')
  }

  // WiFi Reset
  async resetWiFi() {
    return this.post('/resetWifi')
  }
}

// =============================================================================
// API CLIENT - Cliente principal que agrupa todos los servicios
// =============================================================================

class ApiClient {
  constructor(baseUrl = '') {
    this.auth = new AuthService(baseUrl)
    this.hosts = new HostService(baseUrl)
    this.network = new NetworkService(baseUrl)
    this.settings = new SettingsService(baseUrl)
  }

  // Método para sincronizar sessionId entre servicios
  setSessionId(sessionId) {
    this.auth.sessionId = sessionId
    this.hosts.sessionId = sessionId
    this.network.sessionId = sessionId
    this.settings.sessionId = sessionId
  }

  // Método para limpiar sesión en todos los servicios
  clearSession() {
    this.setSessionId(null)
  }
}

// =============================================================================
// EXPORT - Instancia global del cliente API
// =============================================================================

// Crear instancia global
const apiClient = new ApiClient()

// Sincronizar sessionId al cargar
if (localStorage.getItem('sessionId')) {
  apiClient.setSessionId(localStorage.getItem('sessionId'))
}
