// =============================================================================
// MIRAGE MOCK SERVER - Configuración para simular el backend ESP8266
// =============================================================================

// Importar MirageJS
import { createServer, Model, Factory } from 'miragejs'

// =============================================================================
// DATOS MOCK INICIALES
// =============================================================================

const MOCK_HOSTS = [
  {
    id: 0,
    name: 'PC Gaming',
    mac: 'AA:BB:CC:DD:EE:FF',
    ip: '192.168.1.100',
    autoWake: true,
    status: true,
  },
  {
    id: 1,
    name: 'Servidor NAS',
    mac: '11:22:33:44:55:66',
    ip: '192.168.1.101',
    autoWake: false,
    status: false,
  },
  {
    id: 2,
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

const MOCK_AUTH_CONFIG = {
  enable: true,
  username: 'admin',
}

const MOCK_ABOUT = {
  version: '3.0.0',
  hostname: 'wol-esp8266',
}

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
      let isAuthenticated = false
      let currentSessionId = null
      let networkConfig = { ...MOCK_NETWORK_CONFIG }
      let authConfig = { ...MOCK_AUTH_CONFIG }

      // =============================================================================
      // MIDDLEWARE DE AUTENTICACIÓN
      // =============================================================================

      function requireAuth(schema, request) {
        const sessionId = request.requestHeaders['X-Session-Id']

        if (!authConfig.enable) {
          return true // Autenticación deshabilitada
        }

        if (sessionId && sessionId === currentSessionId) {
          return true
        }

        return false
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

        if (!authConfig.enable) {
          return {
            success: true,
            message: 'Authentication disabled - access granted',
          }
        }

        // Simular validación (admin/admin123)
        if (username === authConfig.username && password === 'admin123') {
          currentSessionId = 'session_' + Math.random().toString(36).substr(2, 9)
          isAuthenticated = true

          return {
            success: true,
            message: 'Login successful',
            sessionId: currentSessionId,
            username: username,
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
        currentSessionId = null
        isAuthenticated = false

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

        if (request.queryParams.id) {
          // Obtener host específico
          const host = schema.hosts.find(request.queryParams.id)
          if (host) {
            return host.attrs
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
          // Obtener todos los hosts
          return schema.hosts.all().models.map((host) => host.attrs)
        }
      })

      this.post('/hosts', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const hostData = JSON.parse(request.requestBody)

        // Validar datos
        if (!hostData.name || !hostData.mac || !hostData.ip) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Missing required fields',
            },
          )
        }

        // Verificar duplicados
        const existingHost = schema.hosts
          .all()
          .models.find((h) => h.mac === hostData.mac || h.ip === hostData.ip)

        if (existingHost) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Duplicate host',
            },
          )
        }

        // Crear nuevo host
        const newHost = schema.hosts.create({
          ...hostData,
          id: schema.hosts.all().length,
          status: false,
        })

        return {
          success: true,
          message: 'Host added',
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

        host.update(hostData)

        return {
          success: true,
          message: 'Host updated',
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

        return {
          success: true,
          message: 'Host deleted',
        }
      })

      this.get('/hosts/status', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        return schema.hosts.all().models.map((host) => ({
          id: host.id,
          name: host.name,
          ip: host.ip,
          status: host.status,
        }))
      })

      this.post('/import', (schema, request) => {
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
          if (!hostData.name || !hostData.mac || !hostData.ip) {
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

          schema.hosts.create({
            ...hostData,
            id: schema.hosts.all().length,
            status: false,
          })

          importedCount++
        })

        return {
          success: true,
          message: `Imported ${importedCount} hosts from ${hostsArray.length}. ${ignoredCount} hosts ignored. Hosts in database after import: ${schema.hosts.all().length}.`,
        }
      })

      // =============================================================================
      // RUTAS DE RED (WOL Y PING)
      // =============================================================================

      this.post('/wake', (schema, request) => {
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

        // Simular envío exitoso de WOL
        return {
          success: true,
          message: 'WOL packet sent',
        }
      })

      this.post('/ping', (schema, request) => {
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

      this.get('/networkSettings', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        return networkConfig
      })

      this.put('/networkSettings', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const newConfig = JSON.parse(request.requestBody)
        networkConfig = { ...networkConfig, ...newConfig }

        return {
          success: true,
          message: 'Network settings updated',
        }
      })

      this.get('/authenticationSettings', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        return authConfig
      })

      this.put('/authenticationSettings', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        const newConfig = JSON.parse(request.requestBody)
        authConfig = { ...authConfig, ...newConfig }

        return {
          success: true,
          message: 'Authentication updated',
        }
      })

      this.get('/about', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        return MOCK_ABOUT
      })

      this.post('/resetWifi', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        return {
          success: true,
          message: 'WiFi settings have been reset successfully.',
        }
      })

      // =============================================================================
      // RUTAS WEB
      // =============================================================================

      this.get('/', (schema, request) => {
        if (!requireAuth(schema, request)) {
          return sendAuthError()
        }

        // En un caso real, esto devolvería HTML
        return {
          success: true,
          message: 'Web interface loaded',
        }
      })

      // Manejar rutas no encontradas
      this.get('/*', () => {
        return new Response(
          404,
          {},
          {
            success: false,
            message: 'Not found',
          },
        )
      })
    },
  })
}
