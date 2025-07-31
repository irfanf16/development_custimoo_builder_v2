import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { bootstrap } from './bootstrap'

// Import CSS for production bundling
import './style.css'

// Define the custom element for embedded widget (primary mode)
customElements.define(
  'customizer-widget',
  class extends HTMLElement {
    connectedCallback() {
      // Create a shadow DOM for encapsulation
      const shadowRoot = this.attachShadow({ mode: 'open' })

      // Fetch widget attributes to pass as properties for App.vue
      const attributes = {
        date: this.getAttribute('date'),
        title: this.getAttribute('title'),
        end: this.getAttribute('end'),
        color: this.getAttribute('color'),
        theme: this.getAttribute('theme'),
        mode: this.getAttribute('mode'),
        showNavigation: this.getAttribute('show-navigation') !== 'false'
      }

      // Bootstrap the Vue.js application within the shadow DOM
      bootstrap(shadowRoot, attributes)
    }
  }
)

// SPA mode (fallback) - mount to #app if it exists and no widget is present
const appElement = document.getElementById('app')
const hasWidget = document.querySelector('customizer-widget') !== null

if (appElement && !hasWidget) {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.mount('#app')
}
