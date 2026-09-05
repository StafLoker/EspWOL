/*
 * Dev-only fake device API, so the UI can be worked on in a browser without
 * flashing anything. Active for `pnpm dev`; never part of a build.
 *
 * State lives in memory: it resets when the dev server restarts.
 */

const LATENCY_MS = 250

let nextId = 4
let hosts = [
  {
    id: 1,
    name: 'Compute server',
    mac: 'AA:EE:EA:97:3D:3A',
    ip: '192.168.1.8',
    autoWake: true,
    status: true,
  },
  {
    id: 2,
    name: 'Living room NAS',
    mac: 'AA:BB:CC:DD:EE:FF',
    ip: '192.168.1.20',
    autoWake: false,
    status: false,
  },
  {
    id: 3,
    name: 'Workstation',
    mac: '11:22:33:44:55:66',
    ip: '192.168.1.31',
    autoWake: false,
    status: true,
  },
]

let settings = {
  pingPeriod: 60000,
  network: {
    enable: false,
    ip: '192.168.1.100',
    networkMask: '255.255.255.0',
    gateway: '192.168.1.1',
    dns: '8.8.8.8',
  },
}

let user = { username: 'glavniy' }

const MAX_HOSTS = 20

const metadata = () => ({
  memory: { freeHeap: 28160, totalHeap: 40000, heapUsagePercent: 29.6 },
  storage: { freeFlash: 45056, totalFlash: 65536, flashUsagePercent: 31.25 },
  hosts: {
    count: hosts.length,
    maxAllowed: MAX_HOSTS,
    remaining: MAX_HOSTS - hosts.length,
  },
  hasEnoughMemory: true,
  canAddMoreHosts: hosts.length < MAX_HOSTS,
})

function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : null)
      } catch {
        resolve(null)
      }
    })
  })
}

// Each handler returns [status, payload]; `q` holds the query params.
const routes = {
  'GET /api/hosts': () => [
    200,
    { success: true, message: 'Hosts', data: hosts, metadata: metadata() },
  ],

  'POST /api/hosts': (_q, body) => {
    if (hosts.length >= MAX_HOSTS)
      return [507, { success: false, message: 'Maximum number of hosts reached' }]
    if (hosts.some((h) => h.mac === body.mac))
      return [409, { success: false, message: 'Duplicate host' }]

    const host = { id: nextId++, ...body, status: Math.random() > 0.5 }
    hosts.push(host)
    return [
      200,
      { success: true, message: 'Host added', data: host, metadata: metadata() },
    ]
  },

  'PUT /api/hosts': (q, body) => {
    const host = hosts.find((h) => h.id === Number(q.id))
    if (!host) return [400, { success: false, message: 'Host not found' }]
    Object.assign(host, body)
    return [
      200,
      { success: true, message: 'Host updated', data: host, metadata: metadata() },
    ]
  },

  'DELETE /api/hosts': (q) => {
    const i = hosts.findIndex((h) => h.id === Number(q.id))
    if (i === -1) return [400, { success: false, message: 'Host not found' }]
    hosts.splice(i, 1)
    return [200, { success: true, message: 'Host deleted', metadata: metadata() }]
  },

  'POST /api/hosts/ping': (q) => {
    const host = hosts.find((h) => h.id === Number(q.id))
    if (!host) return [400, { success: false, message: 'Host not found' }]
    host.status = Math.random() > 0.35
    return [
      200,
      {
        success: host.status,
        message: host.status ? 'Host is online' : 'Host is offline',
      },
    ]
  },

  'POST /api/hosts/wake': (q) => {
    const host = hosts.find((h) => h.id === Number(q.id))
    if (!host) return [400, { success: false, message: 'Host not found' }]
    host.status = true
    return [200, { success: true, message: 'WOL packet sent' }]
  },

  'POST /api/hosts/import': (_q, body) => {
    const incoming = Array.isArray(body) ? body : []
    let imported = 0
    for (const entry of incoming) {
      if (!entry.name || !entry.mac || !entry.ip) continue
      if (hosts.some((h) => h.mac === entry.mac)) continue
      if (hosts.length >= MAX_HOSTS) break
      hosts.push({ id: nextId++, autoWake: false, ...entry, status: false })
      imported++
    }
    return [
      200,
      {
        success: imported > 0,
        message: 'Import completed',
        data: {
          imported_count: imported,
          ignored_count: incoming.length - imported,
          input_size: incoming.length,
          current_host_count: hosts.length,
        },
        metadata: metadata(),
      },
    ]
  },

  'GET /api/settings': () => [
    200,
    {
      success: true,
      message: 'Settings',
      data: { about: { version: '3.0.1', hostname: 'espwol' }, ...settings },
    },
  ],

  'GET /api/settings/about': () => [
    200,
    {
      success: true,
      message: 'App general information',
      data: { version: '3.0.1', hostname: 'espwol' },
    },
  ],

  'GET /api/settings/network': () => [
    200,
    { success: true, message: 'Network settings', data: settings.network },
  ],

  'PUT /api/settings/network': (_q, body) => {
    settings.network = { ...settings.network, ...body }
    return [
      200,
      { success: true, message: 'Network updated; rebooting', data: settings.network },
    ]
  },

  'GET /api/settings/ping_period': () => [
    200,
    { success: true, message: 'Ping period', data: { pingPeriod: settings.pingPeriod } },
  ],

  'PUT /api/settings/ping_period': (_q, body) => {
    settings.pingPeriod = body.pingPeriod ?? 0
    return [
      200,
      {
        success: true,
        message: 'Ping period updated',
        data: { pingPeriod: settings.pingPeriod },
      },
    ]
  },

  'POST /api/settings/reset_wifi': () => [
    200,
    { success: true, message: 'WiFi settings have been reset successfully.' },
  ],

  'GET /api/account': () => [200, { success: true, message: 'User', data: user }],

  'PUT /api/account': (_q, body) => {
    if (!body?.username || body.username.length < 3)
      return [400, { success: false, message: 'Invalid username' }]
    user = { username: body.username }
    return [200, { success: true, message: 'User updated', data: user }]
  },
}

export function mockApi() {
  return {
    name: 'espwol-mock-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()

        const handler = routes[`${req.method} ${url.pathname}`]
        if (!handler) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ success: false, message: 'Not found' }))
        }

        const body = await readBody(req)
        const query = Object.fromEntries(url.searchParams)
        const [status, payload] = handler(query, body)

        await new Promise((r) => setTimeout(r, LATENCY_MS))

        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(payload))
      })
    },
  }
}
