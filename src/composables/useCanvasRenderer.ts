import { ref, type Ref } from 'vue'
import type { CustomLogo } from '@/services/logos/types'

/**
 * Result of comparing current and previous logo states
 */
export interface LogoDiffResult {
  added: CustomLogo[]
  updated: CustomLogo[]
  removed: string[]
}

/**
 * Parsed components of a render version string
 */
export interface ParsedRenderVersion {
  id: string
  logosMeta: string
  logosGeometry: string
  groups: string
}

/**
 * Options for applying incremental logo updates
 */
export interface ApplyLogoUpdatesOptions {
  previousLogoState: Ref<Map<string, CustomLogo>>
  logos: CustomLogo[]
  addLogoLayer: (logo: CustomLogo) => Promise<unknown>
  removeLogoLayer: (id: string) => void
  replaceLogoTexture: (id: string, url: string) => Promise<unknown>
  updateLogoLayerGeometry: (logo: CustomLogo) => void
}

/**
 * Utility: Parse a render version string into its components
 */
export function parseRenderVersion(version: string): ParsedRenderVersion {
  const [id = '', logosMeta = '', logosGeometry = '', groups = ''] = version.split('|')
  return {
    id,
    logosMeta,
    logosGeometry,
    groups
  }
}

/**
 * Utility: Filter logos by side (front or back)
 */
export function filterLogosBySide(logos: CustomLogo[], side: 'front' | 'back'): CustomLogo[] {
  return logos.filter(logo => logo.side === side)
}

/**
 * Utility: Filter logos by opposite side (for small preview)
 */
export function filterLogosByOppositeSide(
  logos: CustomLogo[],
  currentSide: 'front' | 'back'
): CustomLogo[] {
  const targetSide = currentSide === 'front' ? 'back' : 'front'
  return logos.filter(logo => logo.side === targetSide)
}

/**
 * Compare current and previous logo states to detect changes
 */
export function getLogoDiffs(
  previousLogoState: Ref<Map<string, CustomLogo>>,
  nextLogos: CustomLogo[]
): LogoDiffResult {
  const added: CustomLogo[] = []
  const updated: CustomLogo[] = []
  const removed: string[] = []

  const previous = previousLogoState.value
  const nextMap = new Map<string, CustomLogo>()

  for (const logo of nextLogos) {
    const key = String(logo.id)
    nextMap.set(key, logo)
    const prev = previous.get(key)

    if (!prev) {
      added.push(logo)
      continue
    }

    // Check if any logo properties changed
    if (
      prev.url !== logo.url ||
      prev.rotation !== logo.rotation ||
      prev.width !== logo.width ||
      prev.height !== logo.height ||
      prev.x_axis !== logo.x_axis ||
      prev.y_axis !== logo.y_axis ||
      prev.scaleX !== logo.scaleX ||
      prev.scaleY !== logo.scaleY ||
      prev.side !== logo.side ||
      prev.name_of_placement !== logo.name_of_placement
    ) {
      updated.push(logo)
    }
  }

  // Find removed logos
  for (const [id] of previous) {
    if (!nextMap.has(id)) {
      removed.push(id)
    }
  }

  // Update the state with the new logo map
  previousLogoState.value = nextMap
  return { added, updated, removed }
}

/**
 * Apply incremental logo updates to the canvas
 * Handles added, updated, and removed logos efficiently
 */
export async function applyIncrementalLogoUpdates(options: ApplyLogoUpdatesOptions): Promise<void> {
  const {
    previousLogoState,
    logos,
    addLogoLayer,
    removeLogoLayer,
    replaceLogoTexture,
    updateLogoLayerGeometry
  } = options

  // CRITICAL: Capture previous URLs BEFORE getLogoDiffs updates the state
  const previousUrls = new Map<string, string>()
  for (const logo of logos) {
    const prev = previousLogoState.value.get(String(logo.id))
    if (prev) {
      previousUrls.set(String(logo.id), prev.url)
    }
  }

  const { added, updated, removed } = getLogoDiffs(previousLogoState, logos)

  // Remove logos that no longer exist
  for (const id of removed) {
    removeLogoLayer(id)
  }

  // Add new logos
  for (const logo of added) {
    await addLogoLayer(logo).catch(err => console.warn('Failed to add logo:', err))
  }

  // Update existing logos (geometry and/or texture)
  for (const logo of updated) {
    const prevUrl = previousUrls.get(String(logo.id))

    // If URL changed, replace the texture
    if (prevUrl && prevUrl !== logo.url) {
      await replaceLogoTexture(String(logo.id), logo.url)
    }

    // Always update geometry for changed logos
    updateLogoLayerGeometry(logo)
  }
}

/**
 * Composable: Provides a render queue mechanism to prevent overlapping renders
 * Returns a wrapper function that ensures only one render happens at a time
 */
export function useRenderQueue() {
  let renderInFlight = false
  let renderQueued = false

  /**
   * Wraps a render function with queue management
   * @param renderFn - The async render function to execute
   * @param onError - Optional error handler
   */
  async function queuedRender(
    renderFn: () => Promise<void>,
    onError?: (error: unknown) => void
  ): Promise<void> {
    if (renderInFlight) {
      renderQueued = true
      return
    }

    renderInFlight = true

    try {
      await renderFn()
    } catch (error) {
      if (onError) {
        onError(error)
      } else {
        console.error('Render error:', error)
      }
    } finally {
      renderInFlight = false

      if (renderQueued) {
        renderQueued = false
        queueMicrotask(() => void queuedRender(renderFn, onError))
      }
    }
  }

  return {
    queuedRender
  }
}

/**
 * Composable: Manages previous logo state tracking
 */
export function usePreviousLogoState() {
  const previousLogoState = ref(new Map<string, CustomLogo>())

  function reset() {
    previousLogoState.value = new Map()
  }

  function setFromLogos(logos: CustomLogo[]) {
    previousLogoState.value = new Map(logos.map(logo => [String(logo.id), logo]))
  }

  return {
    previousLogoState,
    reset,
    setFromLogos
  }
}
