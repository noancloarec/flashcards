import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuth } from './composables/useAuth.ts'
import AdminView from './views/AdminView.vue'
import EditDeckView from './views/EditDeckView.vue'
import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'
import MemorizeView from './views/MemorizeView.vue'
import NewDeckView from './views/NewDeckView.vue'

const { isLoggedInGoogle, authReady } = useAuth()

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/memorize/:deckId',
      name: 'memorize',
      component: MemorizeView
    },
    { path: '/login', component: LoginView },
    {
      path: '/admin',
      component: AdminView,
      meta: { requiresAuth: true, title: 'Administration - Flashcards' }
    },
    {
      path: '/new-deck',
      component: NewDeckView,
      meta: { requiresAuth: true, title: 'Nouveau jeu de cartes - Flashcards' }
    },
    { path: '/edit-deck/:deckId', component: EditDeckView, meta: { requiresAuth: true } }
  ]
})

router.beforeEach(async (to) => {
  await authReady

  if (to.meta.requiresAuth && !isLoggedInGoogle.value) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // Already signed in: no reason to see the login page
  if (to.path === '/login' && isLoggedInGoogle.value) {
    return '/'
  }

  return true
})
router.afterEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
})

// If the user signs out while on a protected page, kick them out
watch(isLoggedInGoogle, (loggedIn) => {
  if (!loggedIn && router.currentRoute.value.meta.requiresAuth) {
    router.replace('/login')
  }
})

export default router
