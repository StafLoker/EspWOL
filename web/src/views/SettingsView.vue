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

        <div v-if="settingsStore.operations.loadingAbout" class="space-y-3">
          <div class="animate-pulse">
            <div class="h-12 bg-stone-200 dark:bg-zinc-700 rounded-lg"></div>
          </div>
          <div class="animate-pulse">
            <div class="h-12 bg-stone-200 dark:bg-zinc-700 rounded-lg"></div>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div
            class="flex items-center justify-between p-3 bg-stone-100 dark:bg-zinc-700 rounded-lg"
          >
            <span class="text-warm-gray-700 dark:text-stone-300">{{
              $t('pages.settings.systemInfo.version')
            }}</span>
            <div class="flex items-center">
              <span class="badge bg-blue-500 text-white px-3 py-1 rounded-pill text-sm font-medium">
                {{ settingsStore.about.version || 'Unknown' }}
              </span>
            </div>
          </div>
          <div
            class="flex items-center justify-between p-3 bg-stone-100 dark:bg-zinc-700 rounded-lg"
          >
            <span class="text-warm-gray-700 dark:text-stone-300">{{
              $t('pages.settings.systemInfo.hostname')
            }}</span>
            <span class="badge bg-slate-500 text-white px-3 py-1 rounded-pill text-sm">
              {{ settingsStore.about.hostname || 'Unknown' }}
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
            <SelectRoot v-model="localPingPeriod">
              <SelectTrigger class="form-input">
                <SelectValue :placeholder="$t('pages.settings.ping.selectInterval')">
                  {{ settingsStore.currentPingPeriodLabel }}
                </SelectValue>
                <i class="material-symbols-outlined text-lg ml-2">expand_more</i>
              </SelectTrigger>
              <SelectPortal>
                <SelectContent class="select-content">
                  <SelectViewport>
                    <SelectItem
                      v-for="period in settingsStore.validPingPeriods"
                      :key="period.value"
                      :value="period.value"
                      class="select-item"
                    >
                      <SelectItemText>{{ period.label }}</SelectItemText>
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
            <p class="text-xs text-warm-gray-500 dark:text-stone-400 mt-1">
              {{ $t('pages.settings.ping.description') }}
            </p>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              class="pill-button-apply-solid"
              :disabled="
                settingsStore.operations.savingPing ||
                localPingPeriod === settingsStore.settings.pingPeriod
              "
            >
              <span v-if="settingsStore.operations.savingPing" class="flex items-center">
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
                {{ $t('pages.settings.saving') }}
              </span>
              <span v-else class="flex items-center">
                <i class="material-symbols-outlined text-sm mr-1">save</i>
                {{ $t('pages.settings.save') }}
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
          <!-- Static IP Enable Switch -->
          <div
            class="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-lg"
          >
            <div class="flex-1">
              <label class="font-medium text-warm-gray-900 dark:text-stone-100">
                {{ $t('pages.settings.network.enableStatic') }}
              </label>
              <p class="text-sm text-warm-gray-600 dark:text-stone-400 mt-1">
                {{ $t('pages.settings.network.enableStaticDescription') }}
              </p>
            </div>
            <SwitchRoot v-model:checked="localNetworkConfig.enable" class="switch-root">
              <SwitchThumb class="switch-thumb" />
            </SwitchRoot>
          </div>

          <!-- Static IP Configuration -->
          <div v-if="localNetworkConfig.enable" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-field">
              <label class="form-label">{{ $t('pages.settings.network.ipAddress') }}</label>
              <input
                v-model="localNetworkConfig.ip"
                type="text"
                :placeholder="$t('pages.settings.network.ipPlaceholder')"
                class="form-input font-mono"
                :class="{ 'border-red-500': networkErrors.ip }"
                required
              />
              <p
                v-if="networkErrors.networkMask"
                class="text-xs text-red-600 dark:text-red-400 mt-1"
              >
                {{ networkErrors.networkMask }}
              </p>
            </div>

            <div class="form-field">
              <label class="form-label">{{ $t('pages.settings.network.gateway') }}</label>
              <input
                v-model="localNetworkConfig.gateway"
                type="text"
                :placeholder="$t('pages.settings.network.gatewayPlaceholder')"
                class="form-input font-mono"
                :class="{ 'border-red-500': networkErrors.gateway }"
                required
              />
              <p v-if="networkErrors.gateway" class="text-xs text-red-600 dark:text-red-400 mt-1">
                {{ networkErrors.gateway }}
              </p>
            </div>

            <div class="form-field">
              <label class="form-label">{{ $t('pages.settings.network.dns') }}</label>
              <input
                v-model="localNetworkConfig.dns"
                type="text"
                :placeholder="$t('pages.settings.network.dnsPlaceholder')"
                class="form-input font-mono"
                :class="{ 'border-red-500': networkErrors.dns }"
                required
              />
              <p v-if="networkErrors.dns" class="text-xs text-red-600 dark:text-red-400 mt-1">
                {{ networkErrors.dns }}
              </p>
            </div>
          </div>

          <!-- Current Network Status -->
          <div
            v-else
            class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <h4 class="font-medium text-blue-800 dark:text-blue-200 mb-2">
              {{ $t('pages.settings.network.currentConfig') }}
            </h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-blue-600 dark:text-blue-400">IP:</span>
                <span class="ml-2 font-mono">{{
                  settingsStore.settings.networkConfig.ip || 'Loading...'
                }}</span>
              </div>
              <div>
                <span class="text-blue-600 dark:text-blue-400">Mask:</span>
                <span class="ml-2 font-mono">{{
                  settingsStore.settings.networkConfig.networkMask || 'Loading...'
                }}</span>
              </div>
              <div>
                <span class="text-blue-600 dark:text-blue-400">Gateway:</span>
                <span class="ml-2 font-mono">{{
                  settingsStore.settings.networkConfig.gateway || 'Loading...'
                }}</span>
              </div>
              <div>
                <span class="text-blue-600 dark:text-blue-400">DNS:</span>
                <span class="ml-2 font-mono">{{
                  settingsStore.settings.networkConfig.dns || 'Loading...'
                }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              class="pill-button-apply-solid"
              :disabled="settingsStore.operations.savingNetwork || !hasNetworkChanges"
            >
              <span v-if="settingsStore.operations.savingNetwork" class="flex items-center">
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
                {{ $t('pages.settings.saving') }}
              </span>
              <span v-else class="flex items-center">
                <i class="material-symbols-outlined text-sm mr-1">save</i>
                {{ $t('pages.settings.save') }}
              </span>
            </button>
          </div>

          <!-- Network Restart Warning -->
          <div
            v-if="hasNetworkChanges"
            class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div class="flex items-center">
              <i class="material-symbols-outlined text-amber-600 dark:text-amber-400 mr-2"
                >warning</i
              >
              <p class="text-amber-800 dark:text-amber-200 text-sm">
                {{ $t('pages.settings.network.restartWarning') }}
              </p>
            </div>
          </div>
        </form>
      </div>

      <!-- WiFi Reset Card -->
      <div class="card">
        <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">
          {{ $t('pages.settings.wifi.title') }}
        </h3>
        <p class="text-warm-gray-600 dark:text-stone-400 mb-4">
          {{ $t('pages.settings.wifi.description') }}
        </p>
        <button
          @click="handleResetWiFi"
          class="pill-button-deny-solid"
          :disabled="settingsStore.operations.resettingWiFi"
        >
          <span v-if="settingsStore.operations.resettingWiFi" class="flex items-center">
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
            {{ $t('pages.settings.wifi.resetting') }}
          </span>
          <span v-else class="flex items-center">
            <i class="material-symbols-outlined text-sm mr-1">wifi_off</i>
            {{ $t('pages.settings.wifi.reset') }}
          </span>
        </button>
      </div>

      <!-- Error Display -->
      <div
        v-if="settingsStore.error"
        class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <div class="flex items-center">
          <i class="material-symbols-outlined text-red-600 dark:text-red-400 mr-3">error</i>
          <div>
            <h4 class="text-red-800 dark:text-red-200 font-medium">
              {{ $t('pages.settings.error') }}
            </h4>
            <p class="text-red-600 dark:text-red-400 text-sm mt-1">{{ settingsStore.error }}</p>
          </div>
          <button @click="settingsStore.clearError()" class="ml-auto pill-button-apply text-xs">
            {{ $t('pages.settings.dismiss') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reset WiFi Confirmation Dialog -->
    <AlertDialogRoot v-model:open="resetWiFiDialogOpen">
      <AlertDialogPortal>
        <AlertDialogOverlay class="dialog-overlay" />
        <AlertDialogContent class="dialog-content max-w-[450px]">
          <AlertDialogTitle class="dialog-title">
            {{ $t('pages.settings.wifi.confirmTitle') }}
          </AlertDialogTitle>
          <AlertDialogDescription class="dialog-description">
            {{ $t('pages.settings.wifi.confirmDescription') }}
          </AlertDialogDescription>
          <div class="dialog-actions">
            <AlertDialogCancel class="pill-button-cancel">
              {{ $t('pages.settings.wifi.cancel') }}
            </AlertDialogCancel>
            <AlertDialogAction
              class="pill-button-deny-solid"
              @click="confirmResetWiFi"
              :disabled="settingsStore.operations.resettingWiFi"
            >
              <span v-if="settingsStore.operations.resettingWiFi" class="flex items-center">
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
                {{ $t('pages.settings.wifi.resetting') }}
              </span>
              <span v-else>
                {{ $t('pages.settings.wifi.confirmReset') }}
              </span>
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
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SwitchRoot,
  SwitchThumb,
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from 'reka-ui'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settingsStore'

const { t } = useI18n()
const settingsStore = useSettingsStore()

// =============================================================================
// STATE
// =============================================================================

const localPingPeriod = ref(60000)
const localNetworkConfig = reactive({
  enable: false,
  ip: '',
  networkMask: '',
  gateway: '',
  dns: '',
})

const networkErrors = reactive({
  ip: '',
  networkMask: '',
  gateway: '',
  dns: '',
})

const resetWiFiDialogOpen = ref(false)

// =============================================================================
// COMPUTED
// =============================================================================

const hasNetworkChanges = computed(() => {
  const original = settingsStore.settings.networkConfig
  return (
    localNetworkConfig.enable !== original.enable ||
    localNetworkConfig.ip !== original.ip ||
    localNetworkConfig.networkMask !== original.networkMask ||
    localNetworkConfig.gateway !== original.gateway ||
    localNetworkConfig.dns !== original.dns
  )
})

// =============================================================================
// METHODS
// =============================================================================

function loadLocalData() {
  // Load ping period
  localPingPeriod.value = settingsStore.settings.pingPeriod

  // Load network config
  const networkConfig = settingsStore.settings.networkConfig
  localNetworkConfig.enable = networkConfig.enable
  localNetworkConfig.ip = networkConfig.ip
  localNetworkConfig.networkMask = networkConfig.networkMask
  localNetworkConfig.gateway = networkConfig.gateway
  localNetworkConfig.dns = networkConfig.dns
}

function validateNetworkConfig() {
  const errors = settingsStore.validateNetworkConfig(localNetworkConfig)

  // Reset errors
  networkErrors.ip = ''
  networkErrors.networkMask = ''
  networkErrors.gateway = ''
  networkErrors.dns = ''

  // Map errors to fields
  errors.forEach((error) => {
    if (error.includes('IP address')) networkErrors.ip = error
    if (error.includes('network mask')) networkErrors.networkMask = error
    if (error.includes('gateway')) networkErrors.gateway = error
    if (error.includes('DNS')) networkErrors.dns = error
  })

  return errors.length === 0
}

async function updatePingSettings() {
  try {
    await settingsStore.updatePingPeriod(localPingPeriod.value)
  } catch (error) {
    console.error('Error updating ping settings:', error)
  }
}

async function updateNetworkSettings() {
  if (!validateNetworkConfig()) {
    return
  }

  try {
    await settingsStore.updateNetworkSettings({ ...localNetworkConfig })

    // Show success message and restart warning
    console.log('Network settings updated successfully')
  } catch (error) {
    console.error('Error updating network settings:', error)
  }
}

function handleResetWiFi() {
  resetWiFiDialogOpen.value = true
}

async function confirmResetWiFi() {
  try {
    await settingsStore.resetWiFi()
    resetWiFiDialogOpen.value = false

    // Show success message
    console.log('WiFi reset successful')
  } catch (error) {
    console.error('Error resetting WiFi:', error)
  }
}

// =============================================================================
// WATCHERS
// =============================================================================

watch(() => settingsStore.settings, loadLocalData, { deep: true })

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(async () => {
  try {
    // Load all settings data
    await Promise.all([
      settingsStore.fetchAbout(),
      settingsStore.fetchAllSettings(),
      settingsStore.fetchNetworkSettings(),
      settingsStore.fetchPingPeriod(),
    ])

    loadLocalData()
  } catch (error) {
    console.error('Error loading settings:', error)
  }
})
</script>
