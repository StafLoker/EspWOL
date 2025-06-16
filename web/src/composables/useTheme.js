import { useDark, useToggle, useStorage } from '@vueuse/core'
import { computed } from 'vue'

export function useTheme() {
  // Use VueUse's dark mode composable with custom configuration
  const isDark = useDark({
    selector: 'html',
    attribute: 'data-bs-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'espwol-theme',
    storage: localStorage
  })

  const toggle = useToggle(isDark)

  // Computed properties for theme state
  const currentTheme = computed(() => isDark.value ? 'dark' : 'light')
  const themeIcon = computed(() => isDark.value ? 'light_mode' : 'dark_mode')
  const themeLabel = computed(() => isDark.value ? 'Light' : 'Dark')

  // Method to set specific theme
  const setTheme = (theme) => {
    isDark.value = theme === 'dark'
  }

  // Method to toggle theme
  const toggleTheme = () => {
    toggle()
  }

  return {
    isDark,
    currentTheme,
    themeIcon,
    themeLabel,
    toggleTheme,
    setTheme
  }
}
