import { bootstrap } from './bootstrap'
import { getHostTheme } from './lib/hostThemes'

// Preload fonts for the current host
const hostTheme = getHostTheme()
if (hostTheme?.fontFamilyDefault || hostTheme?.fontFamilyHeading) {
  const fontsToLoad = []
  if (hostTheme.fontFamilyDefault) fontsToLoad.push(hostTheme.fontFamilyDefault)
  if (hostTheme.fontFamilyHeading) fontsToLoad.push(hostTheme.fontFamilyHeading)

  fontsToLoad.forEach(font => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
    document.head.appendChild(link)

    // Also load the actual stylesheet
    const styleLink = document.createElement('link')
    styleLink.rel = 'stylesheet'
    styleLink.href = link.href
    document.head.appendChild(styleLink)
  })
}

// Define the custom element for embedded widget (primary mode)
customElements.define(
  'customizer-widget',
  class extends HTMLElement {
    connectedCallback() {
      // Create a shadow DOM for encapsulation
      const shadowRoot = this.attachShadow({ mode: 'open' })

      // CSS will be injected by bootstrap.ts

      // Fetch widget attributes to pass as properties for App.vue
      const attributes = {
        date: this.getAttribute('date'),
        title: this.getAttribute('title'),
        end: this.getAttribute('end'),
        color: this.getAttribute('color'),
        secondaryColor: this.getAttribute('secondary-color'),
        theme: this.getAttribute('theme'),
        mode: this.getAttribute('mode'),
        showNavigation: this.getAttribute('show-navigation') !== 'false'
      }

      // Bootstrap the Vue.js application within the shadow DOM
      bootstrap(shadowRoot, attributes)
    }
  }
)
