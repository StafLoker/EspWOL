<template>
  <button
    @click="toggleTheme"
    class="nav-pill flex items-center"
    :aria-label="$t('theme.toggle')"
    :title="$t(toggleLabel)"
  >
    <i class="material-symbols-outlined text-lg mr-2">
      {{ themeIcon }}
    </i>
    <span class="hidden sm:inline">
      {{ $t(themeLabel) }}
    </span>
  </button>
</template>

<script setup>
import { useTheme } from '@/composables/useTheme'

const { themeIcon, themeLabel, toggleLabel, toggleTheme } = useTheme()
</script>
