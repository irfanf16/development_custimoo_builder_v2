import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ensure a generic link tag exists */
function ensureLink(rel: string, href: string, crossOrigin?: string): void {
  try {
    const exists = Array.from(
      document.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`)
    ).some(l => l.href === href)
    if (!exists) {
      const link = document.createElement('link')
      link.rel = rel
      link.href = href
      if (crossOrigin) link.crossOrigin = crossOrigin
      document.head.appendChild(link)
    }
  } catch (_) {}
}

/** Ensure a stylesheet link with the given href exists in document.head */
export function ensureStylesheet(href: string): void {
  try {
    const exists = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    ).some(l => l.href === href)
    if (!exists) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    }
  } catch (_) {}
}

/**
 * Load Google Font dynamically
 */
function loadFont(url: string, fontFamily: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      ensureLink('preconnect', 'https://fonts.googleapis.com')
      ensureLink('preconnect', 'https://fonts.gstatic.com', 'anonymous')
      ensureStylesheet(url)

      const timeout = setTimeout(() => {
        reject(new Error(`Timed out loading font: ${fontFamily}`))
      }, 7000)

      const fontsApi = (
        document as unknown as {
          fonts?: { load?: (desc: string) => Promise<unknown> }
        }
      ).fonts
      const wait = fontsApi?.load
        ? Promise.all([
            fontsApi.load(`1em "${fontFamily}"`),
            fontsApi.load(`700 1em "${fontFamily}"`).catch(() => Promise.resolve([]))
          ])
        : new Promise<void>(res => setTimeout(res, 300))

      wait
        .then(() => {
          clearTimeout(timeout)
          resolve()
        })
        .catch(err => {
          clearTimeout(timeout)
          reject(err as Error)
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

export function loadCustomFont(url: string, fontFamily: string): Promise<void> {
  const storageBase = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''

  const fileExt = url.split('.').pop()
  let fontFormat = ''
  if (fileExt === 'woff2') {
    fontFormat = 'woff2'
  } else if (fileExt === 'woff') {
    fontFormat = 'woff'
  }

  const style = document.createElement('style')
  style.textContent = `
      @font-face {
        font-family: '${fontFamily}';
        src: url('${storageBase + url}') format('${fontFormat}');
        font-display: swap;
      }
    `
  document.head.appendChild(style)
  return loadFont(url, fontFamily)
}

export function loadGoogleFont(fontFamily: string): Promise<void> {
  const family = fontFamily.trim()
  // Always ensure stylesheet link exists (no early exit)
  const href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
  return loadFont(href, fontFamily)
}
