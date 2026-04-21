import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OutputFont, OutputFontFile } from '@/services/products/types'
import type { ProductsFonts } from '@/composables/scene/useTextAsPath'

/**
 * Global store for product fonts loaded via opentype.js.
 * Fonts are loaded once and cached so we don't load them again and again.
 * Use initFromProducts() when products are available (e.g. from products store or API).
 *
 * Example (e.g. in a view or after loading product details):
 *   const productsFontsStore = useProductsFontsStore()
 *   const productsStore = useProductsStore()
 *   const storageUrl = import.meta.env.VITE_APP_STORAGE_URL || ''
 *   await productsFontsStore.initFromProducts(
 *     productsStore.activeProductDetails ? [productsStore.activeProductDetails] : [],
 *     storageUrl
 *   )
 * Then pass productsFontsStore.productsFonts to addTextToCanvas({ useTextAsPath: true, productsFonts: productsFontsStore.productsFonts }).
 */
export const useProductsFontsStore = defineStore('productsFonts', () => {
  const fontsMap = ref<ProductsFonts>({})

  /** ProductsFonts map for use with createTextAsPathFromFonts / addTextToCanvas productsFonts option. */
  const productsFonts = computed<ProductsFonts>(() => fontsMap.value)

  function getFontKey(file: OutputFontFile): string {
    const parts = file.path.split('/')
    const last = parts[parts.length - 1] ?? file.name
    const withoutExt = last.replace(/\.[^.]+$/, '')
    return withoutExt || file.name
  }

  /**
   * Load a single font from URL with opentype.js. Returns the opentype Font or null.
   */
  function loadFont(url: string): Promise<unknown> {
    return new Promise(resolve => {
      import('opentype.js')
        .then(opentype => {
          opentype.default.load(url, (err: Error | null, font: unknown) => {
            if (!err && font) {
              resolve(font)
            } else {
              resolve(null)
            }
          })
        })
        .catch(() => resolve(null))
    })
  }

  /**
   * Initialize fonts from product list (same structure as old Home.vue initProductsFonts).
   * Skips already-loaded font keys so we don't load again.
   * @param products - Array of products with namefonts (e.g. from products store)
   * @param storageUrl - Base URL for font paths (e.g. process.env.VITE_STORAGE_URL or API base)
   */
  async function initFromProducts(
    products: Array<{ namefonts?: OutputFont[] }>,
    storageUrl: string
  ): Promise<void> {
    const base = storageUrl.replace(/\/?$/, '')
    const promises: Promise<void>[] = []

    for (const product of products) {
      const namefonts = product.namefonts ?? []
      if (namefonts.length === 0) continue

      const first = namefonts[0]
      const items = first?.json_data ?? []
      for (const font of items) {
        const key = getFontKey(font)
        if (fontsMap.value[key]?.opentype_font) continue

        const url = `${base}/${font.path.replace(/^\//, '')}?nocache=11`
        const fontPromise = loadFont(url).then(async fontObj => {
          if (fontObj) {
            const fullUrl = `${base}/${font.path.replace(/^\//, '')}`
            fontsMap.value = {
              ...fontsMap.value,
              [key]: {
                url: fullUrl,
                opentype_font: fontObj as ProductsFonts[string]['opentype_font']
              }
            }

            // Inject @font-face CSS so the 2D canvas (Fabric FabricText) can use
            // the font via ctx.font. Same approach as FontSelector.vue but runs
            // at store init time — before any canvas renders — so there's no FOUT.
            if (!document.head.querySelector(`style[data-font-key="${key}"]`)) {
              const style = document.createElement('style')
              style.setAttribute('data-font-key', key)
              style.textContent = `@font-face { font-family: '${key}'; src: url('${fullUrl}') format('truetype'); font-display: swap; }`
              document.head.appendChild(style)
            }

            // Wait for the browser to actually download the font file.
            // Registering @font-face only tells the browser where to get the font —
            // the download starts lazily on first use. Without this await, the 2D
            // canvas draws text before the download completes and bakes in the
            // fallback font. Size (16px) is arbitrary — document.fonts.load() uses
            // family+weight+style for cache lookup, not size.
            try {
              await document.fonts.load(`16px "${key}"`)
            } catch {
              // non-fatal — canvas will fall back to system font if load fails
            }
          }
        })
        promises.push(fontPromise)
      }
    }

    await Promise.all(promises)
  }

  /** Clear all cached fonts (e.g. on logout or product change). */
  function clear(): void {
    fontsMap.value = {}
  }

  return {
    productsFonts,
    initFromProducts,
    loadFont,
    clear
  }
})
