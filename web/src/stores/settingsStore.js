import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/api'
import { isValidIPv4 } from '@/util/validation'
import { MAX_USERNAME_LENGTH, MAX_PASSWORD_LENGTH } from '@/util/constants'

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

  // TODO: read VALID_PING_PERIODS constatns and cuplate and add minite, disable o hours with i18n
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

  // Return i18n text
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
      if (!config.ip || !isValidIPv4(config.ip)) {
        errors.push('Valid IP address is required')
      }

      // Validate Network Mask
      if (!config.networkMask || !isValidIPv4(config.networkMask)) {
        errors.push('Valid network mask is required')
      }

      // Validate Gateway
      if (!config.gateway || !isValidIPv4(config.gateway)) {
        errors.push('Valid gateway address is required')
      }

      // Validate DNS
      if (!config.dns || !isValidIPv4(config.dns)) {
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
    } else if (config.username.length > MAX_USERNAME_LENGTH) {
      errors.push('Username cannot exceed 20 characters')
    }

    // Validate password
    // TODO: Add check complety of password
    if (!config.password || config.password.length === 0) {
      errors.push('Password is required')
    } else if (config.password.length > MAX_PASSWORD_LENGTH) {
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
