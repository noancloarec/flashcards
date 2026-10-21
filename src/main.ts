import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import { registerSW } from 'virtual:pwa-register'
import './assets/base.css'

registerSW({
  immediate: true
})
const app = createApp(App)

app.use(router)

app.mount('#app')
