import { useStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { computed, watch } from 'vue'

export function useLanguage() {
  const { locale, t } = useI18n()

  // Store current language in localStorage
  const currentLocale = useStorage('espwol-locale', 'en')

  // Available languages configuration
  const availableLanguages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English'
    },
    {
      code: 'es',
      name: 'Español',
      nativeName: 'Español'
    },
    {
      code: 'ru',
      name: 'Русский',
      nativeName: 'Русский'
    }
  ]

  // Computed properties
  const currentLanguage = computed(() => {
    return availableLanguages.find(lang => lang.code === currentLocale.value)
  })

  const currentLanguageName = computed(() => {
    return currentLanguage.value?.nativeName || 'English'
  })

  // Methods
  const changeLanguage = (newLocale) => {
    if (availableLanguages.some(lang => lang.code === newLocale)) {
      currentLocale.value = newLocale
      locale.value = newLocale
    }
  }

  const getLanguageName = (code) => {
    return t(`languages.${code}`)
  }

  // Initialize locale and watch for changes
  locale.value = currentLocale.value

  // Sync localStorage with i18n locale
  watch(currentLocale, (newLocale) => {
    if (locale.value !== newLocale) {
      locale.value = newLocale
    }
  })

  // Detect browser language on first visit
  const detectBrowserLanguage = () => {
    const browserLang = navigator.language.split('-')[0]
    const supportedLang = availableLanguages.find(lang => lang.code === browserLang)

    if (supportedLang && !localStorage.getItem('espwol-locale')) {
      changeLanguage(supportedLang.code)
    }
  }

  return {
    currentLocale,
    currentLanguage,
    currentLanguageName,
    availableLanguages,
    changeLanguage,
    getLanguageName,
    detectBrowserLanguage
  }
}
