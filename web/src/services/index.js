import {
  hostsApi,
  networkOpsApi,
  systemApi,
  settingsApi,
  dataApi,
  pingApi,
  ApiError
} from './api.js'

import {
  mockHostsApi,
  mockNetworkOpsApi,
  mockSystemApi,
  mockSettingsApi,
  mockDataApi,
  mockPingApi,
  simulateHostStatusChanges
} from './mock.js'

// Determine environment
const isDevelopment = import.meta.env.VITE_APP_MODE === 'development'
const isDemo = import.meta.env.VITE_APP_MODE === 'demo'
const useMockData = isDevelopment || isDemo

// Initialize mock simulation if using mock data
if (useMockData) {
  simulateHostStatusChanges()
}

// Export the appropriate service implementation
export const hostsService = useMockData ? mockHostsApi : hostsApi
export const networkOpsService = useMockData ? mockNetworkOpsApi : networkOpsApi
export const systemService = useMockData ? mockSystemApi : systemApi
export const settingsService = useMockData ? mockSettingsApi : settingsApi
export const dataService = useMockData ? mockDataApi : dataApi
export const pingService = useMockData ? mockPingApi : pingApi

// Export utility functions and errors
export { ApiError }

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
