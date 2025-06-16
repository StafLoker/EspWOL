/**
 * Mock Service for Development/Demo
 * Simulates API responses with realistic delays
 */

// Mock data
let mockHosts = [
  {
    name: 'Server Principal',
    mac: 'e8:e0:5e:97:3d:af',
    ip: '192.168.2.7',
    periodicPing: 60,
    autoWake: true,
    isOnline: true,
    lastPing: 120
  },
  {
    name: 'Estación de Trabajo',
    mac: '12:34:56:78:90:ab',
    ip: '192.168.2.8',
    periodicPing: 300,
    autoWake: false,
    isOnline: false,
    lastPing: 3600
  },
  {
    name: 'PC Gaming',
    mac: 'aa:bb:cc:dd:ee:ff',
    ip: '192.168.2.9',
    periodicPing: 60,
    autoWake: true,
    isOnline: true,
    lastPing: 45
  },
  {
    name: 'Servidor de Medios',
    mac: '11:22:33:44:55:66',
    ip: '192.168.2.10',
    periodicPing: 900,
    autoWake: false,
    isOnline: false,
    lastPing: null
  },
  {
    name: 'Backup Server',
    mac: 'ff:ee:dd:cc:bb:aa',
    ip: '192.168.2.11',
    periodicPing: 3600,
    autoWake: true,
    isOnline: true,
    lastPing: 600
  }
]

let mockSystemInfo = {
  version: '1.2.3',
  lastVersion: false,
  hostname: 'espwol-device'
}

let mockNetworkSettings = {
  enable: true,
  ip: '192.168.1.100',
  networkMask: '255.255.255.0',
  gateway: '192.168.1.1',
  dns: '8.8.8.8'
}

let mockAuthSettings = {
  enable: true,
  username: 'admin',
  password: '' // Never return password
}

let mockPingSettings = {
  globalInterval: 60
}

// Utility function to simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Utility function to simulate API response
const mockResponse = (data, success = true, message = 'Operation completed successfully') => ({
  ...data,
  success,
  message
})

// Mock Hosts API
export const mockHostsApi = {
  async getAll() {
    await delay(300)
    return mockHosts.map(host => ({
      name: host.name,
      mac: host.mac,
      ip: host.ip,
      periodicPing: host.periodicPing
    }))
  },

  async getById(id) {
    await delay(200)
    const host = mockHosts[id]
    if (!host) {
      throw new Error('Host not found')
    }
    return host
  },

  async create(hostData) {
    await delay(600)
    const newHost = {
      ...hostData,
      isOnline: Math.random() > 0.5,
      lastPing: Math.random() > 0.3 ? Math.floor(Math.random() * 3600) : null
    }
    mockHosts.push(newHost)
    return mockResponse({}, true, 'Host added successfully')
  },

  async update(id, hostData) {
    await delay(500)
    if (id >= mockHosts.length || id < 0) {
      throw new Error('Host not found')
    }
    mockHosts[id] = {
      ...mockHosts[id],
      ...hostData
    }
    return mockResponse({}, true, 'Host updated successfully')
  },

  async delete(id) {
    await delay(400)
    if (id >= mockHosts.length || id < 0) {
      throw new Error('Host not found')
    }
    mockHosts.splice(id, 1)
    return mockResponse({}, true, 'Host deleted successfully')
  }
}

// Mock Network Operations API
export const mockNetworkOpsApi = {
  async ping(id) {
    await delay(800)
    if (id >= mockHosts.length || id < 0) {
      throw new Error('Host not found')
    }

    // Simulate ping response
    const success = Math.random() > 0.2 // 80% success rate
    mockHosts[id].lastPing = success ? Date.now() / 1000 : mockHosts[id].lastPing
    mockHosts[id].isOnline = success

    return mockResponse({}, success, success ? 'Ping successful' : 'Ping failed - host unreachable')
  },

  async wake(id) {
    await delay(1000)
    if (id >= mockHosts.length || id < 0) {
      throw new Error('Host not found')
    }

    // Simulate WOL packet sending
    const success = Math.random() > 0.1 // 90% success rate
    if (success) {
      // Simulate host waking up after a delay
      setTimeout(() => {
        mockHosts[id].isOnline = true
        mockHosts[id].lastPing = Date.now() / 1000
      }, 2000)
    }

    return mockResponse({}, success, success ? 'WOL packet sent successfully' : 'Failed to send WOL packet')
  }
}

// Mock System API
export const mockSystemApi = {
  async getAbout() {
    await delay(200)
    return mockSystemInfo
  },

  async getVersionInfo() {
    await delay(400)
    return {
      version: mockSystemInfo.version,
      lastVersion: '1.3.0',
      notesLastVersion: mockSystemInfo.lastVersion ? undefined : 'Bug fixes and performance improvements. Added new ping management features.'
    }
  },

  async updateVersion() {
    await delay(2000)
    // Simulate successful update
    mockSystemInfo.version = '1.3.0'
    mockSystemInfo.lastVersion = true
    return mockResponse({}, true, 'Update initiated successfully')
  }
}

// Mock Settings API
export const mockSettingsApi = {
  async getNetworkSettings() {
    await delay(300)
    return mockNetworkSettings
  },

  async updateNetworkSettings(settings) {
    await delay(800)
    mockNetworkSettings = { ...mockNetworkSettings, ...settings }
    return mockResponse({}, true, 'Network settings updated successfully')
  },

  async getAuthSettings() {
    await delay(250)
    return mockAuthSettings
  },

  async updateAuthSettings(settings) {
    await delay(700)
    mockAuthSettings = {
      ...mockAuthSettings,
      ...settings,
      password: '' // Never store password in mock
    }
    return mockResponse({}, true, 'Authentication settings updated successfully')
  },

  async resetWifi() {
    await delay(1500)
    // Simulate WiFi reset
    mockNetworkSettings.enable = false
    return mockResponse({}, true, 'WiFi settings reset successfully')
  }
}

// Mock Data Management API
export const mockDataApi = {
  async importHosts(hosts) {
    await delay(1000)
    // Validate and add hosts
    const validHosts = hosts.filter(host =>
      host.name && host.mac && host.ip
    )

    // Add to mock data
    validHosts.forEach(host => {
      mockHosts.push({
        ...host,
        periodicPing: host.periodicPing || 0,
        autoWake: host.autoWake || false,
        isOnline: Math.random() > 0.5,
        lastPing: Math.random() > 0.3 ? Math.floor(Math.random() * 3600) : null
      })
    })

    return mockResponse({}, true, `Successfully imported ${validHosts.length} hosts`)
  },

  async exportHosts() {
    await delay(500)

    // Create CSV content
    const csvHeader = 'Name,MAC Address,IP Address,Periodic Ping,Auto Wake\n'
    const csvContent = mockHosts.map(host =>
      `${host.name},${host.mac},${host.ip},${host.periodicPing || 0},${host.autoWake || false}`
    ).join('\n')

    const csvData = csvHeader + csvContent

    // Generate filename with timestamp
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-')
    const filename = `espwol-export-${timestamp}.csv`

    // Create and download file
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    return mockResponse({}, true, 'Export completed successfully')
  }
}

// Mock Ping API
export const mockPingApi = {
  async getGlobalSettings() {
    await delay(200)
    return mockPingSettings
  },

  async updateGlobalSettings(settings) {
    await delay(600)
    mockPingSettings = { ...mockPingSettings, ...settings }
    return mockResponse({}, true, 'Global ping settings updated successfully')
  }
}

// Utility to get mock host status (for real-time updates)
export const getMockHostStatus = () => {
  return mockHosts.map((host, index) => ({
    id: index,
    isOnline: host.isOnline,
    lastPing: host.lastPing
  }))
}

// Utility to simulate host status changes
export const simulateHostStatusChanges = () => {
  setInterval(() => {
    // Randomly change status of some hosts
    mockHosts.forEach((host, index) => {
      if (Math.random() < 0.1) { // 10% chance of status change
        host.isOnline = !host.isOnline
        host.lastPing = host.isOnline ? Date.now() / 1000 : host.lastPing
      }
    })
  }, 30000) // Every 30 seconds
}
