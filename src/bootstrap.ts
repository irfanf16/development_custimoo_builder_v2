import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { getHostTheme } from './lib/hostThemes'
import '@/icons/flex-duo-categories'

// Import CSS styles
import widgetStyles from './widget-styles.css?inline'

// Persist references to style elements across HMR updates
// so we can live-replace the CSS injected into Shadow DOMs.
const styleElements: Set<HTMLStyleElement> =
  (import.meta as any).hot?.data?.styleElements ?? new Set<HTMLStyleElement>()

if ((import.meta as any).hot) {
  ;(import.meta as any).hot.data.styleElements = styleElements
  ;(import.meta as any).hot.accept(
    ['./widget-styles.css?inline'],
    (mods: any[]) => {
      const nextCss: string = mods?.[0]?.default ?? ''
      for (const el of styleElements) {
        el.textContent = nextCss
      }
    }
  )
}

// Function to bootstrap and mount the Vue.js application
export function bootstrap(
  shadowRoot: ShadowRoot,
  attributes: Record<string, any>
) {
  // Create a container element within the shadow root
  const container = document.createElement('div')
  container.id = 'customizer-widget-container'
  // Teleport target for UI portals (e.g., tooltips) inside the widget's Shadow DOM
  ;(window as any).__CUSTOMIZER_CONTAINER__ = container

  // Set container height with responsive minimum heights
  const setContainerHeight = () => {
    const isMobile = window.innerWidth < 768 // Common mobile breakpoint
    const minHeight = isMobile ? 700 : 800

    // Use min-height instead of fixed height to allow content to determine actual height
    container.style.minHeight = `${minHeight}px`
    container.style.height = 'auto' // Let content determine height

    console.log('Widget height calculation:', {
      screenWidth: window.innerWidth,
      isMobile,
      minHeight,
      containerHeight: container.style.height,
      containerMinHeight: container.style.minHeight
    })
  }

  // Set initial height
  setContainerHeight()

  // Update height on window resize
  window.addEventListener('resize', setContainerHeight)

  shadowRoot.appendChild(container)

  // Inject CSS into shadow DOM
  const style = document.createElement('style')
  style.textContent = widgetStyles
  shadowRoot.appendChild(style)
  // Track for HMR live updates
  styleElements.add(style)

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

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', setContainerHeight)
  }
}
