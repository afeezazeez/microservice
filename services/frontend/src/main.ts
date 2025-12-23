import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast, { POSITION, useToast } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import App from './App.vue'
import router from './router'
import { setToast } from './utils/toast'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Toast, {
  position: POSITION.TOP_CENTER,
  timeout: 4000,
})

app.mount('#app')

// Initialize toast utility after app is mounted
setToast(useToast())
