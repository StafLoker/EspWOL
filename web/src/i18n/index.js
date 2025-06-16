import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      pages: {
        login: {
          title: "Sign in your account",
          message: "Welcome back!",
          username: "Username",
          placeholderUsername: "Please enter username",
          password: "Password",
          placeholderPassword: "Please enter password",
          signin: "Sign in"
        }
      }
    }
   },
})
