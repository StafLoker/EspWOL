<template>
  <div class="h-full">
    <div class="flex justify-between items-center">
      <p class="text-2xl font-medium text">{{ $t('pages.settings.title') }}</p>
    </div>
    <Separator class="separator-bold" />

    <div class="grid gap-8">
      <!-- Import Results Card (Integrado) -->
      <div
        v-if="importResults"
        class="relative bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-stone-200 dark:border-zinc-700 p-6 border-l-4"
        :class="{
          'border-l-green-500':
            (importResults.imported_count || 0) > 0 &&
            (importResults.ignored_count || 0) <= (importResults.imported_count || 0),
          'border-l-yellow-500':
            (importResults.ignored_count || 0) > (importResults.imported_count || 0),
          'border-l-red-500':
            (importResults.imported_count || 0) === 0 && (importResults.ignored_count || 0) > 0,
          'border-l-blue-500':
            (importResults.imported_count || 0) === 0 && (importResults.ignored_count || 0) === 0,
        }"
        style="animation: slideInDown 0.3s ease-out"
      >
        <div class="flex items-start space-x-4">
          <!-- Status Icon -->
          <div
            class="flex-shrink-0 rounded-full p-2 text-white"
            :class="{
              'bg-green-500':
                (importResults.imported_count || 0) > 0 &&
                (importResults.ignored_count || 0) <= (importResults.imported_count || 0),
              'bg-yellow-500':
                (importResults.ignored_count || 0) > (importResults.imported_count || 0),
              'bg-red-500':
                (importResults.imported_count || 0) === 0 && (importResults.ignored_count || 0) > 0,
              'bg-blue-500':
                (importResults.imported_count || 0) === 0 &&
                (importResults.ignored_count || 0) === 0,
            }"
          >
            <i
              class="material-symbols-outlined text-xl"
              :class="{
                'text-green-500':
                  (importResults.imported_count || 0) > 0 &&
                  (importResults.ignored_count || 0) <= (importResults.imported_count || 0),
                'text-yellow-500':
                  (importResults.ignored_count || 0) > (importResults.imported_count || 0),
                'text-red-500':
                  (importResults.imported_count || 0) === 0 &&
                  (importResults.ignored_count || 0) > 0,
                'text-blue-500':
                  (importResults.imported_count || 0) === 0 &&
                  (importResults.ignored_count || 0) === 0,
              }"
            >
              <span
                v-if="
                  (importResults.imported_count || 0) > 0 &&
                  (importResults.ignored_count || 0) <= (importResults.imported_count || 0)
                "
                >check_circle</span
              >
              <span
                v-else-if="(importResults.ignored_count || 0) > (importResults.imported_count || 0)"
                >warning</span
              >
              <span
                v-else-if="
                  (importResults.imported_count || 0) === 0 &&
                  (importResults.ignored_count || 0) > 0
                "
                >cancel</span
              >
              <span v-else>info</span>
            </i>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <!-- Header -->
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-semibold text-warm-gray-800 dark:text-stone-100">
                {{ $t('components.importResults.title') }}
              </h3>
              <button
                @click="importResults = null"
                class="text-warm-gray-400 hover:text-warm-gray-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors"
              >
                <i class="material-symbols-outlined text-sm">close</i>
              </button>
            </div>

            <!-- Status Message -->
            <p
              class="text-sm mb-4"
              :class="{
                'text-green-700 dark:text-green-400':
                  (importResults.imported_count || 0) > 0 &&
                  (importResults.ignored_count || 0) <= (importResults.imported_count || 0),
                'text-yellow-700 dark:text-yellow-400':
                  (importResults.ignored_count || 0) > (importResults.imported_count || 0),
                'text-red-700 dark:text-red-400':
                  (importResults.imported_count || 0) === 0 &&
                  (importResults.ignored_count || 0) > 0,
                'text-blue-700 dark:text-blue-400':
                  (importResults.imported_count || 0) === 0 &&
                  (importResults.ignored_count || 0) === 0,
              }"
            >
              {{ importResults.message }}
            </p>

            <!-- Statistics Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                class="bg-stone-50 dark:bg-zinc-800 rounded-lg p-3 text-center border border-stone-200 dark:border-zinc-700 transition-all hover:scale-105 hover:shadow-sm"
              >
                <div class="text-xl font-bold text-green-600 dark:text-green-400 leading-tight">
                  {{ importResults.imported_count || 0 }}
                </div>
                <div class="text-xs text-warm-gray-600 dark:text-stone-400 mt-1 font-medium">
                  {{ $t('components.importResults.imported') }}
                </div>
              </div>

              <div
                class="bg-stone-50 dark:bg-zinc-800 rounded-lg p-3 text-center border border-stone-200 dark:border-zinc-700 transition-all hover:scale-105 hover:shadow-sm"
              >
                <div class="text-xl font-bold text-yellow-600 dark:text-yellow-400 leading-tight">
                  {{ importResults.ignored_count || 0 }}
                </div>
                <div class="text-xs text-warm-gray-600 dark:text-stone-400 mt-1 font-medium">
                  {{ $t('components.importResults.ignored') }}
                </div>
              </div>

              <div
                class="bg-stone-50 dark:bg-zinc-800 rounded-lg p-3 text-center border border-stone-200 dark:border-zinc-700 transition-all hover:scale-105 hover:shadow-sm"
              >
                <div class="text-xl font-bold text-blue-600 dark:text-blue-400 leading-tight">
                  {{ importResults.input_size || 0 }}
                </div>
                <div class="text-xs text-warm-gray-600 dark:text-stone-400 mt-1 font-medium">
                  {{ $t('components.importResults.total') }}
                </div>
              </div>

              <div
                class="bg-stone-50 dark:bg-zinc-800 rounded-lg p-3 text-center border border-stone-200 dark:border-zinc-700 transition-all hover:scale-105 hover:shadow-sm"
              >
                <div class="text-xl font-bold text-purple-600 dark:text-purple-400 leading-tight">
                  {{ importResults.current_host_count || 0 }}
                </div>
                <div class="text-xs text-warm-gray-600 dark:text-stone-400 mt-1 font-medium">
                  {{ $t('components.importResults.totalInDatabase') }}
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-4">
              <div class="flex justify-between text-xs text-warm-gray-600 dark:text-stone-400 mb-1">
                <span>{{ $t('components.importResults.successRate') }}</span>
                <span
                  >{{
                    Math.round(
                      (importResults.input_size || 0) > 0
                        ? ((importResults.imported_count || 0) / (importResults.input_size || 1)) *
                            100
                        : 0,
                    )
                  }}%</span
                >
              </div>
              <div class="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 ease-out"
                  :class="{
                    'bg-green-500':
                      (importResults.imported_count || 0) > 0 &&
                      (importResults.ignored_count || 0) <= (importResults.imported_count || 0),
                    'bg-yellow-500':
                      (importResults.ignored_count || 0) > (importResults.imported_count || 0),
                    'bg-red-500':
                      (importResults.imported_count || 0) === 0 &&
                      (importResults.ignored_count || 0) > 0,
                    'bg-blue-500':
                      (importResults.imported_count || 0) === 0 &&
                      (importResults.ignored_count || 0) === 0,
                  }"
                  :style="{
                    width: `${(importResults.input_size || 0) > 0 ? ((importResults.imported_count || 0) / (importResults.input_size || 1)) * 100 : 0}%`,
                  }"
                ></div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-2 mt-4">
              <button @click="importResults = null" class="pill-button-cancel">
                {{ $t('components.importResults.close') }}
              </button>

              <button
                v-if="(importResults.imported_count || 0) > 0"
                @click="refreshHostsList"
                class="pill-button-apply-solid"
              >
                <i class="material-symbols-outlined text-sm mr-1">refresh</i>
                {{ $t('components.importResults.refreshList') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Import/Export Section -->
      <div class="card">
        <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">
          {{ $t('pages.settings.import.title') }}
        </h3>

        <div class="space-y-4">
          <!-- Import Section -->
          <div
            class="p-4 bg-stone-50 dark:bg-zinc-800 rounded-lg border border-stone-200 dark:border-zinc-700"
          >
            <h4 class="text-lg font-medium text-warm-gray-800 dark:text-stone-100 mb-3">
              {{ $t('pages.settings.import.importHosts') }}
            </h4>

            <div class="space-y-3">
              <div class="form-field">
                <label class="form-label">
                  {{ $t('pages.settings.import.selectFile') }}
                </label>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".csv,.json"
                  @change="handleFileSelect"
                  class="w-full text-sm text-warm-gray-500 dark:text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:cursor-pointer file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-zinc-700 dark:file:text-blue-400 dark:hover:file:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                />
                <p class="text-xs text-warm-gray-500 dark:text-stone-400 mt-1">
                  {{ $t('pages.settings.import.supportedFormats') }}
                </p>
              </div>

              <div class="flex justify-end">
                <button
                  @click="importHosts"
                  :disabled="!selectedFile || hostsStore.operations.importing"
                  class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <span v-if="hostsStore.operations.importing" class="flex items-center">
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
                    {{ $t('pages.settings.import.importing') }}
                  </span>
                  <span v-else class="flex items-center">
                    <i class="material-symbols-outlined text-sm mr-1">upload</i>
                    {{ $t('pages.settings.import.import') }}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Export Section -->
          <div
            class="p-4 bg-stone-50 dark:bg-zinc-800 rounded-lg border border-stone-200 dark:border-zinc-700"
          >
            <h4 class="text-lg font-medium text-warm-gray-800 dark:text-stone-100 mb-3">
              {{ $t('pages.settings.import.exportHosts') }}
            </h4>

            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-warm-gray-600 dark:text-stone-400">
                  {{ $t('pages.settings.import.exportDescription') }}
                </p>
                <p class="text-xs text-warm-gray-500 dark:text-stone-500 mt-1">
                  {{ hostsStore.hostsCount }} {{ $t('pages.settings.import.hostsAvailable') }}
                </p>
              </div>
              <button
                @click="exportHosts"
                :disabled="hostsStore.hostsCount === 0"
                class="inline-flex items-center justify-center px-4 py-2 border border-stone-300 dark:border-zinc-600 text-sm font-medium rounded-full text-warm-gray-700 dark:text-stone-300 bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <i class="material-symbols-outlined text-sm mr-1">download</i>
                {{ $t('pages.settings.import.export') }}
              </button>
            </div>
          </div>
        </div>
      </div>

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
          <!-- Static IP Toggle -->
          <div class="form-field">
            <div class="flex items-center justify-between">
              <div>
                <label class="form-label mb-0">{{ $t('pages.settings.network.enable') }}</label>
                <p class="text-xs text-warm-gray-500 dark:text-stone-400">
                  {{ $t('pages.settings.network.enableDescription') }}
                </p>
              </div>
              <SwitchRoot v-model:checked="localNetworkConfig.enable" class="switch-root">
                <SwitchThumb class="switch-thumb" />
              </SwitchRoot>
            </div>
          </div>

          <!-- Network Configuration Fields -->
          <div
            v-if="localNetworkConfig.enable"
            class="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-700"
          >
            <!-- IP Address -->
            <div class="form-field">
              <label class="form-label">{{ $t('pages.settings.network.ip') }}</label>
              <input
                v-model="localNetworkConfig.ip"
                type="text"
                placeholder="192.168.1.100"
                class="form-input"
                :class="{ 'border-red-500': networkErrors.ip }"
                @blur="validateNetworkField('ip')"
              />
              <p v-if="networkErrors.ip" class="text-xs text-red-600 dark:text-red-400 mt-1">
                {{ networkErrors.ip }}
              </p>
            </div>

            <!-- Network Mask -->
            <div class="form-field">
              <label class="form-label">{{ $t('pages.settings.network.networkMask') }}</label>
              <input
                v-model="localNetworkConfig.networkMask"
                type="text"
                placeholder="255.255.255.0"
                class="form-input"
                :class="{ 'border-red-500': networkErrors.networkMask }"
                @blur="validateNetworkField('networkMask')"
              />
              <p
                v-if="networkErrors.networkMask"
                class="text-xs text-red-600 dark:text-red-400 mt-1"
              >
                {{ networkErrors.networkMask }}
              </p>
            </div>

            <!-- Gateway -->
            <div class="form-field">
              <label class="form-label">{{ $t('pages.settings.network.gateway') }}</label>
              <input
                v-model="localNetworkConfig.gateway"
                type="text"
                placeholder="192.168.1.1"
                class="form-input"
                :class="{ 'border-red-500': networkErrors.gateway }"
                @blur="validateNetworkField('gateway')"
              />
              <p v-if="networkErrors.gateway" class="text-xs text-red-600 dark:text-red-400 mt-1">
                {{ networkErrors.gateway }}
              </p>
            </div>

            <!-- DNS -->
            <div class="form-field">
              <label class="form-label">{{ $t('pages.settings.network.dns') }}</label>
              <input
                v-model="localNetworkConfig.dns"
                type="text"
                placeholder="8.8.8.8"
                class="form-input"
                :class="{ 'border-red-500': networkErrors.dns }"
                @blur="validateNetworkField('dns')"
              />
              <p v-if="networkErrors.dns" class="text-xs text-red-600 dark:text-red-400 mt-1">
                {{ networkErrors.dns }}
              </p>
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
        </form>
      </div>

      <!-- WiFi Reset Section -->
      <div class="card">
        <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">
          {{ $t('pages.settings.wifi.title') }}
        </h3>

        <div
          class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
        >
          <div class="flex items-start space-x-3">
            <i class="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-xl mt-0.5"
              >warning</i
            >
            <div class="flex-1">
              <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                {{ $t('pages.settings.wifi.warning') }}
              </h4>
              <p class="text-xs text-yellow-700 dark:text-yellow-400 mb-3">
                {{ $t('pages.settings.wifi.warningDescription') }}
              </p>
              <button @click="resetWiFiDialogOpen = true" class="pill-button-danger">
                <i class="material-symbols-outlined text-sm mr-1">wifi_off</i>
                {{ $t('pages.settings.wifi.reset') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- WiFi Reset Confirmation Dialog -->
    <AlertDialogRoot :open="resetWiFiDialogOpen" @update:open="resetWiFiDialogOpen = $event">
      <AlertDialogPortal>
        <AlertDialogOverlay class="alert-dialog-overlay" />
        <AlertDialogContent class="alert-dialog-content">
          <AlertDialogTitle class="alert-dialog-title">
            {{ $t('pages.settings.wifi.confirmTitle') }}
          </AlertDialogTitle>
          <AlertDialogDescription class="alert-dialog-description">
            {{ $t('pages.settings.wifi.confirmDescription') }}
          </AlertDialogDescription>
          <div class="flex justify-end space-x-2 mt-6">
            <AlertDialogCancel as-child>
              <button class="pill-button-cancel">
                {{ $t('common.cancel') }}
              </button>
            </AlertDialogCancel>
            <AlertDialogAction as-child>
              <button
                @click="resetWiFi"
                class="pill-button-danger"
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
              </button>
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
import { useHostsStore } from '@/stores/hostsStore'
import { isValidIPv4 } from '@/api/services'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const hostsStore = useHostsStore()

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

// Import states
const selectedFile = ref(null)
const fileInput = ref(null)
const importResults = ref(null)

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
// METHODS - EXISTING
// =============================================================================

function loadLocalData() {
  // Load ping period
  localPingPeriod.value = settingsStore.settings.pingPeriod

  // Load network config
  Object.assign(localNetworkConfig, settingsStore.settings.networkConfig)
}

function clearNetworkErrors() {
  Object.keys(networkErrors).forEach((key) => {
    networkErrors[key] = ''
  })
}

function validateNetworkField(field) {
  const value = localNetworkConfig[field]

  if (!value) {
    networkErrors[field] = ''
    return true
  }

  if (!isValidIPv4(value)) {
    networkErrors[field] = t('pages.settings.network.validation.invalidIP')
    return false
  }

  networkErrors[field] = ''
  return true
}

function validateNetworkConfig() {
  if (!localNetworkConfig.enable) return true

  clearNetworkErrors()
  let isValid = true

  // Validate all fields if static IP is enabled
  const fields = ['ip', 'networkMask', 'gateway', 'dns']
  fields.forEach((field) => {
    if (!localNetworkConfig[field]) {
      networkErrors[field] = t('pages.settings.network.validation.required')
      isValid = false
    } else if (!validateNetworkField(field)) {
      isValid = false
    }
  })

  return isValid
}

async function updatePingSettings() {
  try {
    await settingsStore.updatePingPeriod(localPingPeriod.value)
    console.log('Ping settings updated successfully')
  } catch (error) {
    console.error('Error updating ping settings:', error)
  }
}

async function updateNetworkSettings() {
  if (!validateNetworkConfig()) {
    return
  }

  try {
    await settingsStore.updateNetworkSettings(localNetworkConfig)
    console.log('Network settings updated successfully')
  } catch (error) {
    console.error('Error updating network settings:', error)
  }
}

async function resetWiFi() {
  try {
    await settingsStore.resetWiFi()
    resetWiFiDialogOpen.value = false
    console.log('WiFi reset initiated')
  } catch (error) {
    console.error('Error resetting WiFi:', error)
  }
}

// =============================================================================
// METHODS - IMPORT/EXPORT
// =============================================================================

function handleFileSelect(event) {
  const file = event.target.files[0]
  selectedFile.value = file
}

async function importHosts() {
  if (!selectedFile.value) return

  try {
    const fileContent = await readFile(selectedFile.value)
    let hosts = []

    if (selectedFile.value.name.endsWith('.csv')) {
      hosts = parseCSV(fileContent)
    } else if (selectedFile.value.name.endsWith('.json')) {
      hosts = JSON.parse(fileContent)
    }

    if (!Array.isArray(hosts) || hosts.length === 0) {
      throw new Error(t('pages.settings.import.errors.emptyFile'))
    }

    const results = await hostsStore.importHosts(hosts)
    importResults.value = results

    // Clear file selection
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (error) {
    console.error('Error importing hosts:', error)
    importResults.value = {
      success: false,
      message: error.message || t('pages.settings.import.errors.importFailed'),
      imported: 0,
      ignored: 0,
      total: 0,
      totalHosts: hostsStore.hostsCount,
    }
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error(t('pages.settings.import.errors.fileReadFailed')))
    reader.readAsText(file)
  })
}

function parseCSV(csvContent) {
  const lines = csvContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)

  if (lines.length < 2) {
    throw new Error(t('pages.settings.import.errors.invalidCsvFormat'))
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(',').map((v) => v.trim())
      const host = {}

      headers.forEach((header, index) => {
        if (values[index]) {
          switch (header) {
            case 'name':
              host.name = values[index]
              break
            case 'mac':
              host.mac = values[index].toUpperCase()
              break
            case 'ip':
              host.ip = values[index]
              break
            case 'autowake':
            case 'auto_wake':
              host.autoWake = values[index].toLowerCase() === 'true' || values[index] === '1'
              break
          }
        }
      })

      return host
    })
    .filter((host) => host.name && host.mac && host.ip)
}

async function exportHosts() {
  try {
    const hosts = hostsStore.hosts

    if (hosts.length === 0) {
      console.warn('No hosts to export')
      return
    }

    const csvContent = [
      'name,mac,ip,autoWake',
      ...hosts.map(
        (host) => `"${host.name}","${host.mac}","${host.ip}",${host.autoWake ? 'true' : 'false'}`,
      ),
    ].join('\n')

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-')
    const filename = `export-hosts-espwol-${timestamp}.csv`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)

    console.log(`Exported ${hosts.length} hosts to ${filename}`)
  } catch (error) {
    console.error('Error exporting hosts:', error)
  }
}

async function refreshHostsList() {
  try {
    await hostsStore.fetchHosts()
    console.log('Hosts list refreshed')
  } catch (error) {
    console.error('Error refreshing hosts list:', error)
  }
}

// =============================================================================
// WATCHERS
// =============================================================================

watch(
  () => settingsStore.settings.pingPeriod,
  (newValue) => {
    localPingPeriod.value = newValue
  },
)

watch(
  () => settingsStore.settings.networkConfig,
  (newValue) => {
    Object.assign(localNetworkConfig, newValue)
  },
  { deep: true },
)

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(async () => {
  try {
    // Load all settings
    await Promise.all([
      settingsStore.fetchAbout(),
      settingsStore.fetchSettings(),
      hostsStore.fetchHosts(),
    ])

    loadLocalData()
  } catch (error) {
    console.error('Error loading settings:', error)
  }
})
</script>

<style scoped>
@keyframes slideInDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
