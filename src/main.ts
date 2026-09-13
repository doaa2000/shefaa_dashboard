import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { i18n, applyDocumentLocale } from './app/i18n'
import './app/styles/main.css'

// Before the app mounts: the direction of the whole layout hangs off the
// <html> attributes, and setting them after the first paint flips the page in
// front of the reader.
applyDocumentLocale()

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)

app.mount('#app')
