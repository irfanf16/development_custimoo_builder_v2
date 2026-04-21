/**
 * Widget-specific utility functions
 */

/**
 * Widget element selector (custom element tag name)
 */
export const WIDGET_ELEMENT_SELECTOR = 'v-customizer'

/**
 * Widget container element ID
 */
export const WIDGET_CONTAINER_ID = 'v-customizer-container'

/**
 * Theme classes on the host / shadow root (not generic `light`/`dark`, which collide with host CSS).
 */
export const WIDGET_THEME_CLASS_LIGHT = 'custimoo-theme-light'
export const WIDGET_THEME_CLASS_DARK = 'custimoo-theme-dark'

const WIDGET_THEME_CLASSES_LEGACY = ['light', 'dark'] as const

export function stripWidgetThemeClasses(el: HTMLElement) {
  el.classList.remove(
    WIDGET_THEME_CLASS_LIGHT,
    WIDGET_THEME_CLASS_DARK,
    ...WIDGET_THEME_CLASSES_LEGACY
  )
}

/**
 * Apply widget color scheme to a container element
 */
// applyWidgetColors is deprecated in favor of useBrandStyling.applyBrandStyling

declare global {
  interface Window {
    /** Set in bootstrap for Shadow DOM; document query APIs do not pierce shadow roots. */
    __CUSTOMIZER_CONTAINER__?: HTMLElement
  }
}

/**
 * Widget root div used for branding CSS variables and app mount target.
 * Prefer `window.__CUSTOMIZER_CONTAINER__` when the app runs inside a shadow root.
 */
export function resolveWidgetBrandingRoot(): HTMLElement | null {
  if (typeof window === 'undefined') return null
  if (window.__CUSTOMIZER_CONTAINER__) return window.__CUSTOMIZER_CONTAINER__
  return document.querySelector(`#${WIDGET_CONTAINER_ID}`)
}

/**
 * Get widget container element
 */
export function getWidgetContainer(): HTMLElement | null {
  return resolveWidgetBrandingRoot()
}

/**
 * Check if we're in widget mode
 */
export function isWidgetMode(): boolean {
  return document.querySelector(WIDGET_ELEMENT_SELECTOR) !== null
}

/**
 * Whether the History API (replaceState/pushState) can be used safely.
 * In an iframe with srcdoc the document URL is 'about:srcdoc', and the browser
 * throws SecurityError when trying to set history state to another URL (e.g. parent's).
 * Use memory history and avoid replaceState in that case.
 */
export function canUseHistoryApi(): boolean {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return false
  const url = window.location.href
  return url !== 'about:srcdoc' && !url.startsWith('about:')
}

const getWindowObject = () => {
  try {
    return window.parent
  } catch (error) {
    console.info('Error while getting window object', error)
    return window
  }
}

export const getCustomizerIframe = (): HTMLIFrameElement | null => {
  const iframes = getWindowObject().document.querySelectorAll('iframe')
  let customizer_iframe: HTMLIFrameElement | null = null
  Array.from(iframes).forEach(iframe => {
    // Narrow type to HTMLIFrameElement
    if (!(iframe instanceof HTMLIFrameElement)) return
    const get_customizer = iframe.contentDocument?.querySelector('v-customizer')
    if (get_customizer) {
      customizer_iframe = iframe
    }
  })
  return customizer_iframe
}

/**
 * Widget-specific Tailwind classes
 */
export const widgetClasses = {
  container: 'widget-theme font-sans border rounded-lg p-4 w-full min-h-[400px]',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
  muted: 'bg-muted text-muted-foreground',
  background: 'bg-background text-foreground',
  border: 'border-border',
  input: 'bg-input border-border text-foreground',
  ring: 'ring-ring'
} as const

/**
 * Create widget-specific CSS class names
 */
export function createWidgetClass(baseClass: string, variant?: keyof typeof widgetClasses): string {
  if (variant) {
    return `${baseClass} ${widgetClasses[variant]}`
  }
  return `${baseClass} widget-theme`
}
