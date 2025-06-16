<template>
  <div class="h-full">
    <div class="flex justify-between items-center">
      <p class="text-2xl font-medium text">{{ $t('pages.home.hosts') }}</p>
      <button class="button-apply flex items-center" @click="handleAddHost()">
        <i class="material-symbols-outlined mr-1">add</i>
        {{ $t('pages.home.addHost') }}
      </button>
    </div>
    <Separator class="separator-bold" />

    <!-- Loading State -->
    <div v-if="loading" class="mt-7 grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      <div v-for="n in 6" :key="n" class="host-card animate-pulse">
        <div class="h-6 bg-stone-300 dark:bg-zinc-600 rounded mb-4"></div>
        <div class="flex items-center mb-4 bg-zinc-200 dark:bg-zinc-700 rounded-2xl px-2 py-3">
          <div class="w-12 h-12 bg-stone-300 dark:bg-zinc-600 rounded-full mr-4"></div>
          <div class="flex-1">
            <div class="h-4 bg-stone-300 dark:bg-zinc-600 rounded mb-2"></div>
            <div class="h-3 bg-stone-300 dark:bg-zinc-600 rounded w-3/4"></div>
          </div>
        </div>
        <div class="flex items-center gap-3 justify-end">
          <div class="w-10 h-10 bg-stone-300 dark:bg-zinc-600 rounded-lg"></div>
          <div class="w-10 h-10 bg-stone-300 dark:bg-zinc-600 rounded-lg"></div>
        </div>
      </div>
    </div>

    <!-- Hosts Grid -->
    <div
      v-else-if="hosts.length > 0"
      class="mt-7 grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
    >
      <HostCard
        v-for="(host, index) in hosts"
        :key="`${host.name}-${index}`"
        :name="host.name"
        :ip="host.ip"
        :mac="host.mac"
        :is-wake="host.isOnline || false"
        @toggle-power="handleTogglePower(index)"
        @edit="handleEditHost(index)"
        @delete="handleDeleteHost(index)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="mt-16 text-center">
      <div
        class="mx-auto w-24 h-24 bg-stone-200 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-6"
      >
        <i class="material-symbols-outlined text-4xl text-stone-400 dark:text-zinc-500">devices</i>
      </div>
      <h3 class="text-lg font-semibold text-warm-gray-800 dark:text-stone-100 mb-2">
        No hosts configured
      </h3>
      <p class="text-warm-gray-600 dark:text-stone-400 mb-6 max-w-md mx-auto">
        Get started by adding your first device. You can wake up computers, servers, and other
        network devices.
      </p>
      <button class="button-apply flex items-center mx-auto" @click="handleAddHost()">
        <i class="material-symbols-outlined mr-2">add</i>
        Add Your First Host
      </button>
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <div class="flex items-center">
        <i class="material-symbols-outlined text-red-600 dark:text-red-400 mr-3">error</i>
        <div>
          <h4 class="text-red-800 dark:text-red-200 font-medium">Error loading hosts</h4>
          <p class="text-red-600 dark:text-red-400 text-sm mt-1">{{ error }}</p>
        </div>
        <button @click="loadHosts" class="ml-auto pill-button-apply text-xs">
          <i class="material-symbols-outlined text-sm mr-1">refresh</i>
          Retry
        </button>
      </div>
    </div>

    <!-- Service Status (Development only) -->
    <div v-if="environment.isDevelopment" class="fixed bottom-4 right-4 z-50">
      <div class="bg-stone-800 dark:bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        {{ environment.useMockData ? '🔧 Mock Data' : '📡 Real API' }}
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialogRoot v-model:open="deleteDialogOpen">
      <AlertDialogPortal>
        <AlertDialogOverlay class="dialog-overlay" />
        <AlertDialogContent class="dialog-content max-w-[450px]">
          <AlertDialogTitle class="dialog-title">
            {{ $t('pages.home.deleteHost.title') }}
          </AlertDialogTitle>
          <AlertDialogDescription class="dialog-description">
            {{
              $t('pages.home.deleteHost.description', {
                hostName: hostToDelete?.name,
                hostIp: hostToDelete?.ip,
              })
            }}
          </AlertDialogDescription>
          <div class="dialog-actions">
            <AlertDialogCancel class="pill-button-cancel">
              {{ $t('pages.home.deleteHost.cancel') }}
            </AlertDialogCancel>
            <AlertDialogAction
              class="pill-button-deny-solid"
              @click="confirmDeleteHost"
              :disabled="deleteLoading"
            >
              <span v-if="deleteLoading" class="flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Deleting...
              </span>
              <span v-else>
                {{ $t('pages.home.deleteHost.confirm') }}
              </span>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>

    <!-- Host Dialog -->
    <HostDialog v-model:open="hostDialogOpen" :host="hostToEdit" @save="handleSaveHost" />
  </div>
</template>

<script setup>
import HostCard from '@/components/HostCard.vue'
import HostDialog from '@/components/HostDialog.vue'
import {
  Separator,
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction
} from 'reka-ui'
import { ref, onMounted, onUnmounted } from 'vue'
import { hostsService, networkOpsService, handleApiError } from '@/services'
// State
const hosts = ref([])
const loading = ref(true)
const error = ref(null)

const hostDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const deleteLoading = ref(false)
const hostToDeleteIndex = ref(null)
const hostToDelete = ref(null)
const hostToEdit = ref(null)

// Methods
async function loadHosts() {
  try {
    loading.value = true
    error.value = null

    const data = await hostsService.getAll()
    hosts.value = data || []

    console.log('Hosts loaded:', data?.length || 0)
  } catch (err) {
    console.error('Error loading hosts:', err)
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

function handleAddHost() {
  hostToEdit.value = null
  hostDialogOpen.value = true
}

async function handleTogglePower(index) {
  const host = hostsService.value[index]
  if (!host) return

  try {
    if (host.isOnline) {
      // For now, we'll just simulate turning off
      // In a real implementation, you might have a shutdown endpoint
      hostsService.value[index].isOnline = false
      console.log(`Simulated power off for ${host.name}`)
    } else {
      // Send WOL packet
      await networkOpsService.wake(index)
      console.log(`WOL packet sent to ${host.name}`)

      // Optimistically update UI
      host.value[index].isOnline = true

      // Optionally verify with ping after a delay
      setTimeout(async () => {
        try {
          await networkOpsService.ping(index)
        } catch (err) {
          console.warn('Ping verification failed:', err)
        }
      }, 3000)
    }
  } catch (err) {
    console.error('Error toggling power:', err)
    // Show error notification
    const errorMessage = handleApiError(err)
    // You can add a toast notification here
    console.error('Power toggle failed:', errorMessage)
  }
}

function handleEditHost(index) {
  const host = hosts.value[index]
  if (!host) return

  hostToEdit.value = { ...host, index }
  hostDialogOpen.value = true
}

function handleDeleteHost(index) {
  const host = hosts.value[index]
  if (!host) return

  hostToDeleteIndex.value = index
  hostToDelete.value = host
  deleteDialogOpen.value = true
}

async function confirmDeleteHost() {
  if (hostToDeleteIndex.value === null) return

  try {
    deleteLoading.value = true

    await hostsService.delete(hostToDeleteIndex.value)

    // Remove from local state
    hosts.value.splice(hostToDeleteIndex.value, 1)

    console.log('Host deleted successfully')
  } catch (err) {
    console.error('Error deleting host:', err)
    const errorMessage = handleApiError(err)
    error.value = errorMessage
  } finally {
    deleteLoading.value = false
    deleteDialogOpen.value = false
    hostToDeleteIndex.value = null
    hostToDelete.value = null
  }
}

async function handleSaveHost(hostData) {
  try {
    if (hostToEdit.value && hostToEdit.value.index !== undefined) {
      // Edit mode
      const index = hostToEdit.value.index
      await hostsService.update(index, hostData)

      // Update local state
      hosts.value[index] = {
        ...hosts.value[index],
        ...hostData
      }

      console.log('Host updated successfully')
    } else {
      // Add mode
      await hostsService.create(hostData)

      // Reload hosts to get the updated list
      await loadHosts()

      console.log('Host added successfully')
    }

    hostToEdit.value = null
  } catch (err) {
    console.error('Error saving host:', err)
    const errorMessage = handleApiError(err)
    error.value = errorMessage
  }
}

// Auto-refresh functionality
let refreshInterval = null

function startAutoRefresh() {
  const interval = 60000

  refreshInterval = setInterval(async () => {
    if (!loading.value && !error.value) {
      try {
        const data = await hostsService.getAll()
        hosts.value = data || []
      } catch (err) {
        console.warn('Auto-refresh failed:', err)
      }
    }
  }, interval)
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Lifecycle
onMounted(async () => {
  await loadHosts()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>
