import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Load Google Font dynamically
 */
export function loadGoogleFont(
  fontFamily: string,
  url?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const family = fontFamily.trim()
      const quoted = /\s/.test(family) ? `"${family}"` : family

      // If already loaded, resolve early
      const fontsApi = (document as any).fonts
      if (fontsApi?.check && fontsApi.check(`1em ${quoted}`)) {
        resolve()
        return
      }

      // Avoid duplicate links
      const existing = Array.from(
        document.querySelectorAll('link[rel="stylesheet"]')
      ).some(l =>
        url
          ? l.getAttribute('href') === url
          : (l.getAttribute('href') || '').includes(
              `family=${family.replace(/\s+/g, '+')}`
            )
      )
      if (!existing) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = url
          ? url
          : `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
        link.onerror = () =>
          reject(new Error(`Failed to load font CSS: ${family}`))
        document.head.appendChild(link)
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timed out loading font: ${family}`))
      }, 7000)

      const wait = fontsApi?.load
        ? Promise.all([
            fontsApi.load(`1em ${quoted}`),
            fontsApi.load(`700 1em ${quoted}`).catch(() => Promise.resolve([]))
          ])
        : new Promise<void>(res => setTimeout(res, 300))

      wait
        .then(() => {
          clearTimeout(timeout)
          resolve()
        })
        .catch(err => {
          clearTimeout(timeout)
          reject(err)
        })
    } catch (err) {
      reject(err as Error)
    }
  })
}

/**
 * Get font family CSS value
 */
export function getFontFamilyCSS(fontFamily: string): string {
  // Handle fonts with spaces - always wrap in quotes for consistency
  return `"${fontFamily}", ui-sans-serif, system-ui, sans-serif`
}
