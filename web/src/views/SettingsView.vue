<template>
  <div class="h-full">
    <div class="flex justify-between items-center">
      <p class="text-2xl font-medium text">{{ $t('pages.settings.title') }}</p>
    </div>
    <Separator class="separator-bold" />

    <div class="grid gap-8">
      <!-- System Information Card -->
      <div class="card">
        <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">
          {{ $t('pages.settings.systemInfo.title') }}
        </h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-stone-100 dark:bg-zinc-700 rounded-lg">
            <span class="text-warm-gray-700 dark:text-stone-300">{{ $t('pages.settings.systemInfo.version') }}</span>
            <div class="flex items-center">
              <span
                class="badge rounded-pill px-3 py-1 text-sm font-medium"
                :class="aboutInfo?.lastVersion ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'"
              >
                {{ aboutInfo?.version || 'Loading...' }}
              </span>
              <button
                v-if="aboutInfo && !aboutInfo.lastVersion"
                class="ml-2 pill-button-apply text-xs"
                @click="checkForUpdates"
              >
                <i class="material-symbols-outlined text-sm mr-1">system_update</i>
                {{ $t('pages.settings.systemInfo.update') }}
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-stone-100 dark:bg-zinc-700 rounded-lg">
            <span class="text-warm-gray-700 dark:text-stone-300">{{ $t('pages.settings.systemInfo.hostname') }}</span>
            <span class="badge bg-slate-500 text-white px-3 py-1 rounded-pill text-sm">
              {{ aboutInfo?.hostname || 'Loading...' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Ping Settings Card -->
      <div class="card">
        <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">
          {{ $t('pages.settings.ping.title') }}
        </h3>
        <form @submit.prevent="updatePingSettings" class="space-y-4">
          <div class="form-field">
            <label class="form-label">{{ $t('pages.settings.ping.globalInterval') }}</label>
            <SelectRoot v-model="pingSettings.globalInterval">
              <SelectTrigger class="form-input">
                <SelectValue :placeholder="$t('pages.settings.ping.selectInterval')" />
                <i class="material-symbols-outlined text-lg ml-2">expand_more</i>
              </SelectTrigger>
              <SelectPortal>
                <SelectContent class="select-content">
                  <SelectViewport class="select-viewport">
                    <SelectItem
                      v-for="option in pingIntervalOptions"
                      :key="option.value"
                      :value="option.value"
                      class="select-item"
                    >
                      <SelectItemText>{{ option.label }}</SelectItemText>
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
            <p class="text-xs text-warm-gray-500 dark:text-stone-400 mt-1">
              {{ $t('pages.settings.ping.description') }}
            </p>
          </div>

          <div class="flex justify-end pt-4">
            <button
              type="submit"
              class="pill-button-apply-solid"
              :disabled="pingLoading"
            >
              <span v-if="pingLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ $t('pages.settings.saving') }}
              </span>
              <span v-else class="flex items-center">
                <i class="material-symbols-outlined mr-1 text-sm">save</i>
                {{ $t('pages.settings.ping.save') }}
              </span>
            </button>
          </div>
        </form>
      </div>

      <!-- Network Settings Card -->
      <div class="card">
        <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">
          {{ $t('pages.settings.network.title') }}
        </h3>
        <form @submit.prevent="updateNetworkSettings" class="space-y-4">
          <!-- Network Mode Selection -->
          <div class="space-y-3">
            <label class="form-label">{{ $t('pages.settings.network.mode') }}</label>
            <div class="flex gap-4">
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="networkSettings.enable"
                  :value="true"
                  class="mr-2"
                  @change="toggleNetworkFields"
                >
                <span class="text-warm-gray-700 dark:text-stone-300">{{ $t('pages.settings.network.staticIP') }}</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="networkSettings.enable"
                  :value="false"
                  class="mr-2"
                  @change="toggleNetworkFields"
                >
                <span class="text-warm-gray-700 dark:text-stone-300">{{ $t('pages.settings.network.dhcp') }}</span>
              </label>
            </div>
          </div>

          <!-- Network Fields -->
          <div class="grid md:grid-cols-2 gap-4">
            <div class="form-field">
              <label class="form-label">{{ $t('pages.settings.network.ipAddress') }}</label>
              <input
                type="text"
                v-model="networkSettings.ip"
                class="form-input"
                :disabled="!networkSettings.enable"
                :required="networkSettings.enable"
                pattern="^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}$"
                placeholder="192.168.1.100"
              />
            </div>
            <div class="form-field">
              <label class="form-label">{{ $t('pages.settings.network.networkMask') }}</label>
              <input
                type="text"
                v-model="networkSettings.networkMask"
                class="form-input"
                :disabled="!networkSettings.enable"
                :required="networkSettings.enable"
                pattern="^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}$"
                placeholder="255.255.255.0"
              />
            </div>
            <div class="form-field">
              <label class="form-label">{{ $t('pages.settings.network.gateway') }}</label>
              <input
                type="text"
                v-model="networkSettings.gateway"
                class="form-input"
                :disabled="!networkSettings.enable"
                :required="networkSettings.enable"
                pattern="^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}$"
                placeholder="192.168.1.1"
              />
            </div>
            <div class="form-field">
              <label class="form-label">{{ $t('pages.settings.network.dns') }}</label>
              <input
                type="text"
                v-model="networkSettings.dns"
                class="form-input"
                :disabled="!networkSettings.enable"
                :required="networkSettings.enable"
                pattern="^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}$"
                placeholder="8.8.8.8"
              />
            </div>
          </div>

          <div class="flex justify-between pt-4">
            <button
              type="button"
              class="pill-button-deny"
              @click="resetWiFiSettings"
            >
              <i class="material-symbols-outlined mr-1 text-sm">wifi_off</i>
              {{ $t('pages.settings.network.resetWiFi') }}
            </button>
            <button
              type="submit"
              class="pill-button-apply-solid"
              :disabled="networkLoading"
            >
              <span v-if="networkLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ $t('pages.settings.saving') }}
              </span>
              <span v-else class="flex items-center">
                <i class="material-symbols-outlined mr-1 text-sm">save</i>
                {{ $t('pages.settings.network.save') }}
              </span>
            </button>
          </div>
        </form>
      </div>

      <!-- Data Management Card -->
      <div class="card">
        <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">
          {{ $t('pages.settings.data.title') }}
        </h3>
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Export Section -->
          <div class="space-y-3">
            <h4 class="text-lg font-medium text-warm-gray-700 dark:text-stone-200">
              {{ $t('pages.settings.data.export.title') }}
            </h4>
            <p class="text-sm text-warm-gray-600 dark:text-stone-400">
              {{ $t('pages.settings.data.export.description') }}
            </p>
            <button
              type="button"
              class="button-apply"
              @click="exportDatabase"
              :disabled="exportLoading"
            >
              <span v-if="exportLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ $t('pages.settings.data.export.exporting') }}
              </span>
              <span v-else class="flex items-center">
                <i class="material-symbols-outlined mr-2">file_download</i>
                {{ $t('pages.settings.data.export.button') }}
              </span>
            </button>
          </div>

          <!-- Import Section -->
          <div class="space-y-3">
            <h4 class="text-lg font-medium text-warm-gray-700 dark:text-stone-200">
              {{ $t('pages.settings.data.import.title') }}
            </h4>
            <p class="text-sm text-warm-gray-600 dark:text-stone-400">
              {{ $t('pages.settings.data.import.description') }}
            </p>
            <div class="space-y-2">
              <input
                ref="fileInput"
                type="file"
                accept=".csv"
                class="form-input"
                @change="handleFileSelect"
              />
              <button
                type="button"
                class="button-apply"
                @click="importDatabase"
                :disabled="!selectedFile || importLoading"
              >
                <span v-if="importLoading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ $t('pages.settings.data.import.importing') }}
                </span>
                <span v-else class="flex items-center">
                  <i class="material-symbols-outlined mr-2">file_upload</i>
                  {{ $t('pages.settings.data.import.button') }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Dialog -->
    <DialogRoot v-model:open="updateDialogOpen">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" />
        <DialogContent class="dialog-content">
          <DialogTitle class="dialog-title">
            {{ $t('pages.settings.updateDialog.title') }}
          </DialogTitle>
          <DialogDescription class="dialog-description">
            <div v-if="updateInfo">
              <p v-if="updateInfo.version === updateInfo.lastVersion">
                {{ $t('pages.settings.updateDialog.upToDate') }}
              </p>
              <div v-else>
                <p>{{ $t('pages.settings.updateDialog.newVersionAvailable') }}</p>
                <div class="my-4 p-3 bg-stone-100 dark:bg-zinc-700 rounded-lg">
                  <p><strong>{{ $t('pages.settings.updateDialog.currentVersion') }}:</strong> {{ updateInfo.version }}</p>
                  <p><strong>{{ $t('pages.settings.updateDialog.latestVersion') }}:</strong> {{ updateInfo.lastVersion }}</p>
                  <div v-if="updateInfo.notesLastVersion" class="mt-3">
                    <p><strong>{{ $t('pages.settings.updateDialog.releaseNotes') }}:</strong></p>
                    <p class="text-sm">{{ updateInfo.notesLastVersion }}</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogDescription>
          <div class="dialog-actions">
            <DialogClose class="pill-button-cancel">
              {{ $t('pages.settings.updateDialog.close') }}
            </DialogClose>
            <button
              v-if="updateInfo && updateInfo.version !== updateInfo.lastVersion"
              type="button"
              class="pill-button-apply-solid"
              @click="performUpdate"
              :disabled="updateLoading"
            >
              <span v-if="updateLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ $t('pages.settings.updateDialog.updating') }}
              </span>
              <span v-else">
                {{ $t('pages.settings.updateDialog.update') }}
              </span>
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- WiFi Reset Confirmation Dialog -->
    <AlertDialogRoot v-model:open="wifiResetDialogOpen">
      <AlertDialogPortal>
        <AlertDialogOverlay class="dialog-overlay" />
        <AlertDialogContent class="dialog-content max-w-[450px]">
          <AlertDialogTitle class="dialog-title">
            {{ $t('pages.settings.wifiResetDialog.title') }}
          </AlertDialogTitle>
          <AlertDialogDescription class="dialog-description">
            {{ $t('pages.settings.wifiResetDialog.description') }}
          </AlertDialogDescription>
          <div class="dialog-actions">
            <AlertDialogCancel class="pill-button-cancel">
              {{ $t('pages.settings.wifiResetDialog.cancel') }}
            </AlertDialogCancel>
            <AlertDialogAction
              class="pill-button-deny-solid"
              @click="confirmWiFiReset"
            >
              {{ $t('pages.settings.wifiResetDialog.confirm') }}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>
  </div>
</template>

<script setup>
import {
  Separator,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText
} from 'reka-ui'
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// State
const aboutInfo = ref(null)
const networkSettings = ref({
  enable: false,
  ip: '',
  networkMask: '',
  gateway: '',
  dns: ''
})

const pingSettings = ref({
  globalInterval: 60
})

const updateDialogOpen = ref(false)
const wifiResetDialogOpen = ref(false)
const updateInfo = ref(null)
const selectedFile = ref(null)
const fileInput = ref(null)

// Loading states
const networkLoading = ref(false)
const pingLoading = ref(false)
const exportLoading = ref(false)
const importLoading = ref(false)
const updateLoading = ref(false)

// Ping interval options
const pingIntervalOptions = computed(() => [
  { value: 0, label: t('pages.settings.ping.options.disabled') },
  { value: 30, label: t('pages.settings.ping.options.thirtySeconds') },
  { value: 60, label: t('pages.settings.ping.options.oneMinute') },
  { value: 300, label: t('pages.settings.ping.options.fiveMinutes') },
  { value: 600, label: t('pages.settings.ping.options.tenMinutes') },
  { value: 900, label: t('pages.settings.ping.options.fifteenMinutes') },
  { value: 1800, label: t('pages.settings.ping.options.thirtyMinutes') },
  { value: 3600, label: t('pages.settings.ping.options.oneHour') }
])

// Methods
async function loadAboutInfo() {
  try {
    const response = await fetch('/about')
    if (!response.ok) throw new Error('Failed to fetch about info')
    aboutInfo.value = await response.json()
  } catch (error) {
    console.error('Error loading about info:', error)
  }
}

async function loadNetworkSettings() {
  try {
    const response = await fetch('/networkSettings')
    if (!response.ok) throw new Error('Failed to fetch network settings')
    networkSettings.value = await response.json()
  } catch (error) {
    console.error('Error loading network settings:', error)
  }
}

async function loadPingSettings() {
  try {
    // This would be a new endpoint to get global ping settings
    // For now, we'll use a default value
    pingSettings.value = {
      globalInterval: 60
    }
  } catch (error) {
    console.error('Error loading ping settings:', error)
  }
}

async function updatePingSettings() {
  pingLoading.value = true
  try {
    // This would be a new endpoint to update global ping settings
    console.log('Updating ping settings:', pingSettings.value)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Ping settings updated successfully')
  } catch (error) {
    console.error('Error updating ping settings:', error)
  } finally {
    pingLoading.value = false
  }
}

function toggleNetworkFields() {
  // This function can be used to add any additional logic when switching between static/DHCP
}

async function updateNetworkSettings() {
  networkLoading.value = true
  try {
    const response = await fetch('/networkSettings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(networkSettings.value)
    })

    const data = await response.json()

    if (data.success) {
      // Show success notification
      console.log('Network settings updated successfully')

      // If static IP is enabled, redirect to new IP after a delay
      if (networkSettings.value.enable) {
        setTimeout(() => {
          window.location.replace(`http://${networkSettings.value.ip}`)
        }, 1000)
      } else {
        // Reload page for DHCP
        setTimeout(() => {
          location.reload()
        }, 1000)
      }
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error('Error updating network settings:', error)
    // Show error notification
  } finally {
    networkLoading.value = false
  }
}

function resetWiFiSettings() {
  wifiResetDialogOpen.value = true
}

async function confirmWiFiReset() {
  try {
    const response = await fetch('/resetWifi', { method: 'POST' })
    const data = await response.json()

    if (data.success) {
      console.log('WiFi settings reset successfully')
      setTimeout(() => {
        location.reload()
      }, 1000)
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error('Error resetting WiFi settings:', error)
  }
  wifiResetDialogOpen.value = false
}

async function exportDatabase() {
  exportLoading.value = true
  try {
    const response = await fetch('/hosts', { method: 'GET' })
    if (!response.ok) throw new Error('Failed to fetch hosts')

    const data = await response.json()
    if (!Array.isArray(data)) throw new Error('Expected an array')

    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'Name,MAC Address,IP Address,Periodic Ping\n'

    data.forEach((host) => {
      csvContent += `${host.name},${host.mac},${host.ip},${host.periodicPing}\n`
    })

    // Generate filename with timestamp
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-')
    const filename = `espwol-export-${timestamp}.csv`

    // Download file
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log('Database exported successfully')
  } catch (error) {
    console.error('Error exporting database:', error)
  } finally {
    exportLoading.value = false
  }
}

function handleFileSelect(event) {
  selectedFile.value = event.target.files[0]
}

async function importDatabase() {
  if (!selectedFile.value) return

  importLoading.value = true
  try {
    const reader = new FileReader()

    reader.onload = async function(e) {
      const csvData = e.target.result
      const lines = csvData.split('\n').map(line => line.trim()).filter(line => line)

      const hosts = lines.slice(1).map(line => {
        const values = line.split(',').map(value => value.trim())
        return {
          name: values[0] || '',
          mac: values[1] || '',
          ip: values[2] || '',
          periodicPing: parseInt(values[3], 10) || 0
        }
      }).filter(host => host.name && host.mac && host.ip)

      const response = await fetch('/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hosts)
      })

      const data = await response.json()

      if (data.success) {
        console.log('Database imported successfully')
        // Clear file input
        if (fileInput.value) {
          fileInput.value.value = ''
        }
        selectedFile.value = null
      } else {
        throw new Error(data.message)
      }

      importLoading.value = false
    }

    reader.readAsText(selectedFile.value)
  } catch (error) {
    console.error('Error importing database:', error)
    importLoading.value = false
  }
}

async function checkForUpdates() {
  try {
    const response = await fetch('/updateVersion')
    updateInfo.value = await response.json()
    updateDialogOpen.value = true
  } catch (error) {
    console.error('Error checking for updates:', error)
  }
}

async function performUpdate() {
  updateLoading.value = true
  try {
    const response = await fetch('/updateVersion', { method: 'POST' })
    const data = await response.json()

    if (data.success) {
      console.log('Update initiated successfully')
      updateDialogOpen.value = false
      // Show progress or reload page after update
      setTimeout(() => {
        location.reload()
      }, 30000) // Wait 30 seconds for update to complete
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error('Error performing update:', error)
  } finally {
    updateLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadAboutInfo()
  loadNetworkSettings()
  loadPingSettings()
})
</script>
