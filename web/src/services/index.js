/**
 * Service Factory
 * Provides the appropriate API implementation based on environment
 */

import {
  hostsApi,
  networkOpsApi,
  systemApi,
  settingsApi,
  dataApi,
  pingApi,
  ApiError
} from './api.service.js'

import {
  mockHostsApi,
  mockNetworkOpsApi,
  mockSystemApi,
  mockSettingsApi,
  mockDataApi,
  mockPingApi,
  simulateHostStatusChanges
} from './mock.service.js'

// Determine environment
const isDevelopment = import.meta.env.DEV
const isDemo = import.meta.env.VITE_APP_MODE === 'demo'
const useMockData = isDevelopment || isDemo

// Initialize mock simulation if using mock data
if (useMockData) {
  simulateHostStatusChanges()
}

// Export the appropriate service implementation
export const hosts = useMockData ? mockHostsApi : hostsApi
export const networkOps = useMockData ? mockNetworkOpsApi : networkOpsApi
export const system = useMockData ? mockSystemApi : systemApi
export const settings = useMockData ? mockSettingsApi : settingsApi
export const data = useMockData ? mockDataApi : dataApi
export const ping = useMockData ? mockPingApi : pingApi

// Export utility functions and errors
export { ApiError }

// Export environment info
export const environment = {
  isDevelopment,
  isDemo,
  useMockData,
  mode: import.meta.env.MODE,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://wol.local'
}

// Service status checker
export const checkServiceStatus = async () => {
  try {
    if (useMockData) {
      return {
        available: true,
        type: 'mock',
        version: '1.0.0-mock'
      }
    }

    const info = await system.getAbout()
    return {
      available: true,
      type: 'real',
      version: info.version,
      hostname: info.hostname
    }
  } catch (error) {
    return {
      available: false,
      type: useMockData ? 'mock' : 'real',
      error: error.message
    }
  }
}

// Global error handler
export const handleApiError = (error) => {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return 'Authentication required'
      case 403:
        return 'Access denied'
      case 404:
        return 'Resource not found'
      case 500:
        return 'Server error'
      default:
        return error.message
    }
  }

  return 'Network error. Please check your connection.'
}

// Development helper
if (isDevelopment) {
  window.__espwol_services = {
    hosts,
    networkOps,
    system,
    settings,
    data,
    ping,
    environment,
    checkServiceStatus
  }

  console.log('🔧 EspWOL Services loaded in development mode')
  console.log('📡 Using', useMockData ? 'mock data' : 'real API')
  console.log('🌐 API Base URL:', environment.apiBaseUrl)
}
