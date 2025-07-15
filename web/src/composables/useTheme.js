import { useDark, useToggle } from '@vueuse/core'
import { computed } from 'vue'

export function useTheme() {
  const isDark = useDark()

  const toggleTheme = useToggle(isDark)

  const currentTheme = computed(() => (isDark.value ? 'dark' : 'light'))

  const themeIcon = computed(() => (isDark.value ? 'light_mode' : 'dark_mode'))

  const themeLabel = computed(() => (isDark.value ? 'theme.light' : 'theme.dark'))

  const toggleLabel = computed(() => (isDark.value ? 'theme.switchToLight' : 'theme.switchToDark'))

  return {
    isDark,
    currentTheme,
    themeIcon,
    themeLabel,
    toggleLabel,
    toggleTheme,
  }
}
