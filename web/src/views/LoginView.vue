<template>
  <div class="min-h-screen flex items-center justify-center">
    <!-- Login Card -->
    <div class="w-full max-w-md mx-4 relative z-10">
      <div class="card">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center mb-4">
            <svg
              class="size-17"
              width="537"
              height="721"
              viewBox="0 0 537 721"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M48.5487 639.818C53.9577 639.818 58.3565 644.136 58.6857 649.535C60.8421 684.905 69.765 702.991 105.811 719.442C107.08 720.021 108.481 720.318 109.876 720.318H425.026C426.174 720.318 427.333 720.116 428.409 719.72C464.913 706.278 475.484 689.006 477.841 650.556C478.172 645.149 482.575 640.818 487.991 640.818H520.856C523.064 640.818 525.231 640.103 526.921 638.683C539.506 628.104 538.075 621.433 527.036 611.278C525.278 609.66 522.947 608.818 520.557 608.818H487.761C482.238 608.818 477.761 604.341 477.761 598.818V574.213C477.761 568.731 482.174 564.271 487.655 564.214L521.647 563.856C523.982 563.831 526.259 563.008 527.969 561.418C538.556 551.571 538.442 545.133 528.028 535.306C526.285 533.661 523.942 532.818 521.546 532.818H487.261C481.738 532.818 477.261 528.341 477.261 522.818V498.105C477.261 492.666 481.608 488.224 487.046 488.107L520.974 487.378C522.797 487.339 524.594 486.81 526.099 485.78C539.363 476.708 539.152 470.06 526.682 458.44C524.837 456.721 522.36 455.863 519.84 455.944L487.583 456.985C481.937 457.167 477.261 452.639 477.261 446.99V421.818C477.261 416.295 481.738 411.818 487.261 411.818H522.353C524.865 411.818 527.319 410.892 529.074 409.094C538.31 399.634 538.178 393.447 528.437 384.226C526.751 382.629 524.491 381.792 522.168 381.744L487.054 381.02C481.613 380.908 477.261 376.464 477.261 371.022V346.212C477.261 340.731 481.673 336.271 487.154 336.213L520.903 335.854C523.081 335.83 525.219 335.109 526.881 333.7C539.88 322.67 537.326 315.88 527.652 305.751C525.833 303.846 523.283 302.818 520.648 302.818H487.761C482.238 302.818 477.761 298.341 477.761 292.818V269.513C477.761 264.111 482.052 259.685 487.451 259.518L522.546 258.433C524.942 258.359 527.26 257.442 528.95 255.742C538.612 246.025 539.012 239.519 529.066 229.495C527.312 227.728 524.881 226.818 522.392 226.818H487.206C481.704 226.818 477.265 222.368 477.043 216.871C475.185 170.881 461.28 154.253 418.239 145.514C417.599 145.384 416.932 145.318 416.279 145.318H117.569C116.7 145.318 115.82 145.434 114.982 145.662C76.8859 156.044 62.3943 171.099 59.2397 216.874C58.875 222.166 54.6137 226.409 49.3108 226.526L16.8147 227.24C14.5158 227.29 12.2924 228.122 10.5751 229.651C-1.06066 240.012 -3.88146 246.554 10.8177 256.701C12.3842 257.782 14.2718 258.318 16.1752 258.318H48.7606C54.2835 258.318 58.7606 262.795 58.7606 268.318V293.318C58.7606 298.841 54.2835 303.318 48.7606 303.318H16.5084C14.3975 303.318 12.3197 303.978 10.6541 305.274C-3.33238 316.164 -2.72559 322.907 10.6461 333.346C12.3192 334.652 14.4047 335.318 16.5273 335.318H48.7606C54.2835 335.318 58.7606 339.795 58.7606 345.318V370.818C58.7606 376.341 54.2835 380.818 48.7606 380.818H15.4428C13.066 380.818 10.745 381.65 8.99516 383.258C-1.81763 393.198 -2.74654 399.666 9.10149 409.675C10.7915 411.103 12.9607 411.818 15.173 411.818H48.7606C54.2835 411.818 58.7606 416.295 58.7606 421.818V446.818C58.7606 452.341 54.2835 456.818 48.7606 456.818H15.1326C12.9451 456.818 10.798 457.519 9.11388 458.915C-3.13194 469.066 -2.04142 475.433 9.13727 485.127C10.8104 486.578 12.9619 487.344 15.176 487.391L48.5888 488.11C53.9814 488.226 58.3104 492.598 58.3731 497.991L58.6479 521.623C58.7107 527.025 54.4714 531.5 49.0737 531.73L14.8475 533.187C12.8365 533.272 10.8788 533.953 9.30977 535.214C-3.20894 545.273 -2.92593 551.683 9.09496 561.686C10.7953 563.101 12.9605 563.818 15.1725 563.818H48.2606C53.7835 563.818 58.2606 568.295 58.2606 573.818V598.818C58.2606 604.341 53.7835 608.818 48.2606 608.818H16.2747C14.0002 608.818 11.7792 609.583 10.0393 611.048C-1.00202 620.346 -4.04881 626.646 9.10295 637.69C10.7885 639.105 12.9536 639.818 15.1546 639.818H48.5487ZM119.871 176.815C118.804 176.817 117.741 176.986 116.734 177.339C100.698 182.959 95.438 189.668 90.7381 203.847C90.4156 204.819 90.26 205.839 90.2589 206.864L89.762 658.006C89.7611 658.877 89.8729 659.748 90.1041 660.588C94.4571 676.393 99.6554 683.957 118.959 689.456C119.815 689.7 120.712 689.817 121.602 689.816L416.227 689.32C416.914 689.319 417.608 689.247 418.279 689.097C435.694 685.206 441.799 677.909 446.493 658.445C446.673 657.703 446.761 656.932 446.761 656.168V208.28C446.761 207.31 446.62 206.339 446.333 205.413C440.608 186.976 434.079 180.606 418.429 176.608C417.657 176.411 416.858 176.319 416.062 176.32L119.871 176.815Z"
                fill="#504B42"
              />
              <path
                d="M252.716 91.1402C252.745 93.5143 253.598 95.8201 255.233 97.5413C266.385 109.278 272.85 108.099 282.016 97.5215C283.503 95.8052 284.261 93.5807 284.261 91.3097V16.5763C284.261 14.4588 283.596 12.3752 282.295 10.7048C271.217 -3.5161 264.377 -3.25096 253.882 9.6152C252.476 11.3383 251.775 13.5251 251.802 15.7486L252.716 91.1402Z"
                fill="#B69159"
              />
              <path
                d="M150.251 112.01C151.544 114.138 153.584 115.748 156.009 116.314C170.057 119.587 174.588 114.843 177.843 102.59C178.483 100.18 178.076 97.6169 176.841 95.4506L149.844 48.0953C148.814 46.2887 147.24 44.8303 145.333 44.0015C127.074 36.0677 120.573 38.8822 119.827 58.9484C119.758 60.8144 120.274 62.6637 121.244 64.2595L150.251 112.01Z"
                fill="#B69159"
              />
              <path
                d="M360.539 93.345C359.387 95.2708 358.897 97.5408 359.258 99.7555C362.144 117.467 368.223 120.405 383.447 114.049C385.288 113.28 386.817 111.908 387.858 110.205L415.734 64.6314C417.038 62.5 417.512 59.9492 416.973 57.5095C412.864 38.9123 407.361 34.1973 391.228 44.0757C389.927 44.8725 388.853 45.9987 388.07 47.3083L360.539 93.345Z"
                fill="#B69159"
              />
              <path
                d="M251.261 405.529C251.261 403.441 251.907 401.384 253.176 399.726C264.209 385.303 271.293 385.418 282.71 399.67C284.064 401.361 284.761 403.489 284.761 405.656V503.441C284.761 505.631 284.054 507.785 282.655 509.47C271.692 522.672 264.673 521.114 253.817 509.621C252.14 507.846 251.261 505.47 251.261 503.029V405.529Z"
                fill="#63643A"
              />
              <path
                d="M227.437 455.583C227.385 458.288 226.086 460.809 224.068 462.612C204.609 479.999 197.01 493.91 193.875 524.67C193.798 525.424 193.811 526.207 193.912 526.958C197.692 554.986 203.679 570.243 236.485 591.016C237.319 591.544 238.251 591.95 239.203 592.207C261.002 598.086 273.739 601.658 298.845 592.168C299.447 591.94 300.042 591.641 300.588 591.299C324.082 576.593 338.858 570.147 342.261 525.818C341.077 497.042 335.332 482.367 314.315 462.626C312.384 460.812 311.165 458.329 311.069 455.681C310.602 442.886 312.026 435.848 326.905 435.758C328.765 435.746 330.584 436.373 332.104 437.443C361.505 458.128 372.254 477.424 378.104 524.544C378.208 525.379 378.204 526.253 378.09 527.087C372.645 567.007 362.185 585.864 329.761 611.818C308.032 627.459 294.622 631.292 269.261 632.318C242.452 630.675 227.35 625.88 200.261 608.818C175.524 588.579 166.957 569.995 159.761 525.818C159.112 496.67 166.249 483.066 181.761 459.818C196.118 439.656 204.191 433.246 217.13 435.495C218.212 435.683 219.25 436.095 220.154 436.718C225.691 440.538 227.637 445.175 227.437 455.583Z"
                fill="#63643A"
              />
              <path
                d="M249.476 357.982C251.574 358.901 253.964 358.968 256.097 358.134C257.604 357.544 258.955 356.919 260.264 356.175C264.904 353.534 270.608 353.62 275.42 355.933C277.028 356.706 278.785 357.316 280.899 357.867C282.123 358.186 283.413 358.228 284.655 357.986C295.352 355.9 297.359 351.583 296.603 342.86C296.43 340.872 295.562 339.012 294.203 337.551C287.907 330.784 284.011 328.321 277.761 326.318C270.362 323.889 266.285 323.522 259.261 326.318C250.856 329.441 246.296 331.941 240.866 337.966C239.788 339.161 239.05 340.636 238.801 342.225C237.66 349.506 239.661 353.679 249.476 357.982Z"
                fill="#B69159"
              />
              <path
                d="M206.763 317.347C209.324 317.388 211.756 316.29 213.625 314.539C227.095 301.919 238.193 298.194 260.261 296.818C267.82 296.356 272.02 296.315 279.261 296.818C299.192 298.614 309.29 303.461 324.304 315.347C325.908 316.617 327.858 317.421 329.903 317.492C342.784 317.939 346.915 314.329 344.86 301.119C344.526 298.971 343.379 297.031 341.733 295.612C326.645 282.609 316.022 276.603 293.761 271.818C274.474 268.066 263.796 267.43 245.261 271.818C222.758 276.049 211.518 281.157 195.578 293.5C194.061 294.674 192.912 296.285 192.357 298.121C188.103 312.182 191.304 317.098 206.763 317.347Z"
                fill="#B69159"
              />
              <path
                d="M171.925 279.086C173.772 278.938 175.538 278.212 177.007 277.084C195.57 262.828 207.709 255.489 233.761 248.318C257.478 242.95 271.085 242.089 296.261 246.818C323.949 254.306 338.466 260.672 359.085 277.07C360.513 278.205 362.228 278.968 364.041 279.163C380.274 280.915 382.746 276.08 381.307 264.904C381.008 262.582 379.782 260.477 377.988 258.973C356.219 240.719 341.499 232.343 312.761 222.818C277.626 214.861 259.317 214.465 229.761 222.818C202.706 227.771 187.005 234.102 159.464 255.587C158.023 256.711 156.908 258.228 156.312 259.956C151.111 275.03 153.427 280.572 171.925 279.086Z"
                fill="#B69159"
              />
            </svg>
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
            <label for="username" class="label">
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
            <label for="password" class="label">
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

      <!-- Development Credentials Card -->
      <div v-if="!isProduction" class="mt-6">
        <div
          class="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
        >
          <div class="flex items-center mb-3">
            <i class="material-symbols-outlined text-blue-600 dark:text-blue-400 mr-2 text-lg">
              developer_mode
            </i>
            <h3 class="text-sm font-semibold text-blue-800 dark:text-blue-200">Development Mode</h3>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-blue-700 dark:text-blue-300">Username:</span>
              <button
                @click="fillUsername"
                class="text-xs font-mono bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                {{ mockUser.username }}
              </button>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-blue-700 dark:text-blue-300">Password:</span>
              <button
                @click="fillPassword"
                class="text-xs font-mono bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                {{ showDevPassword ? mockUser.password : '••••••••••••' }}
              </button>
            </div>
            <div
              class="flex items-center justify-between mt-3 pt-2 border-t border-blue-200 dark:border-blue-700"
            >
              <button
                @click="toggleDevPassword"
                class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
              >
                {{ showDevPassword ? 'Hide' : 'Show' }} Password
              </button>
              <button
                @click="fillBothCredentials"
                class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
              >
                Fill Both
              </button>
            </div>
          </div>
        </div>
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
import ThemeToggle from '@/components/ThemeToggle.vue'
import LanguageSelector from '@/components/LanguageSelector.vue'
import { mockUser } from '@/api/mock/data'

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
const showDevPassword = ref(false)

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

const isProduction = computed(() => {
  return import.meta.env.PROD
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

// Development helper functions
function fillUsername() {
  credentials.username = mockUser.username
  fieldErrors.username = ''
}

function fillPassword() {
  credentials.password = mockUser.password
  fieldErrors.password = ''
}

function fillBothCredentials() {
  credentials.username = mockUser.username
  credentials.password = mockUser.password
  fieldErrors.username = ''
  fieldErrors.password = ''
}

function toggleDevPassword() {
  showDevPassword.value = !showDevPassword.value
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
