import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MemorizeView from '../views/MemorizeView.vue'
import AdminView from '../views/AdminView.vue'
import { useAuth } from '../composables/useAuth.ts'
import LoginView from '../views/LoginView.vue'
import { watch } from 'vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/memorize/:deckId',
      name: 'memorize',
      component: MemorizeView
    },
    { path: '/login', component: LoginView },
    { path: '/admin', component: AdminView, meta: { requiresAuth: true } }
  ]
})

router.beforeEach(async (to) => {
  const { authReady, isLoggedIn } = useAuth()
  await authReady

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // Already signed in: no reason to see the login page
  if (to.path === '/login' && isLoggedIn.value) {
    return '/admin'
  }

  return true
})

// If the user signs out while on a protected page, kick them out
const { isLoggedIn } = useAuth()
watch(isLoggedIn, (loggedIn) => {
  if (!loggedIn && router.currentRoute.value.meta.requiresAuth) {
    router.replace('/login')
  }
})

export default router
