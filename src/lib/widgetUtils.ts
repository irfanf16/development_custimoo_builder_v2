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
 * Apply widget color scheme to a container element
 */
// applyWidgetColors is deprecated in favor of useBrandStyling.applyBrandStyling

/**
 * Get widget container element
 */
export function getWidgetContainer(): HTMLElement | null {
  return document.querySelector(`#${WIDGET_CONTAINER_ID}`)
}

/**
 * Check if we're in widget mode
 */
export function isWidgetMode(): boolean {
  return document.querySelector(WIDGET_ELEMENT_SELECTOR) !== null
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
