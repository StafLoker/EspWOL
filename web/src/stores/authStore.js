import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { apiClient } from '@/api/services'
import { useStorage } from '@vueuse/core'

export const useAuthStore = defineStore('auth', () => {
  // =============================================================================
  // STATE
  // =============================================================================

  // Reactive localStorage with useStorage
  const storedToken = useStorage('sessionToken', null)
  const storedUsername = useStorage('username', null)

  const user = ref({
    username: storedUsername.value,
    token: storedToken.value,
  })

  const isLoading = ref(false)
  const error = ref(null)

  // =============================================================================
  // WATCHERS - Sync user object with storage
  // =============================================================================

  // Watch storage changes and sync with user object
  watch(
    storedToken,
    (newToken) => {
      user.value.token = newToken
      // Ensure API client has the token when it changes
      if (newToken) {
        apiClient.setSessionToken(newToken)
      }
    },
    { immediate: true },
  )

  watch(
    storedUsername,
    (newUsername) => {
      user.value.username = newUsername
    },
    { immediate: true },
  )

  // Watch user object changes and sync with storage
  watch(
    () => user.value.token,
    (newToken) => {
      storedToken.value = newToken
    },
  )

  watch(
    () => user.value.username,
    (newUsername) => {
      storedUsername.value = newUsername
    },
  )

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
    if (name.includes(' ')) {
      return name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
    }
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
        // Update user object (will automatically sync with storage via watchers)
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
    } finally {
      // Clear user data (will automatically sync with storage via watchers)
      user.value = {
        username: null,
        token: null,
      }
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  // Initialize API client with stored token if available
  if (storedToken.value) {
    apiClient.setSessionToken(storedToken.value)
  }

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
    clearError,
  }
})
