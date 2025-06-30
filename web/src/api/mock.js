// =============================================================================
// MIRAGE MOCK SERVER - Configuración para simular el backend ESP8266 v3.0.0
// =============================================================================

// Importar MirageJS
import { createServer, Model, Factory } from 'miragejs'

// =============================================================================
// DATOS MOCK INICIALES
// =============================================================================

const MOCK_HOSTS = [
  {
    id: 1,
    name: 'PC Gaming',
    mac: 'AA:BB:CC:DD:EE:FF',
    ip: '192.168.1.100',
    autoWake: true,
    status: true,
  },
  {
    id: 2,
    name: 'Servidor NAS',
    mac: '11:22:33:44:55:66',
    ip: '192.168.1.101',
    autoWake: false,
    status: false,
  },
  {
    id: 3,
    name: 'Laptop Trabajo',
    mac: '77:88:99:AA:BB:CC',
    ip: '192.168.1.102',
    autoWake: true,
    status: true,
  },
]

const MOCK_NETWORK_CONFIG = {
  enable: false,
  ip: '192.168.1.50',
  networkMask: '255.255.255.0',
  gateway: '192.168.1.1',
  dns: '8.8.8.8',
}

const MOCK_USER = {
  username: 'glavniy',
  password: 'Lep#Chick43' // Ejemplo de la especificación
}

const MOCK_ABOUT = {
  version: '3.0.0',
  hostname: 'wol',
}

const MOCK_PING_PERIOD = 60000 // 60 segundos en milisegundos

// Períodos válidos según especificación (en segundos)
const VALID_PING_PERIODS = [0, 60, 300, 600, 900, 1800, 2700, 3600, 10800, 21600, 43200, 86400]

// =============================================================================
// CONFIGURACIÓN DEL SERVIDOR MIRAGE
// =============================================================================

export function setupMirageServer() {
  return createServer({
    models: {
      host: Model,
      session: Model,
    },

    factories: {
      host: Factory.extend({
        name(i) {
          return `Host ${i + 1}`
        },
        mac() {
          return Array.from({ length: 6 }, () =>
            Math.floor(Math.random() * 256)
              .toString(16)
              .padStart(2, '0')
              .toUpperCase(),
          ).join(':')
        },
        ip(i) {
          return `192.168.1.${100 + i}`
        },
        autoWake() {
          return Math.random() > 0.5
        },
        status() {
          return Math.random() > 0.3
        },
      }),
    },

    seeds(server) {
      // Crear hosts iniciales
      MOCK_HOSTS.forEach((host) => {
        server.create('host', host)
      })
    },

    routes() {
      // Namespace para las rutas
      this.namespace = ''

      // Variables para simular estado del servidor
      let currentSessionToken = null
      let networkConfig = { ...MOCK_NETWORK_CONFIG }
      let currentUser = { ...MOCK_USER }
      let pingPeriod = MOCK_PING_PERIOD

      // =============================================================================
      // MIDDLEWARE DE AUTENTICACIÓN
      // =============================================================================

      function requireAuth(schema, request) {
        const sessionToken = request.requestHeaders['X-Session-Token']
        return sessionToken && sessionToken === currentSessionToken
      }

      function sendAuthError() {
        return new Response(
          401,
          {},
          {
            success: false,
            message: 'Authentication required',
          },
        )
      }

      // =============================================================================
      // RUTAS DE AUTENTICACIÓN
      // =============================================================================

      this.post('/login', (schema, request) => {
        const { username, password } = JSON.parse(request.requestBody)

        if (username === currentUser.username && password === currentUser.password) {
          currentSessionToken = 'abc123def456ghij789klmno012pqrs' // Token de ejemplo

          return {
            success: true,
            message: 'Login successful',
            username: username,
            token: currentSessionToken
          }
        } else {
          return new Response(
            401,
            {},
            {
              success: false,
              message: 'Invalid credentials',
            },
          )
        }
      })

      this.post('/logout', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        currentSessionToken = null

        return {
          success: true,
          message: 'Logout successful',
        }
      })

      // =============================================================================
      // RUTAS DE HOSTS
      // =============================================================================

      this.get('/hosts', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        if (request.queryParams.id !== undefined) {
          // Obtener host específico
          const host = schema.hosts.find(request.queryParams.id)
          if (host) {
            return {
              success: true,
              message: 'Host retrieved',
              data: host.attrs
            }
          } else {
            return new Response(
              400,
              {},
              {
                success: false,
                message: 'Host not found',
              },
            )
          }
        } else {
          // Obtener todos los hosts con metadata
          const hosts = schema.hosts.all().models.map((host) => host.attrs)

          return {
            success: true,
            message: 'Hosts retrieved',
            data: hosts,
            metadata: {
              memory: {
                freeHeap: 45632,
                totalHeap: 81920,
                heapUsagePercent: 44
              },
              storage: {
                freeFlash: 2048000,
                totalFlash: 3145728,
                flashUsagePercent: 35
              },
              hosts: {
                count: hosts.length,
                maxAllowed: 45,
                remaining: 45 - hosts.length
              },
              hasEnoughMemory: true,
              canAddMoreHosts: hosts.length < 45
            }
          }
        }
      })

      this.post('/hosts', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const hostData = JSON.parse(request.requestBody)

        // Validar datos
        if (!hostData.name || !hostData.mac || !hostData.ip || typeof hostData.autoWake !== 'boolean') {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Missing or invalid required fields',
            },
          )
        }

        // Verificar límite de hosts
        if (schema.hosts.all().length >= 45) {
          return new Response(
            507,
            {},
            {
              success: false,
              message: 'Insufficient storage - maximum number of hosts reached',
            },
          )
        }

        // Verificar duplicados
        const existingHost = schema.hosts
          .all()
          .models.find((h) => h.mac === hostData.mac || h.ip === hostData.ip)

        if (existingHost) {
          return new Response(
            409,
            {},
            {
              success: false,
              message: 'Duplicate host (MAC or IP already exists)',
            },
          )
        }

        // Crear nuevo host con ID auto-incrementado
        const hostId = Math.max(...schema.hosts.all().models.map(h => h.id), 0) + 1
        const newHost = schema.hosts.create({
          ...hostData,
          id: hostId,
          status: false,
        })

        return {
          success: true,
          message: 'Host added successfully',
          data: newHost.attrs,
          metadata: {
            memory: {
              freeHeap: 45632,
              totalHeap: 81920,
              heapUsagePercent: 44
            },
            storage: {
              freeFlash: 2048000,
              totalFlash: 3145728,
              flashUsagePercent: 35
            },
            hosts: {
              count: schema.hosts.all().length,
              maxAllowed: 45,
              remaining: 45 - schema.hosts.all().length
            },
            hasEnoughMemory: true,
            canAddMoreHosts: schema.hosts.all().length < 45
          }
        }
      })

      this.put('/hosts', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const hostData = JSON.parse(request.requestBody)
        const hostId = request.queryParams.id
        const host = schema.hosts.find(hostId)

        if (!host) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Host not found',
            },
          )
        }

        // Verificar duplicados excluyendo el host actual
        const existingHost = schema.hosts
          .all()
          .models.find((h) => h.id != hostId && (h.mac === hostData.mac || h.ip === hostData.ip))

        if (existingHost) {
          return new Response(
            409,
            {},
            {
              success: false,
              message: 'Duplicate host',
            },
          )
        }

        host.update(hostData)

        return {
          success: true,
          message: 'Host updated successfully',
          data: host.attrs,
          metadata: {
            memory: {
              freeHeap: 45632,
              totalHeap: 81920,
              heapUsagePercent: 44
            },
            storage: {
              freeFlash: 2048000,
              totalFlash: 3145728,
              flashUsagePercent: 35
            },
            hosts: {
              count: schema.hosts.all().length,
              maxAllowed: 45,
              remaining: 45 - schema.hosts.all().length
            },
            hasEnoughMemory: true,
            canAddMoreHosts: schema.hosts.all().length < 45
          }
        }
      })

      this.delete('/hosts', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const hostId = request.queryParams.id
        const host = schema.hosts.find(hostId)

        if (!host) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Host not found',
            },
          )
        }

        host.destroy()

        // Retornar 204 No Content según especificación
        return new Response(204, {}, '')
      })

      this.post('/hosts/import', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const hostsArray = JSON.parse(request.requestBody)

        if (!Array.isArray(hostsArray)) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Expected JSON array',
            },
          )
        }

        let importedCount = 0
        let ignoredCount = 0

        hostsArray.forEach((hostData) => {
          if (!hostData.name || !hostData.mac || !hostData.ip || typeof hostData.autoWake !== 'boolean') {
            ignoredCount++
            return
          }

          // Verificar duplicados
          const existingHost = schema.hosts
            .all()
            .models.find((h) => h.mac === hostData.mac || h.ip === hostData.ip)

          if (existingHost) {
            ignoredCount++
            return
          }

          // Verificar límite de hosts
          if (schema.hosts.all().length >= 45) {
            ignoredCount++
            return
          }

          const hostId = Math.max(...schema.hosts.all().models.map(h => h.id), 0) + 1
          schema.hosts.create({
            ...hostData,
            id: hostId,
            status: false,
          })

          importedCount++
        })

        return {
          success: true,
          message: `Imported ${importedCount} hosts from ${hostsArray.length}. ${ignoredCount} hosts ignored. Hosts in database after import: ${schema.hosts.all().length}.`,
          metadata: {
            memory: {
              freeHeap: 45632,
              totalHeap: 81920,
              heapUsagePercent: 44
            },
            storage: {
              freeFlash: 2048000,
              totalFlash: 3145728,
              flashUsagePercent: 35
            },
            hosts: {
              count: schema.hosts.all().length,
              maxAllowed: 45,
              remaining: 45 - schema.hosts.all().length
            },
            hasEnoughMemory: true,
            canAddMoreHosts: schema.hosts.all().length < 45
          }
        }
      })

      // =============================================================================
      // RUTAS DE RED (WOL Y PING)
      // =============================================================================

      this.post('/hosts/wake', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const hostId = request.queryParams.id
        const host = schema.hosts.find(hostId)

        if (!host) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Host not found',
            },
          )
        }

        // Simular envío de WOL con posible fallo
        const success = Math.random() > 0.1 // 90% éxito

        return {
          success: success,
          message: success ? 'WOL packet sent' : 'Failed to send WOL packet',
        }
      })

      this.post('/hosts/ping', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const hostId = request.queryParams.id
        const host = schema.hosts.find(hostId)

        if (!host) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Host not found',
            },
          )
        }

        // Simular ping con resultado aleatorio
        const isOnline = Math.random() > 0.4
        host.update({ status: isOnline })

        return {
          success: isOnline,
          message: isOnline ? 'Host is online' : 'Host is offline',
        }
      })

      // =============================================================================
      // RUTAS DE CONFIGURACIÓN
      // =============================================================================

      // Obtener todas las configuraciones
      this.get('/settings', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        return {
          success: true,
          message: 'Settings retrieved',
          data: {
            about: MOCK_ABOUT,
            pingPeriod: pingPeriod,
            network: networkConfig
          }
        }
      })

      // Network Settings
      this.get('/settings/network', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        return {
          success: true,
          message: 'Network settings retrieved',
          data: networkConfig
        }
      })

      this.put('/settings/network', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const newConfig = JSON.parse(request.requestBody)
        networkConfig = { ...networkConfig, ...newConfig }

        return {
          success: true,
          message: 'Network settings updated (device will restart)',
          data: networkConfig
        }
      })

      // Auth Settings
      this.get('/settings/auth', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        return {
          success: true,
          message: 'User information retrieved',
          data: {
            username: currentUser.username
          }
        }
      })

      this.put('/settings/auth', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const { username, password } = JSON.parse(request.requestBody)

        // Validar según especificación
        if (!username || username.length < 3 || username.length > 20) {
          return new Response(400, {}, {
            success: false,
            message: 'Username must be between 3-20 characters long'
          })
        }

        if (!password || password.length < 8 || password.length > 32) {
          return new Response(400, {}, {
            success: false,
            message: 'Password must be between 8-32 characters long'
          })
        }

        // Verificar patrón de contraseña
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).*$/
        if (!passwordPattern.test(password)) {
          return new Response(400, {}, {
            success: false,
            message: 'Password must contain at least one uppercase, one lowercase, and one special character'
          })
        }

        currentUser = { username, password }
        currentSessionToken = null // Invalidar sesión actual

        return {
          success: true,
          message: 'User updated successfully',
          data: {
            username: username
          }
        }
      })

      // About
      this.get('/settings/about', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        return {
          success: true,
          message: 'System information retrieved',
          data: MOCK_ABOUT
        }
      })

      // Ping Period
      this.get('/settings/ping_period', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        return {
          success: true,
          message: 'Ping period retrieved',
          data: {
            pingPeriod: pingPeriod
          }
        }
      })

      this.put('/settings/ping_period', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const { pingPeriod: newPeriod } = JSON.parse(request.requestBody)

        if (!VALID_PING_PERIODS.includes(newPeriod)) {
          return new Response(400, {}, {
            success: false,
            message: 'Invalid ping period'
          })
        }

        pingPeriod = newPeriod * 1000 // Convertir a milisegundos

        return {
          success: true,
          message: 'Ping period updated',
          data: {
            pingPeriod: pingPeriod
          }
        }
      })

      // WiFi Reset
      this.post('/settings/reset_wifi', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        return {
          success: true,
          message: 'WiFi settings reset (device will restart)',
        }
      })
    },
  })
}

// =============================================================================
// UTILITY FUNCTIONS FOR MOCK SERVER
// =============================================================================

// Generar MAC address aleatoria
export function generateRandomMAC() {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase(),
  ).join(':')
}

// Generar IP aleatoria en rango 192.168.1.x
export function generateRandomIP(baseRange = '192.168.1') {
  const lastOctet = Math.floor(Math.random() * 200) + 50 // 50-249
  return `${baseRange}.${lastOctet}`
}

// Simular latencia de red
export function addNetworkDelay(minMs = 100, maxMs = 500) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return new Promise(resolve => setTimeout(resolve, delay))
}

// Exportar constantes útiles
export const MOCK_CONSTANTS = {
  VALID_PING_PERIODS,
  DEFAULT_USER: MOCK_USER,
  DEFAULT_NETWORK_CONFIG: MOCK_NETWORK_CONFIG,
  DEFAULT_ABOUT: MOCK_ABOUT,
  DEFAULT_PING_PERIOD: MOCK_PING_PERIOD
}
