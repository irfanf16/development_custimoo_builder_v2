import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

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

  // In development, use @import
  if (import.meta.env?.DEV) {
    style.textContent = `
      /* Import Tailwind CSS and other styles */
      @import url('/src/style.css');
    `
  } else {
    // In production, the CSS is bundled with the JavaScript
    // We'll create a temporary link to load the CSS and extract it
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/dist/style.css'

    link.onload = () => {
      try {
        // Try to extract CSS from the loaded stylesheet
        const sheet = link.sheet
        if (sheet) {
          let cssText = ''
          for (let i = 0; i < sheet.cssRules.length; i++) {
            cssText += sheet.cssRules[i].cssText + '\n'
          }
          style.textContent = cssText
        }
      } catch (e) {
        console.warn('Could not extract CSS from stylesheet:', e)
      }
    }

    link.onerror = () => {
      console.warn('Failed to load CSS file')
    }

    document.head.appendChild(link)
  }

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
