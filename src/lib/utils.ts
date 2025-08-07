import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Load Google Font dynamically
 */
export function loadGoogleFont(fontFamily: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if font is already loaded by testing with a real element
    const testElement = document.createElement('div')
    testElement.style.fontFamily = fontFamily
    testElement.style.position = 'absolute'
    testElement.style.visibility = 'hidden'
    testElement.style.fontSize = '20px'
    testElement.textContent = 'Test'
    document.body.appendChild(testElement)

    const originalFont = getComputedStyle(testElement).fontFamily

    // If the font is already loaded and working, resolve immediately
    if (
      originalFont.includes(fontFamily) &&
      !originalFont.includes('fallback')
    ) {
      document.body.removeChild(testElement)
      resolve()
      return
    }

    // Remove test element
    document.body.removeChild(testElement)

    // Create link element for Google Fonts
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`

    link.onload = () => {
      // Create a new test element to verify the font loaded
      const verifyElement = document.createElement('div')
      verifyElement.style.fontFamily = fontFamily
      verifyElement.style.position = 'absolute'
      verifyElement.style.visibility = 'hidden'
      verifyElement.style.fontSize = '20px'
      verifyElement.textContent = 'Test'
      document.body.appendChild(verifyElement)

      // Wait for fonts to be ready
      document.fonts.ready.then(() => {
        const newFont = getComputedStyle(verifyElement).fontFamily

        // Check if the font actually changed
        if (newFont.includes(fontFamily)) {
          document.body.removeChild(verifyElement)
          resolve()
        } else {
          document.body.removeChild(verifyElement)
          reject(new Error(`Font ${fontFamily} failed to load`))
        }
      })
    }

    link.onerror = () => {
      reject(new Error(`Failed to load font CSS: ${fontFamily}`))
    }

    // Append to main document head
    document.head.appendChild(link)
  })
}

/**
 * Get font family CSS value
 */
export function getFontFamilyCSS(fontFamily: string): string {
  // Handle fonts with spaces - always wrap in quotes for consistency
  return `"${fontFamily}", ui-sans-serif, system-ui, sans-serif`
}
