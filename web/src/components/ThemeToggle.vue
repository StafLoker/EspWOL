<template>
  <button @click="toggleTheme" class="nav-pill flex items-center" :title="$t('theme.toggle')">
    <i class="material-symbols-outlined text-lg mr-2">
      {{ isDark ? 'light_mode' : 'dark_mode' }}
    </i>
    <span class="hidden sm:inline">
      {{ isDark ? $t('theme.light') : $t('theme.dark') }}
    </span>
  </button>
</template>

<script setup>
import { useTheme } from '@/composables/useTheme'
const { isDark, toggleTheme } = useTheme()
</script>

<style scoped></style>
