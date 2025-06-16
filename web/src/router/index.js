import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'authentication',
      component: LoginView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    }
  ],
})

/*
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = !publicRoutes.includes(to.name as string)

  if (requiresAuth && !isAuthenticated) {
    next({ name: '/login', query: { redirect: to.fullPath } })
  } else if (isAuthenticated && publicRoutes.includes(to.name as string)) {
    next({ name: '/' })
  } else {
    next()
  }
})
*/

export default router
