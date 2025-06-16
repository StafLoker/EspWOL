<template>
  <div class="h-full">
    <div class="flex justify-between items-center">
      <p class="text-2xl font-medium text">{{ $t('pages.account.title') }}</p>
    </div>
    <Separator class="separator-bold" />

    <div class="max-w-2xl grid gap-8">
      <!-- Authentication Settings Card -->
      <div class="card">
        <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">
          {{ $t('pages.account.authentication.title') }}
        </h3>

        <!-- Authentication Form -->
        <form @submit.prevent="updateAuthentication" class="space-y-4">
          <!-- Username -->
          <div class="form-field">
            <label class="form-label">{{ $t('pages.account.authentication.username') }}</label>
            <input
              type="text"
              v-model="authSettings.username"
              class="form-input"
              :required="true"
              :placeholder="$t('pages.account.authentication.usernamePlaceholder')"
              minlength="3"
            />
            <p class="text-xs text-warm-gray-500 dark:text-stone-400 mt-1">
              {{ $t('pages.account.authentication.usernameHelper') }}
            </p>
          </div>

          <!-- Current Password (only shown when editing existing auth) -->
          <div v-if="isEditingExistingAuth" class="form-field">
            <label class="form-label">{{ $t('pages.account.authentication.currentPassword') }}</label>
            <input
              type="password"
              v-model="currentPassword"
              class="form-input"
              :required="isEditingExistingAuth"
              :placeholder="$t('pages.account.authentication.currentPasswordPlaceholder')"
            />
          </div>

          <!-- New Password -->
          <div class="form-field">
            <label class="form-label">
              {{ isEditingExistingAuth ? $t('pages.account.authentication.newPassword') : $t('pages.account.authentication.password') }}
            </label>
            <input
              type="password"
              v-model="authSettings.password"
              class="form-input"
              :class="{ 'border-red-300 dark:border-red-600': passwordError }"
              :required="true"
              :placeholder="$t('pages.account.authentication.passwordPlaceholder')"
              minlength="8"
              @input="validatePassword"
            />
            <div class="mt-2 space-y-1">
              <div class="flex items-center text-xs" :class="passwordRequirements.length ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                <i class="material-symbols-outlined text-sm mr-1">{{ passwordRequirements.length ? 'check_circle' : 'cancel' }}</i>
                {{ $t('pages.account.authentication.requirements.length') }}
              </div>
              <div class="flex items-center text-xs" :class="passwordRequirements.uppercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                <i class="material-symbols-outlined text-sm mr-1">{{ passwordRequirements.uppercase ? 'check_circle' : 'cancel' }}</i>
                {{ $t('pages.account.authentication.requirements.uppercase') }}
              </div>
              <div class="flex items-center text-xs" :class="passwordRequirements.lowercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                <i class="material-symbols-outlined text-sm mr-1">{{ passwordRequirements.lowercase ? 'check_circle' : 'cancel' }}</i>
                {{ $t('pages.account.authentication.requirements.lowercase') }}
              </div>
              <div class="flex items-center text-xs" :class="passwordRequirements.number ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                <i class="material-symbols-outlined text-sm mr-1">{{ passwordRequirements.number ? 'check_circle' : 'cancel' }}</i>
                {{ $t('pages.account.authentication.requirements.number') }}
              </div>
              <div class="flex items-center text-xs" :class="passwordRequirements.special ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                <i class="material-symbols-outlined text-sm mr-1">{{ passwordRequirements.special ? 'check_circle' : 'cancel' }}</i>
                {{ $t('pages.account.authentication.requirements.special') }}
              </div>
            </div>
            <p v-if="passwordError" class="text-xs text-red-600 dark:text-red-400 mt-1">
              {{ passwordError }}
            </p>
          </div>

          <!-- Confirm Password -->
          <div class="form-field">
            <label class="form-label">{{ $t('pages.account.authentication.confirmPassword') }}</label>
            <input
              type="password"
              v-model="confirmPassword"
              class="form-input"
              :class="{ 'border-red-300 dark:border-red-600': confirmPasswordError }"
              :required="true"
              :placeholder="$t('pages.account.authentication.confirmPasswordPlaceholder')"
              @input="validateConfirmPassword"
            />
            <p v-if="confirmPasswordError" class="text-xs text-red-600 dark:text-red-400 mt-1">
              {{ confirmPasswordError }}
            </p>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end pt-4">
            <button
              type="submit"
              class="pill-button-apply-solid"
              :disabled="authLoading || !isFormValid"
            >
              <span v-if="authLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ $t('pages.account.authentication.saving') }}
              </span>
              <span v-else class="flex items-center">
                <i class="material-symbols-outlined mr-1 text-sm">save</i>
                {{ $t('pages.account.authentication.save') }}
              </span>
            </button>
          </div>
        </form>
      </div>

      <!-- Logout Card -->
      <div class="card">
        <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">
          {{ $t('pages.account.session.title') }}
        </h3>
        <p class="text-warm-gray-600 dark:text-stone-400 mb-6">
          {{ $t('pages.account.session.description') }}
        </p>
        <div class="flex justify-end">
          <button
            type="button"
            class="pill-button-deny-solid"
            @click="handleLogout"
            :disabled="logoutLoading"
          >
            <span v-if="logoutLoading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ $t('pages.account.session.loggingOut') }}
            </span>
            <span v-else class="flex items-center">
              <i class="material-symbols-outlined mr-1 text-sm">logout</i>
              {{ $t('pages.account.session.logout') }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Separator } from 'reka-ui'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Router
const router = useRouter()

// State
const authSettings = ref({
  enable: true, // Always enabled since we removed the toggle
  username: '',
  password: ''
})

const currentPassword = ref('')
const confirmPassword = ref('')
const authLoading = ref(false)
const logoutLoading = ref(false)
const isEditingExistingAuth = ref(false)

// Validation state
const passwordError = ref('')
const confirmPasswordError = ref('')

// Password requirements validation
const passwordRequirements = computed(() => {
  const password = authSettings.value.password
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
})

// Form validation
const isFormValid = computed(() => {
  const passwordValid = Object.values(passwordRequirements.value).every(req => req)
  const confirmPasswordValid = authSettings.value.password === confirmPassword.value
  const usernameValid = authSettings.value.username.length >= 3

  return passwordValid && confirmPasswordValid && usernameValid && !passwordError.value && !confirmPasswordError.value
})

// Methods
async function loadAuthenticationSettings() {
  try {
    const response = await fetch('/authenticationSettings')
    if (!response.ok) throw new Error('Failed to fetch authentication settings')

    const data = await response.json()
    authSettings.value = {
      enable: true, // Always enabled
      username: data.username,
      password: '' // Never pre-fill password
    }

    // Check if we're editing existing authentication
    isEditingExistingAuth.value = data.enable && data.username
  } catch (error) {
    console.error('Error loading authentication settings:', error)
  }
}

function validatePassword() {
  passwordError.value = ''

  const password = authSettings.value.password

  if (password.length < 8) {
    passwordError.value = 'Password must be at least 8 characters long'
    return
  }

  if (!Object.values(passwordRequirements.value).every(req => req)) {
    passwordError.value = 'Password does not meet all requirements'
    return
  }

  // Re-validate confirm password if it exists
  if (confirmPassword.value) {
    validateConfirmPassword()
  }
}

function validateConfirmPassword() {
  confirmPasswordError.value = ''

  if (confirmPassword.value && confirmPassword.value !== authSettings.value.password) {
    confirmPasswordError.value = 'Passwords do not match'
  }
}

async function updateAuthentication() {
  if (!isFormValid.value) return

  authLoading.value = true

  try {
    const requestBody = {
      enable: true, // Always enabled
      username: authSettings.value.username,
      password: authSettings.value.password
    }

    // If editing existing auth and current password is provided, include it
    if (isEditingExistingAuth.value && currentPassword.value) {
      requestBody.currentPassword = currentPassword.value
    }

    const response = await fetch('/authenticationSettings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    if (data.success) {
      console.log('Authentication settings updated successfully')

      // Clear sensitive fields
      authSettings.value.password = ''
      confirmPassword.value = ''
      currentPassword.value = ''

      // Update editing state
      isEditingExistingAuth.value = true

      // Show success notification and potentially reload
      setTimeout(() => {
        location.reload()
      }, 1000)
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error('Error updating authentication settings:', error)
    // Show error notification
  } finally {
    authLoading.value = false
  }
}

async function handleLogout() {
  logoutLoading.value = true

  try {
    // Clear any stored authentication data
    localStorage.clear()
    sessionStorage.clear()

    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500))

    // Redirect to login page
    router.push('/login')

    // Optionally reload the page to clear any cached data
    setTimeout(() => {
      location.reload()
    }, 100)

  } catch (error) {
    console.error('Error during logout:', error)
  } finally {
    logoutLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadAuthenticationSettings()
})
</script>
