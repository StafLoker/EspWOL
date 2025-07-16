import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/api'
import { MAX_HOST_NAME_LENGTH } from '@/util/constants'
import { isValidIPv4, isValidMACAddress } from '@/util/validation'

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
  // Getters
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
    if (!metadata.value.canAddMoreHosts) {
      throw new Error(`Maximum number of hosts reached (${metadata.value.hosts.maxAllowed})`)
    }

    operations.value.adding = true
    error.value = null

    try {
      const response = await apiClient.hosts.addHost(hostData)

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

      const index = getHostIndex(id)
      if (index !== -1) {
        hosts.value.splice(index, 1)
      }

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
        await fetchHosts()

        if (response.metadata) {
          metadata.value = response.metadata
        }
      }

      return response
    } catch (err) {
      error.value = err.message || 'Error importing hosts'

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
  // Networks
  // =============================================================================

  async function wakeHost(id) {
    operations.value.waking.add(id)
    error.value = null

    try {
      const response = await apiClient.network.wakeHost(id)

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
      const response = await apiClient.hosts.pingHost(id)

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

  // =============================================================================
  // VALIDATION HELPERS
  // =============================================================================

  function validateHostData(hostData) {
    const errors = []

    if (!hostData.name || hostData.name.trim().length === 0) {
      errors.push('Host name is required')
    } else if (hostData.name.length > MAX_HOST_NAME_LENGTH) {
      errors.push('Host name exceeds maximum length of 32 characters')
    }

    if (!hostData.mac || !isValidMACAddress(hostData.mac)) {
      errors.push('Valid MAC address is required')
    }

    if (hostData.ip && !isValidIPv4(hostData.ip)) {
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
    wakeHost,
    pingHost,

    // Validation
    validateHostData,
    canAddMoreHosts,
    getRemainingHostSlots,
  }
})
