<template>
  <div
    class="h-screen flex flex-col bg-gradient-to-br from-white to-stone-100 dark:from-zinc-900 dark:to-zinc-950 relative overflow-hidden"
  >
    <!-- Animated Background -->
    <div class="absolute inset-0 opacity-30 dark:opacity-20">
      <svg class="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.1" />
            <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.05" />
          </linearGradient>
        </defs>
        <g fill="url(#waveGradient)" stroke="none">
          <path d="M-200,300 Q200,250 400,300 T800,300 T1200,300 T1600,300">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="25s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,400 Q300,380 500,400 T900,400 T1300,400 T1700,400">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="30s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,500 Q350,520 650,500 T1250,500 T1850,500">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="35s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,600 Q400,580 700,600 T1300,600 T1900,600">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="18s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </svg>
    </div>

    <header
      v-if="$route.path !== '/login'"
      class="h-min-10 flex justify-between items-center z-10 flex-shrink-0"
    >
      <div class="flex items-center">
        <RouterLink
          to="/"
          class="flex items-center hover:opacity-80 transition-opacity duration-200"
        >
          <EspWol class="size-10" />
          <p
            class="text-xl font-semibold leading-[10px] ml-1 tracking-[3px] font-stretch-expanded text"
          >
            EspWOL
          </p>
        </RouterLink>

        <div class="ml-5 space-x-3 flex items-center">
          <RouterLink to="/" class="nav-pill-link">
            <div class="nav-pill" :class="{ 'nav-pill-active': $route.path === '/' }">
              {{ $t('header.home') }}
            </div>
          </RouterLink>
          <RouterLink to="/settings" class="nav-pill-link">
            <div class="nav-pill" :class="{ 'nav-pill-active': $route.path === '/settings' }">
              {{ $t('header.settings') }}
            </div>
          </RouterLink>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <!-- Language Selector -->
        <div class="relative">
          <SelectRoot v-model="currentLocale">
            <SelectTrigger class="nav-pill cursor-pointer">
              <SelectValue>
                <div class="flex items-center">
                  <i class="material-symbols-outlined text-lg mr-2">language</i>
                  {{ getLanguageName(currentLocale) }}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectPortal>
              <SelectContent class="select-content">
                <SelectViewport>
                  <SelectItem
                    v-for="lang in availableLanguages"
                    :key="lang.code"
                    :value="lang.code"
                    class="select-item"
                    @click="changeLanguage(lang.code)"
                  >
                    <SelectItemText>{{ lang.name }}</SelectItemText>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </div>

        <!-- Theme Toggle -->
        <button
          @click="toggleTheme"
          class="nav-pill cursor-pointer flex items-center"
          :title="isDark ? $t('theme.switchToLight') : $t('theme.switchToDark')"
        >
          <i class="material-symbols-outlined text-lg">
            {{ isDark ? 'light_mode' : 'dark_mode' }}
          </i>
        </button>

        <!-- User Menu -->
        <DropdownMenuRoot v-model:open="dropdownOpen">
          <DropdownMenuTrigger class="nav-pill cursor-pointer outline-none">
            <AvatarRoot class="size-8">
              <AvatarFallback
                class="size-8 bg-blue-600 text-white text-sm font-medium flex items-center justify-center rounded-full"
              >
                {{ authStore.shortUsername }}
              </AvatarFallback>
            </AvatarRoot>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent class="dropdown-content" align="end">
              <div class="px-3 py-2 border-b border-stone-200 dark:border-zinc-700">
                <p class="text-sm font-medium text-warm-gray-900 dark:text-stone-100">
                  {{ authStore.username }}
                </p>
                <p class="text-xs text-warm-gray-500 dark:text-stone-400">
                  {{ $t('pages.account.session.loggedIn') }}
                </p>
              </div>

              <DropdownMenuItem
                class="text-warm-gray-700 dark:text-stone-200 rounded-lg flex items-center h-10 px-3 relative select-none outline-none data-[disabled]:text-warm-gray-400 data-[disabled]:pointer-events-none data-[highlighted]:bg-stone-100 dark:data-[highlighted]:bg-zinc-700 transition-colors duration-150 cursor-pointer"
                @click="handleGoToAccount"
              >
                <i class="material-symbols-outlined text-lg mr-3">person</i>
                {{ $t('pages.account.title') }}
              </DropdownMenuItem>

              <DropdownMenuSeparator class="h-px bg-stone-200 dark:bg-zinc-700 my-1" />

              <DropdownMenuItem
                class="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-stone-200 rounded-lg flex items-center h-10 px-3 relative select-none outline-none data-[disabled]:text-warm-gray-400 data-[disabled]:pointer-events-none data-[highlighted]:bg-red-100 dark:data-[highlighted]:bg-red-900/30 transition-colors duration-150 cursor-pointer"
                @click="handleLogout"
                :disabled="authStore.isLoading"
              >
                <span v-if="authStore.isLoading" class="flex items-center">
                  <svg
                    class="animate-spin mr-3 h-4 w-4"
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
                  {{ $t('pages.account.session.loggingOut') }}
                </span>
                <span v-else class="flex items-center">
                  <i class="material-symbols-outlined text-lg mr-3">logout</i>
                  {{ $t('pages.account.session.logout') }}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
      </div>
    </header>

    <main class="flex-1 relative z-10 pt-10 px-5 overflow-y-auto">
      <div class="pb-8">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { RouterView, RouterLink, useRouter } from 'vue-router'
import {
  AvatarRoot,
  AvatarFallback,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'reka-ui'
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useLanguage } from '@/composables/useLanguage'
import { useAuthStore } from '@/stores/authStore'
import EspWol from '@/assets/icons/espwol.svg'

// Router & Stores
const router = useRouter()
const authStore = useAuthStore()

// Composables
const { isDark, toggleTheme } = useTheme()
const {
  currentLocale,
  availableLanguages,
  changeLanguage,
  getLanguageName,
  detectBrowserLanguage,
} = useLanguage()

// Reactive data
const dropdownOpen = ref(false)

// Methods
function handleGoToAccount() {
  dropdownOpen.value = false
  router.push('/account')
}

async function handleLogout() {
  try {
    await authStore.logout()

    // Close dropdown
    dropdownOpen.value = false

    // Redirect to login page
    router.push('/login')

    // Small delay then reload to clear any cached data
    setTimeout(() => {
      location.reload()
    }, 100)
  } catch (error) {
    console.error('Error during logout:', error)
    // Even if logout fails on server, we still redirect
    dropdownOpen.value = false
    router.push('/login')
  }
}

onMounted(() => {
  detectBrowserLanguage()
})
</script>
