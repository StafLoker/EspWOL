import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'

// Configurar Mirage para desarrollo/demo
if (import.meta.env.MODE === 'development' || import.meta.env.MODE === 'demo') {
  const { setupMirageServer } = await import('./api/mock')
  setupMirageServer()
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
