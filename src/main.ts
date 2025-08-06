import { bootstrap } from './bootstrap'

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
