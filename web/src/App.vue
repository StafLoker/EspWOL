<template>
  <div class="min-h-screen bg-stone-200 dark:bg-zinc-900 relative px-3 py-4 flex flex-col">
    <div class="fixed inset-0 opacity-25 pointer-events-none">
      <svg class="w-full h-full" viewBox="0 0 1400 800" xmlns="http://www.w3.org/2000/svg">
        <g
          stroke="currentColor"
          stroke-width="0.8"
          fill="none"
          class="text-warm-gray-400 dark:text-zinc-600"
        >
          <path d="M-200,100 Q100,80 400,100 T1000,100 T1600,100">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="20s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,150 Q150,170 450,150 T1050,150 T1650,150">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="25s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,200 Q200,180 500,200 T1100,200 T1700,200">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="30s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,300 Q250,320 550,300 T1150,300 T1750,300">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="22s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,400 Q300,380 600,400 T1200,400 T1800,400">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="28s"
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

    <header v-if="$route.path !== '/login'" class="h-min-10 flex justify-between items-center z-10 flex-shrink-0">
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
          <SelectRoot v-model="currentLocale" @update:model-value="changeLanguage">
            <SelectTrigger class="nav-pill flex items-center min-w-[120px]">
              <div class="flex items-center">
                <i class="material-symbols-outlined text-lg mr-2">language</i>
                <SelectValue :placeholder="getLanguageName(currentLocale)" />
              </div>
              <i class="material-symbols-outlined text-sm ml-1">expand_more</i>
            </SelectTrigger>
            <SelectPortal>
              <SelectContent class="select-content bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg shadow-lg z-[200] min-w-[120px]">
                <SelectViewport class="p-2">
                  <SelectItem
                    v-for="lang in availableLanguages"
                    :key="lang.code"
                    :value="lang.code"
                    class="select-item px-3 py-2 rounded-md hover:bg-stone-200 dark:hover:bg-zinc-700 cursor-pointer text-warm-gray-800 dark:text-stone-200 transition-colors duration-150 focus:outline-none focus:bg-stone-200 dark:focus:bg-zinc-700"
                    :class="{ 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100': currentLocale === lang.code }"
                  >
                    <SelectItemText class="flex items-center">
                      {{ getLanguageName(lang.code) }}
                    </SelectItemText>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </div>

        <!-- Theme Toggle -->
        <button
          @click="toggleTheme"
          class="nav-pill flex items-center"
          :title="$t('theme.toggle')"
        >
          <i class="material-symbols-outlined text-lg mr-2">
            {{ isDark ? 'light_mode' : 'dark_mode' }}
          </i>
          <span class="hidden sm:inline">
            {{ isDark ? $t('theme.light') : $t('theme.dark') }}
          </span>
        </button>

        <!-- User Avatar Dropdown -->
        <DropdownMenuRoot v-model:open="dropdownOpen">
          <DropdownMenuTrigger class="avatar-link">
            <AvatarRoot class="avatar-root" :class="{ 'avatar-active': $route.path === '/account' || dropdownOpen }">
              <AvatarFallback class="avatar-fallback">
                {{ shortUsername }}
              </AvatarFallback>
            </AvatarRoot>
          </DropdownMenuTrigger>

          <DropdownMenuPortal>
            <DropdownMenuContent
              class="min-w-[180px] outline-none bg-stone-50 dark:bg-zinc-800 rounded-xl p-2 shadow-xl border border-stone-200 dark:border-zinc-700 z-[200]"
              :side-offset="8"
              align="end"
            >
              <DropdownMenuItem
                class="group text-sm leading-none text-warm-gray-800 dark:text-stone-200 rounded-lg flex items-center h-10 px-3 relative select-none outline-none data-[disabled]:text-warm-gray-400 data-[disabled]:pointer-events-none data-[highlighted]:bg-stone-200 dark:data-[highlighted]:bg-zinc-700 transition-colors duration-150 cursor-pointer"
                @click="handleGoToAccount"
              >
                <i class="material-symbols-outlined text-lg mr-3">person</i>
                {{ $t('header.account') }}
              </DropdownMenuItem>

              <DropdownMenuSeparator class="h-px bg-stone-200 dark:bg-zinc-700 my-2" />

              <DropdownMenuItem
                class="group text-sm leading-none text-warm-gray-800 dark:text-stone-200 rounded-lg flex items-center h-10 px-3 relative select-none outline-none data-[disabled]:text-warm-gray-400 data-[disabled]:pointer-events-none data-[highlighted]:bg-red-100 dark:data-[highlighted]:bg-red-900/30 transition-colors duration-150 cursor-pointer"
                @click="handleLogout"
                :disabled="logoutLoading"
              >
                <span v-if="logoutLoading" class="flex items-center">
                  <svg class="animate-spin mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
  AvatarFallback,
  AvatarRoot,
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
  DropdownMenuSeparator
} from 'reka-ui'
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useLanguage } from '@/composables/useLanguage'
import EspWol from '@/assets/icons/espwol.svg'

// Router
const router = useRouter()

// Composables
const { isDark, toggleTheme } = useTheme()
const {
  currentLocale,
  availableLanguages,
  changeLanguage,
  getLanguageName,
  detectBrowserLanguage
} = useLanguage()

// Reactive data
const shortUsername = ref('ST')
const dropdownOpen = ref(false)
const logoutLoading = ref(false)

// Methods
function handleGoToAccount() {
  dropdownOpen.value = false
  router.push('/account')
}

async function handleLogout() {
  logoutLoading.value = true

  try {
    // Clear any stored authentication data
    localStorage.clear()
    sessionStorage.clear()

    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500))

    // Close dropdown
    dropdownOpen.value = false

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

onMounted(() => {
  detectBrowserLanguage()
})
</script>
