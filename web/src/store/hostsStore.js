// =============================================================================
// HOSTS STORE - Store de hosts con Pinia
// =============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/services/api'

export const useHostsStore = defineStore('hosts', () => {
  // =============================================================================
  // STATE
  // =============================================================================

  const hosts = ref([])
  const metadata = ref({
    memory: null,
    storage: null,
    hosts: null,
    hasEnoughMemory: true,
    canAddMoreHosts: true
  })

  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const error = ref(null)

  // Estados de operaciones individuales
  const operations = ref({
    adding: false,
    updating: false,
    deleting: false,
    importing: false,
    waking: new Set(),
    pinging: new Set()
  })

  // =============================================================================
  // GETTERS
  // =============================================================================

  const hostsCount = computed(() => hosts.value.length)

  const onlineHosts = computed(() =>
    hosts.value.filter(host => host.status === true)
  )

  const offlineHosts = computed(() =>
    hosts.value.filter(host => host.status === false)
  )

  const autoWakeHosts = computed(() =>
    hosts.value.filter(host => host.autoWake === true)
  )

  const memoryUsage = computed(() => ({
    used: metadata.value.memory?.heapUsagePercent || 0,
    free: metadata.value.memory?.freeHeap || 0,
    total: metadata.value.memory?.totalHeap || 0
  }))

  const storageUsage = computed(() => ({
    used: metadata.value.storage?.flashUsagePercent || 0,
    free: metadata.value.storage?.freeFlash || 0,
    total: metadata.value.storage?.totalFlash || 0
  }))

  const hostLimits = computed(() => ({
    current: metadata.value.hosts?.count || 0,
    max: metadata.value.hosts?.maxAllowed || 0,
    remaining: metadata.value.hosts?.remaining || 0,
    canAddMore: metadata.value.canAddMoreHosts || false
  }))

  function getHostById(id) {
    return hosts.value.find(host => host.id === id)
  }

  function getHostIndex(id) {
    return hosts.value.findIndex(host => host.id === id)
  }

  function isHostOperationInProgress(hostId, operation) {
    return operations.value[operation]?.has?.(hostId) || false
  }

  // =============================================================================
  // ACTIONS
  // =============================================================================

  async function loadHosts(showLoading = true) {
    if (showLoading) isLoading.value = true
    if (!showLoading) isRefreshing.value = true
    error.value = null

    try {
      const response = await apiClient.hosts.getAllHosts()

      if (response.success) {
        hosts.value = response.data || []

        // Actualizar metadata si está disponible
        if (response.metadata) {
          metadata.value = response.metadata
        }

        return response
      } else {
        throw new Error(response.message || 'Failed to load hosts')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
      isRefreshing.value = false
    }
  }

  async function addHost(hostData) {
    operations.value.adding = true
    error.value = null

    try {
      const response = await apiClient.hosts.addHost(hostData)

      if (response.success) {
        // Agregar el nuevo host al array
        if (response.data) {
          hosts.value.push(response.data)
        }

        // Actualizar metadata si está disponible
        if (response.metadata) {
          metadata.value = response.metadata
        }

        return response
      } else {
        throw new Error(response.message || 'Failed to add host')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      operations.value.adding = false
    }
  }

  async function updateHost(id, hostData) {
    operations.value.updating = true
    error.value = null

    try {
      const response = await apiClient.hosts.updateHost(id, hostData)

      if (response.success) {
        // Actualizar el host en el array
        const index = getHostIndex(id)
        if (index !== -1 && response.data) {
          hosts.value[index] = response.data
        }

        // Actualizar metadata si está disponible
        if (response.metadata) {
          metadata.value = response.metadata
        }

        return response
      } else {
        throw new Error(response.message || 'Failed to update host')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      operations.value.updating = false
    }
  }

  async function deleteHost(id) {
    operations.value.deleting = true
    error.value = null

    try {
      const response = await apiClient.hosts.deleteHost(id)

      if (response.success || response.status === 204) {
        // Eliminar el host del array
        const index = getHostIndex(id)
        if (index !== -1) {
          hosts.value.splice(index, 1)
        }

        // Actualizar contadores de metadata
        if (metadata.value.hosts) {
          metadata.value.hosts.count = hosts.value.length
          metadata.value.hosts.remaining = metadata.value.hosts.maxAllowed - hosts.value.length
          metadata.value.canAddMoreHosts = hosts.value.length < metadata.value.hosts.maxAllowed
        }

        return response
      } else {
        throw new Error(response.message || 'Failed to delete host')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      operations.value.deleting = false
    }
  }

  async function wakeHost(id) {
    operations.value.waking.add(id)
    error.value = null

    try {
      const response = await apiClient.network.wakeHost(id)

      if (response.success) {
        // Optimistically update status
        const index = getHostIndex(id)
        if (index !== -1) {
          hosts.value[index].status = true
        }

        // Optional: Ping after a delay to verify
        setTimeout(() => {
          pingHost(id).catch(() => {
            // Silent fail for verification ping
          })
        }, 3000)

        return response
      } else {
        throw new Error(response.message || 'Failed to send WOL packet')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      operations.value.waking.delete(id)
    }
  }

  async function pingHost(id) {
    operations.value.pinging.add(id)

    try {
      const response = await apiClient.network.pingHost(id)

      // Actualizar status basado en el resultado del ping
      const index = getHostIndex(id)
      if (index !== -1) {
        hosts.value[index].status = response.success
      }

      return response
    } catch (err) {
      // No mostrar error para pings fallidos ya que es información de estado
      console.warn(`Ping failed for host ${id}:`, err.message)

      // Marcar como offline si el ping falla
      const index = getHostIndex(id)
      if (index !== -1) {
        hosts.value[index].status = false
      }

      throw err
    } finally {
      operations.value.pinging.delete(id)
    }
  }

  async function pingAllHosts() {
    const pingPromises = hosts.value.map(host =>
      pingHost(host.id).catch(() => {
        // Silent fail para pings individuales
      })
    )

    await Promise.allSettled(pingPromises)
  }

  async function importHosts(hostsData) {
    operations.value.importing = true
    error.value = null

    try {
      const response = await apiClient.hosts.importHosts(hostsData)

      if (response.success) {
        // Recargar la lista completa después de la importación
        await loadHosts(false)

        return response
      } else {
        throw new Error(response.message || 'Failed to import hosts')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      operations.value.importing = false
    }
  }

  function clearHosts() {
    hosts.value = []
    metadata.value = {
      memory: null,
      storage: null,
      hosts: null,
      hasEnoughMemory: true,
      canAddMoreHosts: true
    }
  }

  function clearError() {
    error.value = null
  }

  // Auto-refresh functionality
  let refreshInterval = null

  function startAutoRefresh(intervalMs = 60000) {
    stopAutoRefresh()

    refreshInterval = setInterval(async () => {
      if (!isLoading.value && !error.value) {
        try {
          await loadHosts(false)
        } catch (err) {
          console.warn('Auto-refresh failed:', err.message)
        }
      }
    }, intervalMs)
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    hosts,
    metadata,
    isLoading,
    isRefreshing,
    error,
    operations,

    // Getters
    hostsCount,
    onlineHosts,
    offlineHosts,
    autoWakeHosts,
    memoryUsage,
    storageUsage,
    hostLimits,
    getHostById,
    getHostIndex,
    isHostOperationInProgress,

    // Actions
    loadHosts,
    addHost,
    updateHost,
    deleteHost,
    wakeHost,
    pingHost,
    pingAllHosts,
    importHosts,
    clearHosts,
    clearError,
    startAutoRefresh,
    stopAutoRefresh
  }
})
