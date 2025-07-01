// =============================================================================
// HOSTS STORE - Store de hosts con Pinia actualizado para ESP8266 v3.0.0
// =============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/api'

export const useHostsStore = defineStore('hosts', () => {
  // =============================================================================
  // STATE
  // =============================================================================

  const hosts = ref([])
  const metadata = ref({
    memory: {
      freeHeap: 0,
      totalHeap: 0,
      heapUsagePercent: 0,
    },
    storage: {
      freeFlash: 0,
      totalFlash: 0,
      flashUsagePercent: 0,
    },
    hosts: {
      count: 0,
      maxAllowed: 0,
      remaining: 0,
    },
    hasEnoughMemory: true,
    canAddMoreHosts: true,
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
    pinging: new Set(),
  })

  // =============================================================================
  // GETTERS
  // =============================================================================

  const hostsCount = computed(() => hosts.value.length)

  const onlineHosts = computed(() => hosts.value.filter((host) => host.status === true))

  const offlineHosts = computed(() => hosts.value.filter((host) => host.status === false))

  const autoWakeHosts = computed(() => hosts.value.filter((host) => host.autoWake === true))

  const memoryUsage = computed(() => ({
    used: metadata.value.memory?.heapUsagePercent || 0,
    free: metadata.value.memory?.freeHeap || 0,
    total: metadata.value.memory?.totalHeap || 0,
  }))

  const storageUsage = computed(() => ({
    used: metadata.value.storage?.flashUsagePercent || 0,
    free: metadata.value.storage?.freeFlash || 0,
    total: metadata.value.storage?.totalFlash || 0,
  }))

  const hostLimits = computed(() => ({
    current: metadata.value.hosts?.count || 0,
    max: metadata.value.hosts?.maxAllowed || 0,
    remaining: metadata.value.hosts?.remaining || 0,
    canAddMore: metadata.value.canAddMoreHosts || false,
  }))

  // Búsqueda en el store (sin hacer petición a la API)
  const searchHosts = computed(() => {
    return (searchTerm) => {
      if (!searchTerm) return hosts.value

      const term = searchTerm.toLowerCase()
      return hosts.value.filter(
        (host) =>
          host.name.toLowerCase().includes(term) ||
          host.ip.includes(term) ||
          host.mac.toLowerCase().includes(term),
      )
    }
  })

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  function getHostById(id) {
    return hosts.value.find((host) => host.id === id)
  }

  function getHostIndex(id) {
    return hosts.value.findIndex((host) => host.id === id)
  }

  function isHostOperationInProgress(hostId, operation) {
    if (operation === 'waking' || operation === 'pinging') {
      return operations.value[operation]?.has(hostId)
    }
    return operations.value[operation] || false
  }

  function clearError() {
    error.value = null
  }

  // =============================================================================
  // ACTIONS - Gestión de hosts
  // =============================================================================

  async function fetchHosts() {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.hosts.getAllHosts()
      hosts.value = response.hosts || []
      metadata.value = response.metadata || metadata.value
      return response
    } catch (err) {
      error.value = err.message || 'Error loading hosts'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function refreshHosts() {
    isRefreshing.value = true

    try {
      const response = await apiClient.hosts.getAllHosts()
      hosts.value = response.hosts || []
      metadata.value = response.metadata || metadata.value
      return response
    } catch (err) {
      console.warn('Auto-refresh failed:', err)
      throw err
    } finally {
      isRefreshing.value = false
    }
  }

  async function addHost(hostData) {
    // Verificar límites antes de intentar añadir
    if (!metadata.value.canAddMoreHosts) {
      throw new Error(`Maximum number of hosts reached (${metadata.value.hosts.maxAllowed})`)
    }

    operations.value.adding = true
    error.value = null

    try {
      const response = await apiClient.hosts.addHost(hostData)

      // Recargar la lista para obtener datos actualizados
      await fetchHosts()

      return response
    } catch (err) {
      error.value = err.message || 'Error adding host'
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

      // Actualizar el host en el store local
      const index = getHostIndex(id)
      if (index !== -1) {
        hosts.value[index] = { ...hosts.value[index], ...hostData }
      }

      return response
    } catch (err) {
      error.value = err.message || 'Error updating host'
      throw err
    } finally {
      operations.value.updating = false
    }
  }

  async function deleteHost(id) {
    operations.value.deleting = true
    error.value = null

    try {
      await apiClient.hosts.deleteHost(id)

      // Remover del store local
      const index = getHostIndex(id)
      if (index !== -1) {
        hosts.value.splice(index, 1)
      }

      // Actualizar metadata
      if (metadata.value.hosts) {
        metadata.value.hosts.count = hosts.value.length
        metadata.value.hosts.remaining = metadata.value.hosts.maxAllowed - hosts.value.length
        metadata.value.canAddMoreHosts = hosts.value.length < metadata.value.hosts.maxAllowed
      }
    } catch (err) {
      error.value = err.message || 'Error deleting host'
      throw err
    } finally {
      operations.value.deleting = false
    }
  }

  async function importHosts(hosts) {
    operations.value.importing = true
    error.value = null

    try {
      const response = await apiClient.hosts.importHosts(hosts)

      if (response.success) {
        // Actualizar la lista de hosts después de la importación exitosa
        await fetchHosts()

        // Actualizar metadatos si están disponibles
        if (response.metadata) {
          metadata.value = response.metadata
        }
      }

      // Devolver respuesta tal como viene del backend
      return response
    } catch (err) {
      error.value = err.message || 'Error importing hosts'

      // Devolver resultado de error en formato esperado
      return {
        success: false,
        message: err.message || 'Error importing hosts',
        imported_count: 0,
        ignored_count: 0,
        input_size: hosts.length,
        current_host_count: hostsCount.value,
      }
    } finally {
      operations.value.importing = false
    }
  }

  // =============================================================================
  // ACTIONS - Operaciones de red
  // =============================================================================

  async function wakeHost(id) {
    operations.value.waking.add(id)
    error.value = null

    try {
      const response = await apiClient.network.wakeHost(id)

      // Actualizar estado optimísticamente
      const index = getHostIndex(id)
      if (index !== -1) {
        hosts.value[index].status = true
      }

      return response
    } catch (err) {
      error.value = err.message || 'Error waking host'
      throw err
    } finally {
      operations.value.waking.delete(id)
    }
  }

  async function pingHost(id) {
    operations.value.pinging.add(id)
    error.value = null

    try {
      const response = await apiClient.network.pingHost(id)

      // Actualizar estado según respuesta
      const index = getHostIndex(id)
      if (index !== -1) {
        hosts.value[index].status = response.success
      }

      return response
    } catch (err) {
      error.value = err.message || 'Error pinging host'
      throw err
    } finally {
      operations.value.pinging.delete(id)
    }
  }

  async function pingAllHosts() {
    const pingPromises = hosts.value.map((host) =>
      pingHost(host.id).catch((err) => console.warn(`Ping failed for ${host.name}:`, err)),
    )

    await Promise.allSettled(pingPromises)
  }

  // =============================================================================
  // VALIDATION HELPERS
  // =============================================================================

  function validateHostData(hostData) {
    const errors = []

    // Validar nombre
    if (!hostData.name || hostData.name.trim().length === 0) {
      errors.push('Host name is required')
    } else if (hostData.name.length > 32) {
      errors.push('Host name exceeds maximum length of 32 characters')
    }

    // Validar MAC
    if (!hostData.mac || !/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(hostData.mac)) {
      errors.push('Valid MAC address is required')
    }

    // Validar IP (opcional)
    if (
      hostData.ip &&
      !/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        hostData.ip,
      )
    ) {
      errors.push('Invalid IP address format')
    }

    return errors
  }

  function canAddMoreHosts() {
    return metadata.value.canAddMoreHosts && hostsCount.value < metadata.value.hosts.maxAllowed
  }

  function getRemainingHostSlots() {
    return Math.max(0, metadata.value.hosts.maxAllowed - hostsCount.value)
  }

  // =============================================================================
  // RETURN STORE INTERFACE
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
    searchHosts,

    // Helper functions
    getHostById,
    getHostIndex,
    isHostOperationInProgress,
    clearError,

    // Host management actions
    fetchHosts,
    refreshHosts,
    addHost,
    updateHost,
    deleteHost,
    importHosts,

    // Network operations
    wakeHost,
    pingHost,
    pingAllHosts,

    // Validation
    validateHostData,
    canAddMoreHosts,
    getRemainingHostSlots,
  }
})
