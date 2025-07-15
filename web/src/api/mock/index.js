import { createServer, Model, Factory } from 'miragejs'
import { authRoutes } from './routes/auth.js'
import { hostsRoutes } from './routes/hosts.js'
import { settingsRoutes } from './routes/settings.js'

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
        name: 'PC',
        mac: 'AA:BB:CC:DD:EE:FF',
        ip: '192.168.1.100',
        autoWake: true,
        status: true,
      })
      server.create('host', {
        id: 2,
        name: 'NAS Service',
        mac: '11:22:33:44:55:66',
        ip: '192.168.1.101',
        autoWake: false,
        status: false,
      })
      server.create('host', {
        id: 3,
        name: 'Laptop',
        mac: '77:88:99:AA:BB:CC',
        ip: '192.168.1.102',
        autoWake: true,
        status: true,
      })
    },

    routes() {
      authRoutes.call(this)
      hostsRoutes.call(this)
      settingsRoutes.call(this)
    },
  })
}
