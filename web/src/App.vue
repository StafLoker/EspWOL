<template>
  <div
    class="h-screen flex flex-col px-3 py-4 bg-stone-100 dark:bg-zinc-950 relative overflow-hidden"
  >
    <!-- Animated Background -->
    <div class="fixed inset-0 opacity-25 pointer-events-none">
      <svg class="w-full h-full" viewBox="0 0 1400 800" xmlns="http://www.w3.org/2000/svg">
        <g
          stroke="currentColor"
          stroke-width="0.8"
          fill="none"
          class="text-warm-gray-400 dark:text-zinc-600"
        >
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
        <LanguageSelector />
        <ThemeToggle />

        <!-- User Menu -->
        <DropdownMenuRoot v-model:open="dropdownOpen">
          <DropdownMenuTrigger class="avatar-link">
            <AvatarRoot
              class="avatar-root"
              :class="{ 'avatar-active': $route.path === '/account' || dropdownOpen }"
            >
              <AvatarFallback class="avatar-fallback">
                {{ authStore.shortUsername }}
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
                <!-- Make loading animation reusefull -->
                <span v-if="logoutLoading" class="flex items-center">
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
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'reka-ui'
import { ref, onMounted } from 'vue'
import { useLanguage } from '@/composables/useLanguage'
import { useAuthStore } from '@/stores/authStore'
import EspWol from '@/assets/icons/espwol.svg'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LanguageSelector from '@/components/LanguageSelector.vue'

// Router & Stores
const router = useRouter()
const authStore = useAuthStore()

const { detectBrowserLanguage } = useLanguage()

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

<style scoped>
@reference "@/assets/main.css";

/* Navigation Pills */
.nav-pill-link {
  @apply transition-all duration-200;
}

.nav-pill {
  @apply rounded-full px-6 py-2 text-sm font-medium transition-all duration-200 border shadow-sm;
  @apply bg-stone-50 border-stone-200 text-warm-gray-700 hover:bg-stone-100 hover:shadow-md;
  @apply dark:bg-zinc-800 dark:border-zinc-700 dark:text-stone-200 dark:hover:bg-zinc-700 dark:shadow-zinc-900/50;
}

.nav-pill-active {
  @apply bg-slate-600 border-slate-600 text-white shadow-md;
  @apply dark:bg-slate-700 dark:border-slate-700;
}

.nav-pill:hover {
  @apply transform -translate-y-0.5;
}

.nav-pill-active:hover {
  @apply bg-slate-700 dark:bg-slate-600;
}

/* Avatar */
.avatar-link {
  @apply transition-all duration-200;
}

.avatar-root {
  @apply inline-flex h-[45px] w-[45px] select-none items-center justify-center overflow-hidden rounded-full align-middle;
  @apply bg-stone-100 border border-stone-300 shadow-sm hover:shadow-md transition-all duration-200;
  @apply dark:bg-zinc-700 dark:border-zinc-600 dark:shadow-zinc-900/50;
}

.avatar-active {
  @apply bg-slate-600 border-slate-600 shadow-md ring-2 ring-slate-200;
  @apply dark:bg-slate-700 dark:border-slate-700 dark:ring-slate-600;
}

.avatar-fallback {
  @apply flex h-full w-full items-center justify-center text-sm font-medium leading-1;
  @apply text-warm-gray-700 dark:text-stone-200;
}

.avatar-active .avatar-fallback {
  @apply text-white;
}

.avatar-link:hover .avatar-root {
  @apply transform -translate-y-0.5;
}
</style>
