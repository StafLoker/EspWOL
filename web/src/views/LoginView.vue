<template>
  <div class="min-h-screen flex items-center justify-center">
    <!-- Login Card -->
    <div class="w-full max-w-md mx-4 relative z-10">
      <div class="card">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center mb-4">
            <EspWol class="size-17" />
          </div>
          <h1 class="text-2xl font-bold text-warm-gray-900 dark:text-stone-100 mb-2">
            {{ $t('pages.login.title') }}
          </h1>
          <p class="text-warm-gray-600 dark:text-stone-400">
            {{ $t('pages.login.message') }}
          </p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Username Field -->
          <div class="field">
            <label for="username">
              {{ $t('pages.login.username') }}
            </label>
            <input
              v-model="credentials.username"
              name="username"
              type="text"
              :placeholder="$t('pages.login.placeholderUsername')"
              class="form-input"
              :class="{ 'border-red-500 dark:border-red-400': fieldErrors.username }"
              :disabled="authStore.isLoading"
              required
              autocomplete="username"
            />
            <p v-if="fieldErrors.username" class="text-xs text-red-600 dark:text-red-400">
              {{ fieldErrors.username }}
            </p>
          </div>

          <!-- Password Field -->
          <div class="field">
            <label for="password">
              {{ $t('pages.login.password') }}
            </label>
            <div class="relative">
              <input
                v-model="credentials.password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="$t('pages.login.placeholderPassword')"
                class="form-input pr-10"
                :class="{ 'border-red-500 dark:border-red-400': fieldErrors.password }"
                :disabled="authStore.isLoading"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                :disabled="authStore.isLoading"
              >
                <i
                  class="material-symbols-outlined text-warm-gray-400 hover:text-warm-gray-600 dark:hover:text-stone-300 text-lg"
                >
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </i>
              </button>
            </div>
            <p v-if="fieldErrors.password" class="text-xs text-red-600 dark:text-red-400">
              {{ fieldErrors.password }}
            </p>
          </div>

          <!-- Error Message -->
          <div
            v-if="authStore.error"
            class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div class="flex items-center">
              <i class="material-symbols-outlined text-red-600 dark:text-red-400 mr-2 text-sm"
                >error</i
              >
              <p class="text-red-800 dark:text-red-200 text-sm">
                {{ getErrorMessage(authStore.error) }}
              </p>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="w-full button-apply flex items-center justify-center"
            :disabled="authStore.isLoading || !isFormValid"
          >
            <span v-if="authStore.isLoading" class="flex items-center">
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5"
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
              {{ $t('pages.login.signingIn') }}
            </span>
            <span v-else class="flex items-center">
              <i class="material-symbols-outlined mr-2 text-lg">login</i>
              {{ $t('pages.login.signin') }}
            </span>
          </button>
        </form>
      </div>

      <!-- Language and Theme Controls -->
      <div class="flex items-center justify-center space-x-4 mt-6">
        <LanguageSelector />
        <ThemeToggle />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import EspWol from '@/assets/icons/espwol.svg'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LanguageSelector from '@/components/LanguageSelector.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

// =============================================================================
// STATE
// =============================================================================

const credentials = reactive({
  username: '',
  password: '',
})

const fieldErrors = reactive({
  username: '',
  password: '',
})

const showPassword = ref(false)

// =============================================================================
// COMPUTED
// =============================================================================

const isFormValid = computed(() => {
  return (
    credentials.username.trim().length > 0 &&
    credentials.password.length > 0 &&
    !fieldErrors.username &&
    !fieldErrors.password
  )
})

// =============================================================================
// METHODS
// =============================================================================

function validateForm() {
  // Reset errors
  fieldErrors.username = ''
  fieldErrors.password = ''

  let isValid = true

  // Validate username
  if (!credentials.username.trim()) {
    fieldErrors.username = t('pages.login.validation.usernameRequired')
    isValid = false
  }

  // Validate password
  if (!credentials.password) {
    fieldErrors.password = t('pages.login.validation.passwordRequired')
    isValid = false
  }

  return isValid
}

function getErrorMessage(error) {
  if (error.includes('Invalid credentials') || error.includes('401')) {
    return t('pages.login.invalidCredentials')
  }
  if (error.includes('Network error') || error.includes('fetch')) {
    return t('pages.login.networkError')
  }
  return error
}

async function handleLogin() {
  // Clear previous errors
  authStore.clearError()

  if (!validateForm()) {
    return
  }

  try {
    await authStore.login(credentials.username.trim(), credentials.password)

    router.push('/')
  } catch (error) {
    console.error('Login failed:', error)

    // Clear password field on error
    credentials.password = ''
  }
}

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(() => {
  // Clear any previous auth errors
  authStore.clearError()

  // Focus username field
  const usernameInput = document.querySelector('input[type="text"]')
  if (usernameInput) {
    usernameInput.focus()
  }
})
</script>
