<template>
  <div class="h-full">
    <div class="flex justify-between items-center">
      <p class="text-2xl font-medium text">{{ $t('pages.account.title') }}</p>
    </div>
    <Separator class="separator-bold" />

    <div class="grid gap-8">
      <!-- User Information Card -->
      <div class="card">
        <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">
          {{ $t('pages.account.userInfo.title') }}
        </h3>

        <div class="flex items-center space-x-4 p-4 bg-stone-50 dark:bg-zinc-800 rounded-lg">
          <AvatarRoot class="size-16">
            <AvatarFallback
              class="size-16 bg-blue-600 text-white text-xl font-medium flex items-center justify-center rounded-full"
            >
              {{ authStore.shortUsername }}
            </AvatarFallback>
          </AvatarRoot>

          <div class="flex-1">
            <h4 class="text-lg font-medium text-warm-gray-900 dark:text-stone-100">
              {{ authStore.username }}
            </h4>
            <p class="text-sm text-warm-gray-600 dark:text-stone-400">
              {{ $t('pages.account.userInfo.administrator') }}
            </p>
            <p class="text-xs text-warm-gray-500 dark:text-stone-500 mt-1">
              {{ $t('pages.account.userInfo.loggedIn') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Change Authentication Settings Card -->
      <div class="card">
        <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">
          {{ $t('pages.account.auth.title') }}
        </h3>

        <form @submit.prevent="updateAuthSettings" class="space-y-4">
          <!-- Username Field -->
          <div class="field">
            <label class="label">
              {{ $t('pages.account.auth.username') }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="localAuthSettings.username"
              type="text"
              :placeholder="$t('pages.account.auth.usernamePlaceholder')"
              class="input"
              :class="{ 'border-red-500': authErrors.username }"
              maxlength="20"
              required
            />
            <div class="flex justify-between text-xs mt-1">
              <span v-if="authErrors.username" class="text-red-600 dark:text-red-400">
                {{ authErrors.username }}
              </span>
              <span class="text-warm-gray-500 dark:text-stone-400 ml-auto">
                {{ localAuthSettings.username.length }}/20
              </span>
            </div>
          </div>

          <!-- Current Password Field (for existing users) -->
          <div v-if="isEditingExistingAuth" class="form-field">
            <label class="label">
              {{ $t('pages.account.auth.currentPassword') }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="currentPassword"
              type="password"
              :placeholder="$t('pages.account.auth.currentPasswordPlaceholder')"
              class="input"
              :class="{ 'border-red-500': authErrors.currentPassword }"
              required
            />
            <p
              v-if="authErrors.currentPassword"
              class="text-xs text-red-600 dark:text-red-400 mt-1"
            >
              {{ authErrors.currentPassword }}
            </p>
          </div>

          <!-- New Password Field -->
          <div class="field">
            <label class="label">
              {{
                isEditingExistingAuth
                  ? $t('pages.account.auth.newPassword')
                  : $t('pages.account.auth.password')
              }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="localAuthSettings.password"
              type="password"
              :placeholder="$t('pages.account.auth.passwordPlaceholder')"
              class="form-input"
              :class="{ 'border-red-500': authErrors.password }"
              maxlength="32"
              required
            />
            <div class="flex justify-between text-xs mt-1">
              <span v-if="authErrors.password" class="text-red-600 dark:text-red-400">
                {{ authErrors.password }}
              </span>
              <span class="text-warm-gray-500 dark:text-stone-400 ml-auto">
                {{ localAuthSettings.password.length }}/32
              </span>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div class="field">
            <label class="label">
              {{ $t('pages.account.auth.confirmPassword') }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              :placeholder="$t('pages.account.auth.confirmPasswordPlaceholder')"
              class="form-input"
              :class="{ 'border-red-500': authErrors.confirmPassword }"
              required
            />
            <p
              v-if="authErrors.confirmPassword"
              class="text-xs text-red-600 dark:text-red-400 mt-1"
            >
              {{ authErrors.confirmPassword }}
            </p>
          </div>

          <!-- Security Warning -->
          <div
            class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div class="flex items-start">
              <i
                class="material-symbols-outlined text-amber-600 dark:text-amber-400 mr-2 mt-0.5 text-sm"
                >security</i
              >
              <div>
                <p class="text-amber-800 dark:text-amber-200 text-sm font-medium">
                  {{ $t('pages.account.auth.securityNote') }}
                </p>
                <p class="text-amber-700 dark:text-amber-300 text-xs mt-1">
                  {{ $t('pages.account.auth.securityDescription') }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              class="pill-button-apply-solid"
              :disabled="settingsStore.operations.savingAuth || !isAuthFormValid"
            >
              <span v-if="settingsStore.operations.savingAuth" class="flex items-center">
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
                {{ $t('pages.account.auth.saving') }}
              </span>
              <span v-else class="flex items-center">
                <i class="material-symbols-outlined text-sm mr-1">save</i>
                {{ $t('pages.account.auth.save') }}
              </span>
            </button>
          </div>
        </form>
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
              {{ $t('pages.account.error') }}
            </h4>
            <p class="text-red-600 dark:text-red-400 text-sm mt-1">{{ settingsStore.error }}</p>
          </div>
          <button @click="settingsStore.clearError()" class="ml-auto pill-button-apply text-xs">
            {{ $t('pages.account.dismiss') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Separator, AvatarRoot, AvatarFallback } from 'reka-ui'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// =============================================================================
// STATE
// =============================================================================

const localAuthSettings = reactive({
  username: '',
  password: '',
})

const currentPassword = ref('')
const confirmPassword = ref('')
const isEditingExistingAuth = ref(true)

const authErrors = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  currentPassword: '',
})

// =============================================================================
// COMPUTED
// =============================================================================

const isAuthFormValid = computed(() => {
  return (
    localAuthSettings.username.trim().length > 0 &&
    localAuthSettings.username.length <= 20 &&
    localAuthSettings.password.length > 0 &&
    localAuthSettings.password.length <= 32 &&
    localAuthSettings.password === confirmPassword.value &&
    (!isEditingExistingAuth.value || currentPassword.value.length > 0) &&
    !authErrors.username &&
    !authErrors.password &&
    !authErrors.confirmPassword &&
    !authErrors.currentPassword
  )
})

// =============================================================================
// METHODS
// =============================================================================

function validateAuthForm() {
  // Reset errors
  authErrors.username = ''
  authErrors.password = ''
  authErrors.confirmPassword = ''
  authErrors.currentPassword = ''

  let isValid = true

  // Validate username
  if (!localAuthSettings.username.trim()) {
    authErrors.username = t('pages.account.auth.validation.usernameRequired')
    isValid = false
  } else if (localAuthSettings.username.length > 20) {
    authErrors.username = t('pages.account.auth.validation.usernameMaxLength')
    isValid = false
  }

  // Validate password
  if (!localAuthSettings.password) {
    authErrors.password = t('pages.account.auth.validation.passwordRequired')
    isValid = false
  } else if (localAuthSettings.password.length > 32) {
    authErrors.password = t('pages.account.auth.validation.passwordMaxLength')
    isValid = false
  }

  // Validate password confirmation
  if (localAuthSettings.password !== confirmPassword.value) {
    authErrors.confirmPassword = t('pages.account.auth.validation.passwordMismatch')
    isValid = false
  }

  // Validate current password (for existing users)
  if (isEditingExistingAuth.value && !currentPassword.value) {
    authErrors.currentPassword = t('pages.account.auth.validation.currentPasswordRequired')
    isValid = false
  }

  return isValid
}

async function updateAuthSettings() {
  if (!validateAuthForm()) {
    return
  }

  try {
    const authConfig = {
      username: localAuthSettings.username.trim(),
      password: localAuthSettings.password,
    }

    // Add current password for existing users
    if (isEditingExistingAuth.value && currentPassword.value) {
      authConfig.currentPassword = currentPassword.value
    }

    await settingsStore.updateAuthSettings(authConfig)

    // Clear sensitive fields
    localAuthSettings.password = ''
    confirmPassword.value = ''
    currentPassword.value = ''

    // Update auth store with new username
    authStore.user.username = localAuthSettings.username

    console.log('Authentication settings updated successfully')

    // Show success and potentially force re-login after a delay
    setTimeout(() => {
      handleLogout()
    }, 2000)
  } catch (error) {
    console.error('Error updating authentication settings:', error)
  }
}

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')

    // Reload to clear any cached data
    setTimeout(() => {
      location.reload()
    }, 100)
  } catch (error) {
    console.error('Error during logout:', error)
    // Force logout even if API call fails
    router.push('/login')
  }
}

function loadAuthData() {
  // Load current username from auth store
  localAuthSettings.username = authStore.username || ''

  // Set editing mode based on whether we have a current user
  isEditingExistingAuth.value = !!authStore.username
}

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(async () => {
  try {
    // Load auth settings
    await settingsStore.fetchAuthSettings()
    loadAuthData()
  } catch (error) {
    console.error('Error loading auth settings:', error)
  }
})
</script>
