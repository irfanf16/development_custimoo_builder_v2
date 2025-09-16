import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import '@/icons/flex-flat-categories'
import { useUIStore } from '@/stores/ui'

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

  // Initialize Pinia and UI store early to manage viewport state
  const pinia = createPinia()
  const ui = useUIStore(pinia)

  // Set container height with responsive minimum heights from the UI store
  const setContainerHeight = () => {
    ui.setContainerSize(container.clientWidth, container.clientHeight)

    const minHeight = ui.minWidgetHeight
    container.style.minHeight = `${minHeight}px`
    container.style.height = 'auto'
  }

  // Set initial height
  setContainerHeight()

  // Update height on window resize
  window.addEventListener('resize', setContainerHeight)

  shadowRoot.appendChild(container)
  ui.setWidgetRoot(container)

  // Inject CSS into shadow DOM
  const style = document.createElement('style')
  style.textContent = widgetStyles
  shadowRoot.appendChild(style)
  // Track for HMR live updates
  styleElements.add(style)

  // Fonts are loaded centrally in useColorScheme; no shadowRoot font loading here

  // Create a new Vue application instance
  // second argument is object of attributes that will be
  // converted to properties in App.vue
  const app = createApp(App, attributes)

  // Initialize Pinia for the widget
  app.use(pinia)

  // Initialize unified Router for the widget
  app.use(router)

  // Mount the Vue application onto the container element within shadow root
  app.mount(container)

  setContainerHeight()

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', setContainerHeight)
  }
}
