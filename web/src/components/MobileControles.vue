<template>
  <div class="sm:hidden">
    <!-- Mobile Controls Button -->
    <button
      @click="isOpen = !isOpen"
      class="nav-pill flex items-center"
      :class="{ 'nav-pill-active': isOpen }"
    >
      <i class="material-symbols-outlined text-lg">
        {{ isOpen ? 'close' : 'more_vert' }}
      </i>
    </button>

    <!-- Mobile Controls Dropdown -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 sm:hidden"
        @click="isOpen = false"
      >
        <div class="fixed inset-0 bg-black/50 dark:bg-black/70"></div>
        <div
          class="fixed top-20 right-3 bg-stone-50 dark:bg-zinc-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-zinc-700 p-4 min-w-[200px]"
          @click.stop
        >
          <!-- Language Section -->
          <div class="mb-4">
            <h4 class="text-sm font-medium text-warm-gray-700 dark:text-stone-200 mb-2">
              {{ $t('header.language') }}
            </h4>
            <div class="space-y-2">
              <button
                v-for="lang in availableLanguages"
                :key="lang.code"
                @click="selectLanguage(lang.code)"
                class="w-full flex items-center p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
                :class="{ 'bg-slate-100 dark:bg-slate-700': currentLocale === lang.code }"
              >
                <span class="mr-2">{{ lang.flag }}</span>
                <span class="text-warm-gray-800 dark:text-stone-200">
                  {{ getLanguageName(lang.code) }}
                </span>
                <i v-if="currentLocale === lang.code" class="material-symbols-outlined text-sm ml-auto text-slate-600 dark:text-slate-400">
                  check
                </i>
              </button>
            </div>
          </div>

          <!-- Theme Section -->
          <div>
            <h4 class="text-sm font-medium text-warm-gray-700 dark:text-stone-200 mb-2">
              {{ $t('header.theme') }}
            </h4>
            <button
              @click="toggleTheme"
              class="w-full flex items-center p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <i class="material-symbols-outlined text-lg mr-2">
                {{ isDark ? 'light_mode' : 'dark_mode' }}
              </i>
              <span class="text-warm-gray-800 dark:text-stone-200">
                {{ isDark ? $t('theme.light') : $t('theme.dark') }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useLanguage } from '@/composables/useLanguage'

// Composables
const { isDark, toggleTheme } = useTheme()
const {
  currentLocale,
  availableLanguages,
  changeLanguage,
  getLanguageName
} = useLanguage()

// State
const isOpen = ref(false)

// Methods
const selectLanguage = (locale) => {
  changeLanguage(locale)
  isOpen.value = false
}
</script>
