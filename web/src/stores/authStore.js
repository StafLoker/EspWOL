// =============================================================================
// AUTH STORE - Store de autenticación con Pinia actualizado para ESP8266 v3.0.0
// =============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  // =============================================================================
  // STATE
  // =============================================================================

  const user = ref({
    username: null,
    token: null,
  })

  const isLoading = ref(false)
  const error = ref(null)

  // =============================================================================
  // GETTERS
  // =============================================================================

  const isAuthenticated = computed(() => {
    return user.value.token !== null
  })

  const username = computed(() => {
    return user.value.username
  })

  const shortUsername = computed(() => {
    const name = user.value.username
    if (!name) return 'U'

    // Si tiene espacios, tomar iniciales
    if (name.includes(' ')) {
      return name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
    }

    // Si no tiene espacios, tomar primeras 2 letras
    return name.substring(0, 2).toUpperCase()
  })

  // =============================================================================
  // ACTIONS
  // =============================================================================

  async function login(username, password) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.login(username, password)

      if (response.success) {
        user.value = {
          username: response.username,
          token: response.token,
        }

        return response
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (err) {
      error.value = err.message || 'Network error'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = null

    try {
      await apiClient.logout()
    } catch (err) {
      console.warn('Logout request failed:', err)
      // Continue with local logout even if server request fails
    } finally {
      // Always clear local state
      user.value = {
        username: null,
        token: null,
      }
      isLoading.value = false
    }
  }

  function initializeFromStorage() {
    const storedToken = localStorage.getItem('sessionToken')
    const storedUsername = localStorage.getItem('username')

    if (storedToken && storedUsername) {
      user.value = {
        username: storedUsername,
        token: storedToken,
      }

      // Ensure API client has the token
      apiClient.setSessionToken(storedToken)
    }
  }

  function clearError() {
    error.value = null
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  // Initialize from localStorage on store creation
  initializeFromStorage()

  // =============================================================================
  // RETURN STORE INTERFACE
  // =============================================================================

  return {
    // State
    user,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    username,
    shortUsername,

    // Actions
    login,
    logout,
    initializeFromStorage,
    clearError,
  }
})
