import { ref, computed, watch, onMounted } from 'vue'

export function useTheme() {
  // Create reactive reference for dark mode
  const isDark = ref(false)

  // Initialize theme from localStorage or system preference
  const initializeTheme = () => {
    const stored = localStorage.getItem('espwol-theme')
    if (stored) {
      isDark.value = stored === 'dark'
    } else {
      // Check system preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  // Apply theme to DOM
  const applyTheme = () => {
    const html = document.documentElement
    if (isDark.value) {
      html.classList.add('dark')
      html.setAttribute('data-bs-theme', 'dark')
    } else {
      html.classList.remove('dark')
      html.setAttribute('data-bs-theme', 'light')
    }
  }

  // Watch for changes and persist
  watch(isDark, (newValue) => {
    localStorage.setItem('espwol-theme', newValue ? 'dark' : 'light')
    applyTheme()
  })

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
    isDark.value = !isDark.value
  }

  // Initialize on mount
  onMounted(() => {
    initializeTheme()
  })

  return {
    isDark,
    currentTheme,
    themeIcon,
    themeLabel,
    toggleTheme,
    setTheme,
    initializeTheme
  }
}
