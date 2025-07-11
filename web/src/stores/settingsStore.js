// =============================================================================
// SETTINGS STORE - Store de configuración con Pinia para ESP8266 v3.0.0
// =============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/api'

export const useSettingsStore = defineStore('settings', () => {
  // =============================================================================
  // STATE
  // =============================================================================

  const settings = ref({
    networkConfig: {
      enable: false,
      ip: '',
      networkMask: '',
      gateway: '',
      dns: '',
    },
    pingPeriod: 60000,
  })

  const about = ref({
    version: '',
    hostname: '',
  })

  const authSettings = ref({
    username: '',
  })

  const isLoading = ref(false)
  const error = ref(null)

  // Estados de operaciones específicas
  const operations = ref({
    loadingAbout: false,
    savingNetwork: false,
    savingAuth: false,
    savingPing: false,
    resettingWiFi: false,
  })

  // =============================================================================
  // GETTERS
  // =============================================================================

  const validPingPeriods = computed(() => [
    { value: 0, label: 'Disabled', seconds: 0 },
    { value: 60000, label: '1 minute', seconds: 60 },
    { value: 300000, label: '5 minutes', seconds: 300 },
    { value: 600000, label: '10 minutes', seconds: 600 },
    { value: 900000, label: '15 minutes', seconds: 900 },
    { value: 1800000, label: '30 minutes', seconds: 1800 },
    { value: 2700000, label: '45 minutes', seconds: 2700 },
    { value: 3600000, label: '1 hour', seconds: 3600 },
    { value: 10800000, label: '3 hours', seconds: 10800 },
    { value: 21600000, label: '6 hours', seconds: 21600 },
    { value: 43200000, label: '12 hours', seconds: 43200 },
    { value: 86400000, label: '24 hours', seconds: 86400 },
  ])

  const currentPingPeriodLabel = computed(() => {
    const period = validPingPeriods.value.find((p) => p.value === settings.value.pingPeriod)
    return period ? period.label : 'Unknown'
  })

  const networkConfigFormatted = computed(() => ({
    ...settings.value.networkConfig,
    statusText: settings.value.networkConfig.enable ? 'Static IP' : 'DHCP',
  }))

  // =============================================================================
  // ACTIONS - General Settings
  // =============================================================================

  async function fetchAllSettings() {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.settings.getAllSettings()
      settings.value = response
      return response
    } catch (err) {
      error.value = err.message || 'Error loading settings'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // =============================================================================
  // ACTIONS - About Information
  // =============================================================================

  async function fetchAbout() {
    operations.value.loadingAbout = true
    error.value = null

    try {
      const response = await apiClient.settings.getAbout()
      about.value = response
      return response
    } catch (err) {
      error.value = err.message || 'Error loading about information'
      throw err
    } finally {
      operations.value.loadingAbout = false
    }
  }

  // =============================================================================
  // ACTIONS - Network Settings
  // =============================================================================

  async function fetchNetworkSettings() {
    try {
      const response = await apiClient.settings.getNetworkSettings()
      settings.value.networkConfig = response
      return response
    } catch (err) {
      error.value = err.message || 'Error loading network settings'
      throw err
    }
  }

  async function updateNetworkSettings(networkConfig) {
    operations.value.savingNetwork = true
    error.value = null

    try {
      const response = await apiClient.settings.updateNetworkSettings(networkConfig)

      // Update local state
      settings.value.networkConfig = { ...networkConfig }

      return response
    } catch (err) {
      error.value = err.message || 'Error updating network settings'
      throw err
    } finally {
      operations.value.savingNetwork = false
    }
  }

  // =============================================================================
  // ACTIONS - Authentication Settings
  // =============================================================================

  async function fetchAuthSettings() {
    try {
      const response = await apiClient.settings.getAuthSettings()
      authSettings.value = response
      return response
    } catch (err) {
      error.value = err.message || 'Error loading auth settings'
      throw err
    }
  }

  async function updateAuthSettings(authConfig) {
    operations.value.savingAuth = true
    error.value = null

    try {
      const response = await apiClient.settings.updateAuthSettings(authConfig)

      // Update local state (but don't store password)
      authSettings.value = {
        username: authConfig.username,
      }

      return response
    } catch (err) {
      error.value = err.message || 'Error updating auth settings'
      throw err
    } finally {
      operations.value.savingAuth = false
    }
  }

  // =============================================================================
  // ACTIONS - Ping Settings
  // =============================================================================

  async function fetchPingPeriod() {
    try {
      const response = await apiClient.settings.getPingPeriod()
      settings.value.pingPeriod = response.pingPeriod
      return response
    } catch (err) {
      error.value = err.message || 'Error loading ping period'
      throw err
    }
  }

  async function updatePingPeriod(pingPeriod) {
    operations.value.savingPing = true
    error.value = null

    try {
      const response = await apiClient.settings.updatePingPeriod(pingPeriod)

      // Update local state
      settings.value.pingPeriod = pingPeriod

      return response
    } catch (err) {
      error.value = err.message || 'Error updating ping period'
      throw err
    } finally {
      operations.value.savingPing = false
    }
  }

  // =============================================================================
  // ACTIONS - WiFi Reset
  // =============================================================================

  async function resetWiFi() {
    operations.value.resettingWiFi = true
    error.value = null

    try {
      const response = await apiClient.settings.resetWiFi()
      return response
    } catch (err) {
      error.value = err.message || 'Error resetting WiFi'
      throw err
    } finally {
      operations.value.resettingWiFi = false
    }
  }

  // =============================================================================
  // VALIDATION HELPERS
  // =============================================================================

  function validateNetworkConfig(config) {
    const errors = []

    if (config.enable) {
      // Validate IP
      if (
        !config.ip ||
        !/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
          config.ip,
        )
      ) {
        errors.push('Valid IP address is required')
      }

      // Validate Network Mask
      if (
        !config.networkMask ||
        !/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
          config.networkMask,
        )
      ) {
        errors.push('Valid network mask is required')
      }

      // Validate Gateway
      if (
        !config.gateway ||
        !/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
          config.gateway,
        )
      ) {
        errors.push('Valid gateway address is required')
      }

      // Validate DNS
      if (
        !config.dns ||
        !/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
          config.dns,
        )
      ) {
        errors.push('Valid DNS address is required')
      }
    }

    return errors
  }

  function validateAuthConfig(config) {
    const errors = []

    // Validate username
    if (!config.username || config.username.trim().length === 0) {
      errors.push('Username is required')
    } else if (config.username.length > 20) {
      errors.push('Username cannot exceed 20 characters')
    }

    // Validate password
    if (!config.password || config.password.length === 0) {
      errors.push('Password is required')
    } else if (config.password.length > 32) {
      errors.push('Password cannot exceed 32 characters')
    }

    return errors
  }

  function clearError() {
    error.value = null
  }

  // =============================================================================
  // RETURN STORE INTERFACE
  // =============================================================================

  return {
    // State
    settings,
    about,
    authSettings,
    isLoading,
    error,
    operations,

    // Getters
    validPingPeriods,
    currentPingPeriodLabel,
    networkConfigFormatted,

    // Actions
    fetchAllSettings,
    fetchAbout,
    fetchNetworkSettings,
    updateNetworkSettings,
    fetchAuthSettings,
    updateAuthSettings,
    fetchPingPeriod,
    updatePingPeriod,
    resetWiFi,

    // Validation
    validateNetworkConfig,
    validateAuthConfig,
    clearError,
  }
})
