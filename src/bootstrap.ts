import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import '@/icons/flex-flat-categories'
import { useUIStore } from '@/stores/ui/ui.store'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useAppStore } from '@/stores/app/app.store'
import { WIDGET_CONTAINER_ID } from './lib/widgetUtils'

// Import CSS styles
import widgetStyles from './styles.css?inline'

// Persist references to style elements across HMR updates
// so we can live-replace the CSS injected into Shadow DOMs.
const styleElements: Set<HTMLStyleElement> =
  ((import.meta as unknown as { hot?: { data?: Record<string, unknown> } }).hot?.data
    ?.styleElements as Set<HTMLStyleElement>) || new Set<HTMLStyleElement>()

if (
  (
    import.meta as unknown as {
      hot?: {
        data: Record<string, unknown>
        accept: (deps: string[], cb: (mods: Array<{ default?: string }>) => void) => void
      }
    }
  ).hot
) {
  const hot = import.meta as unknown as {
    hot: {
      data: Record<string, unknown>
      accept: (deps: string[], cb: (mods: Array<{ default?: string }>) => void) => void
    }
  }
  hot.hot.data.styleElements = styleElements
  hot.hot.accept(['./styles.css?inline'], (mods: Array<{ default?: string }>) => {
    const nextCss: string = mods?.[0]?.default ?? ''
    for (const el of styleElements) {
      el.textContent = nextCss
    }
  })
}

// Function to prevent mobile zoom on tap
function preventMobileZoom() {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  // Check if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (!isMobile) return

  // Get or create viewport meta tag
  let viewport = document.querySelector('meta[name="viewport"]')

  if (!viewport) {
    // Create viewport meta tag if it doesn't exist
    viewport = document.createElement('meta')
    viewport.setAttribute('name', 'viewport')
    document.head.appendChild(viewport)
  }

  // Set content to prevent zoom
  const currentContent = viewport.getAttribute('content') || ''
  const settings: Record<string, string> = {}

  // Parse existing viewport settings
  currentContent.split(',').forEach(setting => {
    const [key, value] = setting.split('=').map(s => s.trim())
    if (key && value) {
      settings[key] = value
    }
  })

  // Update settings to prevent zoom
  settings['width'] = settings['width'] || 'device-width'
  settings['initial-scale'] = settings['initial-scale'] || '1.0'
  settings['maximum-scale'] = '1.0'
  settings['user-scalable'] = 'no'

  // Reconstruct content string
  const newContent = Object.entries(settings)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')

  viewport.setAttribute('content', newContent)
}

function enforceNoReferrerPolicy() {
  if (typeof document === 'undefined') return
  let referrerMeta = document.querySelector('meta[name="referrer"]')
  if (!referrerMeta) {
    referrerMeta = document.createElement('meta')
    referrerMeta.setAttribute('name', 'referrer')
    document.head.appendChild(referrerMeta)
  }
  referrerMeta.setAttribute('content', 'no-referrer')
}

// Function to bootstrap and mount the Vue.js application
export function bootstrap(shadowRoot: ShadowRoot, attributes: Record<string, unknown>) {
  // Prevent mobile zoom
  preventMobileZoom()
  enforceNoReferrerPolicy()

  // Create a container element within the shadow root
  const container = document.createElement('div')
  container.id = WIDGET_CONTAINER_ID
  // Teleport target for UI portals (e.g., tooltips) inside the widget's Shadow DOM
  ;(window as unknown as { __CUSTOMIZER_CONTAINER__?: HTMLElement }).__CUSTOMIZER_CONTAINER__ =
    container

  // Initialize Pinia and UI store early to manage viewport state
  const pinia = createPinia()
  const ui = useUIStore(pinia)
  const appStore = useAppStore(pinia)
  // Ensure app info is loaded before any store relies on prefixed storage keys
  appStore.loadAppInfoFromGlobalVariable()

  // Load auth state from localStorage on app start
  const authStore = useAuthStore(pinia)
  void authStore.ensureHydrated()

  // Set container height with responsive minimum heights from the UI store
  const setContainerHeight = () => {
    const minHeight = ui.minWidgetHeight

    // Set minHeight BEFORE measuring to ensure it's applied
    container.style.minHeight = `${minHeight}px`
    container.style.height = 'auto'
    container.classList.add('bg-accent')

    // Force a reflow to ensure styles are applied

    const rect = container.getBoundingClientRect()

    // If the actual height is less than minimum, force it to minimum
    const actualHeight = rect.height
    const finalHeight = actualHeight < minHeight ? minHeight : actualHeight

    // If we need to force the height, set it explicitly
    if (actualHeight < minHeight) {
      container.style.height = `${minHeight}px`
    }
    ui.setContainerSize(Math.round(rect.width), Math.round(finalHeight))
  }

  // Update height on window resize
  window.addEventListener('resize', setContainerHeight)

  shadowRoot.appendChild(container)

  // Inject CSS into shadow DOM
  const style = document.createElement('style')
  style.textContent = widgetStyles
  shadowRoot.appendChild(style)
  // Track for HMR live updates
  styleElements.add(style)

  // Set initial height AFTER CSS is injected
  setContainerHeight()

  // Set up the widget root with ResizeObserver
  ui.setWidgetRoot(container)

  // Fonts are loaded centrally in useBrandStyling; no shadowRoot font loading here

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
