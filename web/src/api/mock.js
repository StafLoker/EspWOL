// =============================================================================
// MIRAGE MOCK SERVER - Configuración para simular el backend ESP8266 v3.0.0
// =============================================================================

import { createServer, Model, Factory, Response } from 'miragejs'

// =============================================================================
// CONSTANTES DEL ESP8266
// =============================================================================

const MAX_HOST_NAME_LENGTH = 32
const MAX_USERNAME_LENGTH = 20
const MAX_PASSWORD_LENGTH = 32
const HARD_MAX_HOSTS = 50

const VALID_PING_PERIODS = [0, 60, 300, 600, 900, 1800, 2700, 3600, 10800, 21600, 43200, 86400]

// =============================================================================
// DATOS MOCK INICIALES
// =============================================================================

let currentHostId = 4
const sessionToken = 'abc123def456ghij789klmno012pqrs'

const mockMemoryInfo = {
  memory: {
    freeHeap: 45632,
    totalHeap: 81920,
    heapUsagePercent: 44,
  },
  storage: {
    freeFlash: 2048000,
    totalFlash: 3145728,
    flashUsagePercent: 35,
  },
  hosts: {
    count: 3,
    maxAllowed: HARD_MAX_HOSTS,
    remaining: 42,
  },
  hasEnoughMemory: true,
  canAddMoreHosts: true,
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
        ip() {
          return `192.168.1.${Math.floor(Math.random() * 200) + 50}`
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
      server.create('host', {
        id: 1,
        name: 'PC Gaming',
        mac: 'AA:BB:CC:DD:EE:FF',
        ip: '192.168.1.100',
        autoWake: true,
        status: true,
      })
      server.create('host', {
        id: 2,
        name: 'Servidor NAS',
        mac: '11:22:33:44:55:66',
        ip: '192.168.1.101',
        autoWake: false,
        status: false,
      })
      server.create('host', {
        id: 3,
        name: 'Laptop Trabajo',
        mac: '77:88:99:AA:BB:CC',
        ip: '192.168.1.102',
        autoWake: true,
        status: true,
      })
    },

    routes() {
      // MirageJS intercepta automáticamente las peticiones en desarrollo
      // No necesitamos namespace específico

      // =============================================================================
      // AUTHENTICATION
      // =============================================================================

      this.post('/login', (schema, request) => {
        const { username, password } = JSON.parse(request.requestBody)

        if (username === 'glavniy' && password === 'Lep#Chick43') {
          return {
            success: true,
            message: 'Login successful',
            username: 'glavniy',
            token: sessionToken,
          }
        }

        return new Response(
          401,
          {},
          {
            success: false,
            message: 'Invalid credentials',
          },
        )
      })

      this.post('/logout', () => {
        return {
          success: true,
          message: 'Logout successful',
        }
      })

      // =============================================================================
      // HOSTS MANAGEMENT
      // =============================================================================

      this.get('/hosts', (schema) => {
        const hosts = schema.hosts.all().models

        // Actualizar metadata
        mockMemoryInfo.hosts.count = hosts.length
        mockMemoryInfo.hosts.remaining = mockMemoryInfo.hosts.maxAllowed - hosts.length
        mockMemoryInfo.canAddMoreHosts = hosts.length < mockMemoryInfo.hosts.maxAllowed

        return {
          success: true,
          message: 'Hosts retrieved successfully',
          data: hosts,
          metadata: mockMemoryInfo,
        }
      })

      this.post('/hosts', (schema, request) => {
        const hostData = JSON.parse(request.requestBody)

        // Validaciones de límites de caracteres
        if (hostData.name && hostData.name.length > MAX_HOST_NAME_LENGTH) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: `Host name exceeds maximum length of ${MAX_HOST_NAME_LENGTH} characters`,
            },
          )
        }

        // Verificar límite de hosts
        const currentCount = schema.hosts.all().length
        if (currentCount >= mockMemoryInfo.hosts.maxAllowed) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Maximum number of hosts reached',
            },
          )
        }

        // Verificar duplicados por MAC
        const existingHost = schema.hosts.findBy({ mac: hostData.mac })
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

        const newHost = schema.hosts.create({
          id: currentHostId++,
          ...hostData,
          status: false, // Los nuevos hosts empiezan offline
        })

        return {
          success: true,
          message: 'Host added successfully',
          data: newHost,
        }
      })

      this.put('/hosts', (schema, request) => {
        const { id } = request.queryParams
        const hostData = JSON.parse(request.requestBody)

        // Validaciones
        if (hostData.name && hostData.name.length > MAX_HOST_NAME_LENGTH) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: `Host name exceeds maximum length of ${MAX_HOST_NAME_LENGTH} characters`,
            },
          )
        }

        const host = schema.hosts.find(id)
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

        // Verificar duplicados por MAC (excluyendo el host actual)
        if (hostData.mac && hostData.mac !== host.mac) {
          const existingHost = schema.hosts.findBy({ mac: hostData.mac })
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
        }

        host.update(hostData)

        return {
          success: true,
          message: 'Host updated successfully',
          data: host,
        }
      })

      this.delete('/hosts', (schema, request) => {
        const { id } = request.queryParams
        const host = schema.hosts.find(id)

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

        return new Response(204)
      })

      this.post('/hosts/import', (schema, request) => {
        const hostsArray = JSON.parse(request.requestBody)

        if (!Array.isArray(hostsArray)) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Invalid data format',
            },
          )
        }

        const currentCount = schema.hosts.all().length
        if (currentCount + hostsArray.length > mockMemoryInfo.hosts.maxAllowed) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Import would exceed maximum host limit',
            },
          )
        }

        let imported = 0
        let skipped = 0

        hostsArray.forEach((hostData) => {
          // Verificar duplicados
          if (!schema.hosts.findBy({ mac: hostData.mac })) {
            schema.hosts.create({
              id: currentHostId++,
              ...hostData,
              status: false,
            })
            imported++
          } else {
            skipped++
          }
        })

        return {
          success: true,
          message: `Import completed: ${imported} added, ${skipped} skipped`,
          imported,
          skipped,
        }
      })

      // =============================================================================
      // NETWORK OPERATIONS
      // =============================================================================

      this.post('/hosts/wake', (schema, request) => {
        const { id } = request.queryParams
        const host = schema.hosts.find(id)

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

        // Simular WOL exitoso
        host.update({ status: true })

        return {
          success: true,
          message: `WOL packet sent to ${host.name}`,
        }
      })

      this.post('/hosts/ping', (schema, request) => {
        const { id } = request.queryParams
        const host = schema.hosts.find(id)

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
        const isOnline = Math.random() > 0.3
        host.update({ status: isOnline })

        return {
          success: isOnline,
          message: isOnline ? 'Host is online' : 'Host is offline',
        }
      })

      // =============================================================================
      // SETTINGS
      // =============================================================================

      this.get('/settings', () => {
        return {
          success: true,
          message: 'Settings retrieved successfully',
          data: {
            networkConfig: {
              enable: false,
              ip: '192.168.1.50',
              networkMask: '255.255.255.0',
              gateway: '192.168.1.1',
              dns: '8.8.8.8',
            },
            pingPeriod: 60000,
          },
        }
      })

      this.get('/settings/network', () => {
        return {
          success: true,
          message: 'Network settings retrieved',
          data: {
            enable: false,
            ip: '192.168.1.50',
            networkMask: '255.255.255.0',
            gateway: '192.168.1.1',
            dns: '8.8.8.8',
          },
        }
      })

      this.put('/settings/network', (schema, request) => {
        const networkConfig = JSON.parse(request.requestBody)

        return {
          success: true,
          message: 'Network settings updated',
          data: networkConfig,
        }
      })

      this.get('/settings/auth', () => {
        return {
          success: true,
          message: 'Auth settings retrieved',
          data: {
            username: 'glavniy',
          },
        }
      })

      this.put('/settings/auth', (schema, request) => {
        const { username, password } = JSON.parse(request.requestBody)

        // Validaciones
        if (username && username.length > MAX_USERNAME_LENGTH) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: `Username exceeds maximum length of ${MAX_USERNAME_LENGTH} characters`,
            },
          )
        }

        if (password && password.length > MAX_PASSWORD_LENGTH) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: `Password exceeds maximum length of ${MAX_PASSWORD_LENGTH} characters`,
            },
          )
        }

        return {
          success: true,
          message: 'Auth settings updated successfully',
        }
      })

      this.get('/settings/about', () => {
        return {
          success: true,
          message: 'About information retrieved',
          data: {
            version: '3.0.0',
            hostname: 'wol',
          },
        }
      })

      this.get('/settings/ping_period', () => {
        return {
          success: true,
          message: 'Ping period retrieved',
          data: {
            pingPeriod: 60000,
          },
        }
      })

      this.put('/settings/ping_period', (schema, request) => {
        const { pingPeriod } = JSON.parse(request.requestBody)

        if (!VALID_PING_PERIODS.includes(pingPeriod / 1000)) {
          return new Response(
            400,
            {},
            {
              success: false,
              message: 'Invalid ping period',
            },
          )
        }

        return {
          success: true,
          message: 'Ping period updated',
          data: { pingPeriod },
        }
      })

      this.post('/settings/reset_wifi', () => {
        return {
          success: true,
          message: 'WiFi reset successful',
        }
      })

      // En producción, permitir que las peticiones pasen al servidor real
      if (import.meta.env.MODE === 'production') {
        this.passthrough()
      }
    },
  })
}
