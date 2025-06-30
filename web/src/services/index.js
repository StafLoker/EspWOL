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
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
    this.sessionToken = localStorage.getItem('sessionToken') || null
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

    // Agregar session token si existe (según especificación OpenAPI)
    if (this.sessionToken) {
      config.headers['X-Session-Token'] = this.sessionToken
    }

    try {
      const response = await fetch(url, config)

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

    if (response.success && response.data?.token) {
      this.sessionToken = response.data.token
      localStorage.setItem('sessionToken', response.data.token)
      localStorage.setItem('username', response.data.username)
    }

    return response
  }

  async logout() {
    try {
      const response = await this.post('/logout')

      this.sessionToken = null
      localStorage.removeItem('sessionToken')
      localStorage.removeItem('username')

      return response
    } catch (error) {
      // Limpiar datos locales aunque falle la petición
      this.sessionToken = null
      localStorage.removeItem('sessionToken')
      localStorage.removeItem('username')
      throw error
    }
  }

  isAuthenticated() {
    return this.sessionToken !== null
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
    const response = await this.get('/hosts')
    return response.data || []
  }

  async getHost(id) {
    const response = await this.get(`/hosts?id=${id}`)
    return response.data
  }

  async addHost(hostData) {
    const response = await this.post('/hosts', hostData)
    return response
  }

  async updateHost(id, hostData) {
    const response = await this.put(`/hosts?id=${id}`, hostData)
    return response
  }

  async deleteHost(id) {
    return this.delete(`/hosts?id=${id}`)
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
    return this.post(`/wake?id=${id}`)
  }

  async pingHost(id) {
    return this.post(`/ping?id=${id}`)
  }
}

// =============================================================================
// SETTINGS SERVICE - Servicio de configuración
// =============================================================================

class SettingsService extends ApiService {
  // Obtener todas las configuraciones
  async getAllSettings() {
    const response = await this.get('/settings')
    return response.data
  }

  // Network Settings
  async getNetworkSettings() {
    const response = await this.get('/settings/network')
    return response.data
  }

  async updateNetworkSettings(networkConfig) {
    const response = await this.put('/settings/network', networkConfig)
    return response
  }

  // Authentication Settings
  async getAuthSettings() {
    const response = await this.get('/settings/auth')
    return response.data
  }

  async updateAuthSettings(authConfig) {
    const response = await this.put('/settings/auth', authConfig)
    return response
  }

  // About - System information
  async getAbout() {
    const response = await this.get('/settings/about')
    return response.data
  }

  // Ping Period Settings
  async getPingPeriod() {
    const response = await this.get('/settings/ping_period')
    return response.data
  }

  async updatePingPeriod(pingPeriod) {
    const response = await this.put('/settings/ping_period', { pingPeriod })
    return response
  }

  // WiFi Reset
  async resetWiFi() {
    return this.post('/settings/reset_wifi')
  }
}

// =============================================================================
// WEB INTERFACE SERVICE - Servicio para interfaz web
// =============================================================================

class WebInterfaceService extends ApiService {
  async getWebInterface() {
    // Esta llamada devuelve HTML, no JSON
    const response = await fetch(`${this.baseUrl}/`, {
      headers: this.sessionToken ? { 'X-Session-Token': this.sessionToken } : {}
    })

    if (!response.ok) {
      throw new ApiError('Failed to load web interface', response.status)
    }

    return response.text()
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
    this.web = new WebInterfaceService(baseUrl)
  }

  // Método para sincronizar sessionToken entre servicios
  setSessionToken(token) {
    this.auth.sessionToken = token
    this.hosts.sessionToken = token
    this.network.sessionToken = token
    this.settings.sessionToken = token
    this.web.sessionToken = token
  }

  // Método para limpiar sesión en todos los servicios
  clearSession() {
    this.setSessionToken(null)
    localStorage.removeItem('sessionToken')
    localStorage.removeItem('username')
  }

  // Método de conveniencia para hacer login y configurar el token
  async login(username, password) {
    const response = await this.auth.login(username, password)
    if (response.success && response.data?.token) {
      this.setSessionToken(response.data.token)
    }
    return response
  }

  // Método de conveniencia para logout
  async logout() {
    const response = await this.auth.logout()
    this.clearSession()
    return response
  }
}

// =============================================================================
// UTILITY FUNCTIONS - Funciones de utilidad
// =============================================================================

// Validar formato MAC address
function isValidMACAddress(mac) {
  const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/
  return macRegex.test(mac)
}

// Validar formato IPv4
function isValidIPv4(ip) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return ipRegex.test(ip)
}

// Validar datos de host según especificación
function validateHostData(hostData) {
  const errors = []

  if (!hostData.name || hostData.name.length < 1) {
    errors.push('Name is required and must not be empty')
  }

  if (!hostData.mac || !isValidMACAddress(hostData.mac)) {
    errors.push('Valid MAC address is required (format: AA:BB:CC:DD:EE:FF)')
  }

  if (!hostData.ip || !isValidIPv4(hostData.ip)) {
    errors.push('Valid IPv4 address is required')
  }

  if (typeof hostData.autoWake !== 'boolean') {
    errors.push('autoWake must be a boolean value')
  }

  return errors
}

// Validar configuración de red
function validateNetworkConfig(config) {
  const errors = []

  if (typeof config.enable !== 'boolean') {
    errors.push('enable must be a boolean value')
  }

  if (!isValidIPv4(config.ip)) {
    errors.push('Valid IP address is required')
  }

  if (!isValidIPv4(config.networkMask)) {
    errors.push('Valid network mask is required')
  }

  if (!isValidIPv4(config.gateway)) {
    errors.push('Valid gateway address is required')
  }

  if (!isValidIPv4(config.dns)) {
    errors.push('Valid DNS server address is required')
  }

  return errors
}

// Validar credenciales de usuario
function validateUserCredentials(credentials) {
  const errors = []

  if (!credentials.username || credentials.username.length < 3) {
    errors.push('Username must be at least 3 characters long')
  }

  if (!credentials.password || credentials.password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Verificar patrón de contraseña (al menos una mayúscula, una minúscula y un carácter especial)
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).*$/
  if (credentials.password && !passwordPattern.test(credentials.password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one special character')
  }

  return errors
}

// Constantes para períodos de ping válidos (en segundos)
const VALID_PING_PERIODS = [0, 60, 300, 600, 900, 1800, 2700, 3600, 10800, 21600, 43200, 86400]

function isValidPingPeriod(period) {
  return VALID_PING_PERIODS.includes(period)
}

// =============================================================================
// EXPORT - Instancia global del cliente API
// =============================================================================

// Crear instancia global
const apiClient = new ApiClient()

// Sincronizar sessionToken al cargar
if (localStorage.getItem('sessionToken')) {
  apiClient.setSessionToken(localStorage.getItem('sessionToken'))
}
