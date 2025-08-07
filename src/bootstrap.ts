import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { getHostTheme } from './lib/hostThemes'

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

  // Inject Google Fonts link into shadow DOM if needed
  const hostTheme = getHostTheme()
  if (hostTheme?.fontFamilyDefault || hostTheme?.fontFamilyHeading) {
    // Add preconnect links for better performance
    const preconnect1 = document.createElement('link')
    preconnect1.rel = 'preconnect'
    preconnect1.href = 'https://fonts.googleapis.com'
    shadowRoot.appendChild(preconnect1)

    const preconnect2 = document.createElement('link')
    preconnect2.rel = 'preconnect'
    preconnect2.href = 'https://fonts.gstatic.com'
    preconnect2.setAttribute('crossorigin', '')
    shadowRoot.appendChild(preconnect2)

    // Add font stylesheets
    const fontsToLoad = []
    if (hostTheme.fontFamilyDefault)
      fontsToLoad.push(hostTheme.fontFamilyDefault)
    if (hostTheme.fontFamilyHeading)
      fontsToLoad.push(hostTheme.fontFamilyHeading)

    fontsToLoad.forEach(font => {
      const fontLink = document.createElement('link')
      fontLink.rel = 'stylesheet'
      fontLink.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
      shadowRoot.appendChild(fontLink)
    })
  }

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
