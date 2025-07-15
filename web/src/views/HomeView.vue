<template>
  <div class="h-full">
    <!-- Buttons -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <p class="text-2xl font-medium text">
          {{ $t('pages.home.hosts') }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <!-- Search -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i class="material-symbols-outlined text-warm-gray-400 dark:text-stone-500 text-lg"
              >search</i
            >
          </div>
          <input
            v-model="searchTerm"
            type="text"
            :placeholder="$t('pages.home.searchPlaceholder')"
            class="pl-10 pr-4 py-2 border border-stone-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-warm-gray-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
          />
          <button
            v-if="searchTerm"
            @click="searchTerm = ''"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <i class="material-symbols-outlined text-warm-gray-400 hover:text-warm-gray-600 text-lg"
              >close</i
            >
          </button>
        </div>

        <!-- Add host -->
        <button
          class="button-apply flex items-center justify-center whitespace-nowrap"
          @click="handleAddHost"
          :disabled="!hostsStore.hostLimits.canAddMore"
          :class="{ 'opacity-50 cursor-not-allowed': !hostsStore.hostLimits.canAddMore }"
        >
          <i class="material-symbols-outlined mr-1">add</i>
          {{ $t('pages.home.addHost') }}
        </button>
      </div>
    </div>

    <Separator class="separator-bold" />

    <!-- Loading State -->
    <div
      v-if="hostsStore.isLoading"
      class="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
    >
      <HostCardPlaceholder v-for="n in 6" :key="n" />
    </div>

    <!-- Hosts Grid -->
    <div v-else-if="filteredHosts.length > 0">
      <div class="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        <HostCard
          v-for="host in filteredHosts"
          :key="host.id"
          :name="host.name"
          :ip="host.ip"
          :mac="host.mac"
          :is-wake="host.status || false"
          @toggle-power="handleTogglePower(host)"
          @edit="handleEditHost(host)"
          @delete="handleDeleteHost(host)"
        />
      </div>
      <div class="flex justify-center">
        <div
          class="pill text-center mt-6 bg-stone-50 border-stone-200 text-warm-gray-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-stone-200 border shadow-sm"
        >
          {{ hostsStore.hostLimits.current }} / {{ hostsStore.hostLimits.max }}
        </div>
      </div>
    </div>

    <!-- No results state (when searching) -->
    <div v-else-if="searchTerm && filteredHosts.length === 0" class="mt-16 text-center">
      <div
        class="mx-auto w-24 h-24 bg-stone-200 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-6"
      >
        <i class="material-symbols-outlined text-4xl text-stone-400 dark:text-zinc-500"
          >search_off</i
        >
      </div>
      <h3 class="text-lg font-semibold text-warm-gray-800 dark:text-stone-100 mb-2">
        {{ $t('pages.home.noResults') }}
      </h3>
      <p class="text-warm-gray-600 dark:text-stone-400 mb-6 max-w-md mx-auto">
        {{ $t('pages.home.noResultsDescription', { searchTerm }) }}
      </p>
      <button @click="searchTerm = ''" class="pill-button-apply">
        {{ $t('pages.home.clearSearch') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-else class="mt-16 text-center">
      <div
        class="mx-auto w-24 h-24 bg-stone-200 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-6"
      >
        <i class="material-symbols-outlined text-4xl text-stone-400 dark:text-zinc-500">devices</i>
      </div>
      <h3 class="text-lg font-semibold text-warm-gray-800 dark:text-stone-100 mb-2">
        {{ $t('pages.home.noHosts') }}
      </h3>
      <p class="text-warm-gray-600 dark:text-stone-400 mb-6 max-w-md mx-auto">
        {{ $t('pages.home.noHostsDescription') }}
      </p>
      <button
        class="button-apply flex items-center mx-auto"
        @click="handleAddHost"
        :disabled="!hostsStore.hostLimits.canAddMore"
        :class="{ 'opacity-50 cursor-not-allowed': !hostsStore.hostLimits.canAddMore }"
      >
        <i class="material-symbols-outlined mr-2">add</i>
        {{ $t('pages.home.addFirstHost') }}
      </button>

      <div
        v-if="!hostsStore.hostLimits.canAddMore"
        class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg max-w-md mx-auto"
      >
        <p class="text-amber-800 dark:text-amber-200 text-sm">
          <i class="material-symbols-outlined text-sm mr-1">warning</i>
          {{ $t('pages.home.hostLimitReached', { max: hostsStore.hostLimits.max }) }}
        </p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="hostsStore.error"
      class="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <div class="flex items-center">
        <i class="material-symbols-outlined text-red-600 dark:text-red-400 mr-3">error</i>
        <div class="flex-1">
          <h4 class="text-red-800 dark:text-red-200 font-medium">
            {{ $t('pages.home.errorLoading') }}
          </h4>
          <p class="text-red-600 dark:text-red-400 text-sm mt-1">{{ hostsStore.error }}</p>
        </div>
        <button @click="hostsStore.fetchHosts()" class="ml-auto pill-button-apply text-xs">
          <i class="material-symbols-outlined text-sm mr-1">refresh</i>
          {{ $t('pages.home.retry') }}
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialogRoot :open="deleteDialogOpen" @update:open="deleteDialogOpen = $event">
      <AlertDialogPortal>
        <AlertDialogOverlay class="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100]" />
        <AlertDialogContent
          class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-zinc-700 max-w-[450px] w-[90vw] z-[101]"
        >
          <AlertDialogTitle
            class="text-lg font-semibold text-warm-gray-800 dark:text-stone-100 mb-2"
          >
            {{ $t('pages.home.deleteHost.title') }}
          </AlertDialogTitle>
          <AlertDialogDescription class="text-sm text-warm-gray-600 dark:text-stone-400 mb-6">
            {{
              $t('pages.home.deleteHost.description', {
                hostName: hostToDelete?.name,
                hostIp: hostToDelete?.ip,
              })
            }}
          </AlertDialogDescription>
          <div class="flex justify-end space-x-3">
            <AlertDialogCancel as-child>
              <button type="button" class="pill-button-cancel" @click="deleteDialogOpen = false">
                {{ $t('pages.home.deleteHost.cancel') }}
              </button>
            </AlertDialogCancel>
            <AlertDialogAction as-child>
              <button
                type="button"
                @click="confirmDeleteHost"
                class="pill-button-deny-solid"
                :disabled="hostsStore.operations.deleting"
              >
                <span v-if="hostsStore.operations.deleting" class="flex items-center">
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
                  {{ $t('pages.home.deleteHost.deleting') }}
                </span>
                <span v-else>
                  {{ $t('pages.home.deleteHost.confirm') }}
                </span>
              </button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>

    <!-- Host Dialog -->
    <HostDialog
      :open="hostDialogOpen"
      @update:open="hostDialogOpen = $event"
      :host="hostToEdit"
      :can-add-more="hostsStore.hostLimits.canAddMore"
      @save="handleSaveHost"
    />
  </div>
</template>

<script setup>
import HostCard from '@/components/HostCard.vue'
import HostDialog from '@/components/HostDialog.vue'
import HostCardPlaceholder from '@/components/HostCardPlaceholder.vue'
import {
  Separator,
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from 'reka-ui'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useHostsStore } from '@/stores/hostsStore'

// =============================================================================
// STORE
// =============================================================================

const hostsStore = useHostsStore()

// =============================================================================
// STATE
// =============================================================================

const searchTerm = ref('')
const hostDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const hostToDelete = ref(null)
const hostToEdit = ref(null)

// Auto-refresh interval
let refreshInterval = null

// =============================================================================
// COMPUTED
// =============================================================================

const filteredHosts = computed(() => {
  return hostsStore.searchHosts(searchTerm.value)
})

// =============================================================================
// METHODS
// =============================================================================

function handleAddHost() {
  if (!hostsStore.hostLimits.canAddMore) {
    return
  }

  hostToEdit.value = null
  hostDialogOpen.value = true
}

function handleEditHost(host) {
  if (!host || !host.id) {
    return
  }

  hostToEdit.value = { ...host }
  hostDialogOpen.value = true
}

function handleDeleteHost(host) {
  if (!host || !host.id) {
    return
  }

  hostToDelete.value = host
  deleteDialogOpen.value = true
}

async function confirmDeleteHost() {
  if (!hostToDelete.value || !hostToDelete.value.id) {
    return
  }

  try {
    await hostsStore.deleteHost(hostToDelete.value.id)
  } catch (error) {
    // Error is handled by the store and shown in the UI
  } finally {
    deleteDialogOpen.value = false
    hostToDelete.value = null
  }
}

async function handleSaveHost(hostData) {
  if (!hostData) {
    return
  }

  try {
    if (hostToEdit.value && hostToEdit.value.id) {
      // Edit mode
      await hostsStore.updateHost(hostToEdit.value.id, hostData)
    } else {
      // Add mode
      await hostsStore.addHost(hostData)
    }

    hostDialogOpen.value = false
    hostToEdit.value = null
  } catch (error) {
    // Error is handled by the store/dialog and shown in the UI
    // Don't close the dialog on error so user can retry
  }
}

async function handleTogglePower(host) {
  if (!host || !host.id) {
    return
  }

  try {
    if (host.status) {
      // TODO: Implementar shutdown si la API lo soporta
    } else {
      await hostsStore.wakeHost(host.id)
    }
  } catch (error) {
    // Error is handled by the store and shown in the UI
  }
}

// =============================================================================
// AUTO-REFRESH
// =============================================================================

function startAutoRefresh() {
  const interval = 60000 // 60 segundos

  refreshInterval = setInterval(async () => {
    if (!hostsStore.isLoading && !hostsStore.error) {
      try {
        await hostsStore.refreshHosts()
      } catch (err) {
        // Silent fail for auto-refresh
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

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(async () => {
  try {
    await hostsStore.fetchHosts()
    startAutoRefresh()
  } catch (error) {
    // Error is handled by the store and shown in the UI
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>
