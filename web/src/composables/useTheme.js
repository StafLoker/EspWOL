import { useDark, useToggle } from '@vueuse/core'
import { computed } from 'vue'

export function useTheme() {
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
    storageKey: 'espwol-theme',
  })

  const toggleTheme = useToggle(isDark)

  const currentTheme = computed(() => (isDark.value ? 'dark' : 'light'))
  const themeIcon = computed(() => (isDark.value ? 'light_mode' : 'dark_mode'))
  const themeLabel = computed(() => (isDark.value ? 'Light' : 'Dark'))

  // Method to set specific theme (para compatibilidad)
  const setTheme = (theme) => {
    isDark.value = theme === 'dark'
  }

  return {
    isDark,
    currentTheme,
    themeIcon,
    themeLabel,
    toggleTheme,
    setTheme,
  }
}
