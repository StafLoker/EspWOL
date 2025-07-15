import { useDark, useToggle } from '@vueuse/core'
import { computed } from 'vue'

export function useTheme() {
  const isDark = useDark()

  const toggleTheme = useToggle(isDark)

  const currentTheme = computed(() => (isDark.value ? 'dark' : 'light'))

  const themeIcon = computed(() => (isDark.value ? 'light_mode' : 'dark_mode'))

  const themeLabel = computed(() => (isDark.value ? 'components.themeToggle.light' : 'components.themeToggle.dark'))

  const toggleLabel = computed(() => (isDark.value ? 'components.themeToggle.switchToLight' : 'components.themeToggle.switchToDark'))

  return {
    isDark,
    currentTheme,
    themeIcon,
    themeLabel,
    toggleLabel,
    toggleTheme,
  }
}
