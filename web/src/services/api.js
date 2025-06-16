const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://wol.local'

class ApiError extends Error {
  constructor(message, status, response) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.response = response
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        response
      )
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Network or other errors
    throw new ApiError(
      `Network error: ${error.message}`,
      0,
      null
    )
  }
}

// Hosts API
export const hostsApi = {
  // Get all hosts
  async getAll() {
    return await apiRequest('/hosts')
  },

  // Get host by ID
  async getById(id) {
    return await apiRequest(`/hosts/${id}`)
  },

  // Add new host
  async create(hostData) {
    return await apiRequest('/hosts', {
      method: 'POST',
      body: JSON.stringify(hostData),
    })
  },

  // Update host
  async update(id, hostData) {
    return await apiRequest(`/hosts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hostData),
    })
  },

  // Delete host
  async delete(id) {
    return await apiRequest(`/hosts/${id}`, {
      method: 'DELETE',
    })
  },
}

// Network Operations API
export const networkOpsApi = {
  // Ping host
  async ping(id) {
    return await apiRequest(`/ping/${id}`, {
      method: 'POST',
    })
  },

  // Wake host (WOL)
  async wake(id) {
    return await apiRequest(`/wake/${id}`, {
      method: 'POST',
    })
  },
}

// System API
export const systemApi = {
  // Get system information
  async getAbout() {
    return await apiRequest('/about')
  }
}

// Settings API
export const settingsApi = {
  // Network Settings
  async getNetworkSettings() {
    return await apiRequest('/networkSettings')
  },

  async updateNetworkSettings(settings) {
    return await apiRequest('/networkSettings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  },

  // Authentication Settings
  async getAuthSettings() {
    return await apiRequest('/authenticationSettings')
  },

  async updateAuthSettings(settings) {
    return await apiRequest('/authenticationSettings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  },

  // Reset WiFi
  async resetWifi() {
    return await apiRequest('/resetWifi', {
      method: 'POST',
    })
  },
}

// Data Management API
export const dataApi = {
  // Import hosts
  async importHosts(hosts) {
    return await apiRequest('/import', {
      method: 'POST',
      body: JSON.stringify(hosts),
    })
  },

  // Export hosts (handled client-side since API returns data, not file)
  async exportHosts() {
    const hosts = await hostsApi.getAll()

    // Create CSV content
    const csvHeader = 'Name,MAC Address,IP Address,Periodic Ping,Auto Wake\n'
    const csvContent = hosts.map(host =>
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

    return { success: true, message: 'Export completed successfully' }
  },
}

// Global ping settings (if implemented on backend)
export const pingApi = {
  async getGlobalSettings() {
    // This would need to be implemented on backend
    // For now, return default
    return { globalInterval: 60 }
  },

  async updateGlobalSettings(settings) {
    // This would need to be implemented on backend
    // For now, simulate success
    return { success: true, message: 'Ping settings updated' }
  },
}

// Export error class for error handling
export { ApiError }
