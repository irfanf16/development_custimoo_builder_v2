/**
 * Host pages often set `html { font-size: 10px }` (or 62.5%). In CSS, `rem` still resolves to the
 * document root even for nodes inside an open shadow tree, so Tailwind `rem`-based utilities shrink.
 *
 * We do **not** inject rules into `document.head` / `html` (that breaks host sites). Instead we
 * apply `zoom` on the widget container **inside the shadow root** so only our subtree scales.
 *
 * When the host root font-size is already normal (or larger for a11y), we leave `zoom` unset.
 */
const TARGET_ROOT_FONT_PX = 16
/** Below this computed `html` font-size we treat the page as using a "compressed rem" hack. */
const MIN_HOST_ROOT_FONT_BEFORE_COMPENSATE = 15.5

export function installHostRootFontCompensation(target: HTMLElement): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}
  }

  const apply = () => {
    const fs = parseFloat(getComputedStyle(document.documentElement).fontSize)
    if (!Number.isFinite(fs) || fs <= 0) {
      target.style.removeProperty('zoom')
      return
    }
    if (fs >= MIN_HOST_ROOT_FONT_BEFORE_COMPENSATE) {
      target.style.removeProperty('zoom')
      return
    }
    const ratio = TARGET_ROOT_FONT_PX / fs
    if (Math.abs(ratio - 1) < 0.02) {
      target.style.removeProperty('zoom')
      return
    }
    target.style.zoom = String(ratio)
  }

  apply()

  window.addEventListener('resize', apply)

  const mo = new MutationObserver(apply)
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'class', 'lang']
  })

  let fontsListener: (() => void) | undefined
  if (document.fonts?.addEventListener) {
    const onFonts = () => apply()
    document.fonts.addEventListener('loadingdone', onFonts)
    fontsListener = () => document.fonts?.removeEventListener('loadingdone', onFonts)
  }

  return () => {
    window.removeEventListener('resize', apply)
    mo.disconnect()
    fontsListener?.()
    target.style.removeProperty('zoom')
  }
}
