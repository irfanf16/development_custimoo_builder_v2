import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Import CSS styles
import widgetStyles from './widget-styles.css?inline'

// Function to bootstrap and mount the Vue.js application
export function bootstrap(
  shadowRoot: ShadowRoot,
  attributes: Record<string, any>
) {
  // Create a container element within the shadow root
  const container = document.createElement('div')
  container.id = 'customizer-widget-container'
  shadowRoot.appendChild(container)

  // Inject CSS into shadow DOM
  const style = document.createElement('style')
  style.textContent = widgetStyles
  shadowRoot.appendChild(style)

  // Create a new Vue application instance
  // second argument is object of attributes that will be
  // converted to properties in App.vue
  const app = createApp(App, attributes)

  // Initialize Pinia for the widget
  const pinia = createPinia()
  app.use(pinia)

  // Initialize unified Router for the widget
  app.use(router)

  // Mount the Vue application onto the container element within shadow root
  app.mount(container)
}
