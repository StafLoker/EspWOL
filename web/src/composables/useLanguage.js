import { useStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { computed, watch, onMounted } from 'vue'

export function useLanguage() {
  const { locale, t } = useI18n()

  const currentLocale = useStorage('espwol-locale', 'en')

  const availableLanguages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English'
    }
  ]

  // Computed properties
  const currentLanguage = computed(() => {
    return availableLanguages.find((lang) => lang.code === currentLocale.value)
  })

  const currentLanguageName = computed(() => {
    return currentLanguage.value?.name || 'English'
  })

  const currentLanguageNativeName = computed(() => {
    return currentLanguage.value?.nativeName || 'English'
  })

  const changeLanguage = (newLocale) => {
    if (availableLanguages.some((lang) => lang.code === newLocale)) {
      currentLocale.value = newLocale
      locale.value = newLocale
    }
  }

  const getLanguageName = (code) => {
    return t(`languages.${code}`)
  }

  const detectBrowserLanguage = () => {
    const browserLang = navigator.language.split('-')[0]
    const supportedLang = availableLanguages.find((lang) => lang.code === browserLang)
    if (supportedLang && !localStorage.getItem('espwol-locale')) {
      changeLanguage(supportedLang.code)
    }
  }

  onMounted(() => {
    locale.value = currentLocale.value
    detectBrowserLanguage()
  })

  watch(currentLocale, (newLocale) => {
    if (locale.value !== newLocale) {
      locale.value = newLocale
    }
  })

  return {
    currentLocale,
    currentLanguage,
    currentLanguageName,
    currentLanguageNativeName,
    availableLanguages,
    changeLanguage,
    getLanguageName,
    detectBrowserLanguage,
  }
}
