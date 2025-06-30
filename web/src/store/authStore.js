// =============================================================================
// AUTH STORE - Store de autenticación con Pinia
// =============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // =============================================================================
  // STATE
  // =============================================================================

  const user = ref({
    username: null,
    token: null
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
      return name.split(' ')
        .map(word => word.charAt(0).toUpperCase())
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
          token: response.token
        }

        // El token ya se guarda en localStorage en apiClient
        return response
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = null

    try {
      // Intentar logout en el servidor
      await apiClient.logout()
    } catch (err) {
      // Incluso si falla el logout en el servidor, limpiamos localmente
      console.warn('Server logout failed:', err.message)
    } finally {
      // Limpiar estado local
      clearAuthData()
      isLoading.value = false
    }
  }

  function clearAuthData() {
    user.value = {
      username: null,
      token: null
    }

    // Limpiar datos del cliente API
    apiClient.clearSession()

    error.value = null
  }

  function initializeAuth() {
    // Restaurar datos desde localStorage
    const token = localStorage.getItem('sessionToken')
    const username = localStorage.getItem('username')

    if (token && username) {
      user.value = {
        username,
        token
      }

      // Configurar el token en el cliente API
      apiClient.setSessionToken(token)
    }
  }

  async function updateCredentials(newUsername, newPassword) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.settings.updateAuthSettings({
        username: newUsername,
        password: newPassword
      })

      if (response.success) {
        // Actualizar username local si cambió
        user.value.username = response.data.username
        localStorage.setItem('username', response.data.username)

        // Las sesiones se invalidan en el servidor, por lo que necesitamos hacer logout
        clearAuthData()

        return response
      } else {
        throw new Error(response.message || 'Update failed')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function getCurrentUserInfo() {
    try {
      const response = await apiClient.settings.getAuthSettings()

      if (response.success && response.data) {
        // Actualizar username si ha cambiado
        if (response.data.username !== user.value.username) {
          user.value.username = response.data.username
          localStorage.setItem('username', response.data.username)
        }

        return response.data
      }
    } catch (err) {
      console.warn('Failed to get current user info:', err.message)
      // Si falla, probablemente el token expiró
      if (err.status === 401) {
        clearAuthData()
      }
    }
  }

  function clearError() {
    error.value = null
  }

  // =============================================================================
  // RETURN
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
    clearAuthData,
    initializeAuth,
    updateCredentials,
    getCurrentUserInfo,
    clearError
  }
})
