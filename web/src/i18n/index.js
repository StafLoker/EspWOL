import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      header: {
        home: "Home",
        settings: "Settings"
      },
      pages: {
        login: {
          title: "Sign in your account",
          message: "Welcome back!",
          username: "Username",
          placeholderUsername: "Please enter username",
          password: "Password",
          placeholderPassword: "Please enter password",
          signin: "Sign in",
          invalidCredentials: "Invalid credentials"
        }
      }
    }
   },
})
