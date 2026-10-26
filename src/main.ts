import './assets/base.css'

import { registerSW } from 'virtual:pwa-register'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router.js'

registerSW({
  immediate: true
})
const app = createApp(App)

app.use(router)

app.mount('#app')
