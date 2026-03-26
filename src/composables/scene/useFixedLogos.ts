import { shallowRef, watch, type ShallowRef, type Ref } from 'vue'
import type { FabricImage, FabricObject, Canvas } from 'fabric'
import type { StyleLogoAsset, StyleLogoEntry } from '@/services/types/styles'
import type { OutputSvgGroupColor } from '@/services/products/types'

// ===== TYPES =====

/** Fabric transform for a fixed logo after load (2D vs 3D positioning). */
export type FixedLogoTransform = {
  left: number
  top: number
  angle: number
  /** 3D canvas passes flipX on the Fabric image. */
  flipX?: boolean
}

export type LoadImageFromURLFn = (
  url: string,
  fileExtension: string,
  optionsOverride?: Record<string, unknown>
) => Promise<FabricObject | FabricImage>

/** Geometry callbacks — same idea as position/rotation/scale params in useLogos. */
export type FixedLogoGeometry = {
  calculateTargetHeight: (logo: StyleLogoAsset) => number
  calculateTransform: (logo: StyleLogoAsset) => FixedLogoTransform
}

/** 3D extends FixedLogoGeometry with extra load options (flipX etc). */
export type FixedLogo3DGeometry = FixedLogoGeometry & {
  getImageLoadExtras: () => Record<string, unknown>
}

/** Options accepted by the low-level {@link addFixedLogoToCanvas} pure function. */
export type AddFixedLogoToCanvasOptions = {
  logo: StyleLogoAsset
  canvas: Canvas | null
  fixedLogoObjects: ShallowRef<Map<number, FabricObject>>
  loadImageFromURL: LoadImageFromURLFn
  calculateTargetHeight: (logo: StyleLogoAsset) => number
  calculateTransform: (logo: StyleLogoAsset) => FixedLogoTransform
  applyClipPath?: (img: FabricImage) => void | Promise<void>
  /** Extra Fabric load options (e.g. 3D passes flipX: true). */
  getImageLoadExtras?: () => Record<string, unknown>
  /**
   * Called after metadata is assigned — hook point for future color-customization
   * logic (filters, tint) without touching the core pipeline.
   */
  onObjectReady?: (obj: FabricObject, logo: StyleLogoAsset) => void
}

/** Config for the {@link useFixedLogos} composable. */
export type UseFixedLogosConfig = {
  canvas: ShallowRef<Canvas | null> | Ref<Canvas | null>
  loadImageFromURL: LoadImageFromURLFn
  applyClipPath?: (img: FabricImage) => void | Promise<void>
  geometry: FixedLogoGeometry
  /** Shared color groups list used by useColorCustomization (design + customizable fixed logos). */
  svgGroups: Ref<OutputSvgGroupColor[]>
  /** Initial color baseline list used by reset flows. */
  initialSvgGroups: Ref<OutputSvgGroupColor[]>
  /** Shared parts list used for default-color permutation/shuffle. */
  parts: Ref<string[]>
  /** Optional callback to sync updated svg groups to store (main preview front/back). */
  onSvgGroupsChanged?: (groups: OutputSvgGroupColor[]) => void
}

// ===== SOURCE LIST COMPUTATION =====

/**
 * Resolve fixed-style logos from props or active style (default groups only, filtered by side).
 * Shared by 2D and 3D scenes.
 */
export function computeFixedLogosList(params: {
  logosProp?: StyleLogoEntry[]
  styleLogoGroups?: StyleLogoEntry[] | null
  fixedLogoIndex?: number | null
  isFixedLogosAll?: boolean | null
  side: string | undefined
  /** '2d': strict side match. '3d': also allows side "3d". */
  mode: '2d' | '3d'
}): StyleLogoAsset[] {
  const { logosProp, styleLogoGroups, fixedLogoIndex, isFixedLogosAll, side, mode } = params

  const source = Array.isArray(logosProp) ? logosProp : (styleLogoGroups ?? [])

  const sideLower = side?.toLowerCase()

  return source.flatMap((group, index) => {
    const useIndexSelection = isFixedLogosAll === false
    const groupDefault = (group as { is_default?: boolean | 0 | 1 }).is_default
    const isGroupDefault = useIndexSelection
      ? index === Number(fixedLogoIndex ?? 0)
      : groupDefault === true || groupDefault === 1
    if (!isGroupDefault) return []
    const nested = Array.isArray(group.logos) && group.logos.length > 0 ? group.logos : [group]
    return nested.filter(logo => {
      const logoSide = logo.side?.toLowerCase()
      if (mode === '3d') return !sideLower || sideLower === '3d' || logoSide === sideLower
      return !sideLower || logoSide === sideLower
    })
  })
}

// ===== UTILITIES =====

export function getImageExtension(url: string): string {
  const clean = url.split('?')[0] ?? ''
  const ext = clean.split('.').pop()?.toLowerCase()
  return ext || 'png'
}

const baseStaticImageOptions: Record<string, unknown> = {
  hasControls: false,
  selectable: false,
  evented: false,
  lockMovementX: true,
  lockMovementY: true,
  originX: 'center',
  originY: 'center',
  globalCompositeOperation: 'source-atop'
}

// ===== LOW-LEVEL PURE FUNCTION =====

/**
 * Add one fixed logo to the canvas. Kept as a pure function for advanced use
 * (e.g. refreshing a single logo's color tint without a full reset).
 */
export async function addFixedLogoToCanvas(options: AddFixedLogoToCanvasOptions): Promise<void> {
  const {
    logo,
    canvas,
    fixedLogoObjects,
    loadImageFromURL,
    calculateTargetHeight,
    calculateTransform,
    applyClipPath,
    getImageLoadExtras,
    onObjectReady
  } = options

  if (!canvas || !logo?.url) return

  const ext = getImageExtension(logo.url)
  const loadExtras = getImageLoadExtras?.() ?? {}
  const obj = (await loadImageFromURL(`${logo.url}?nocache=11`, ext, {
    ...baseStaticImageOptions,
    ...loadExtras
  })) as FabricObject

  const targetHeight = calculateTargetHeight(logo)
  if (targetHeight > 0) obj.scaleToHeight(targetHeight)

  const { left, top, angle, flipX } = calculateTransform(logo)
  obj.set({ left, top, angle, ...(flipX !== undefined ? { flipX } : {}) })
  obj.setCoords()

  const logoId = Number(logo.id ?? fixedLogoObjects.value.size)
  Object.assign(obj, {
    fixed_logo_index: logoId,
    side: logo.side,
    type: 'fixed_logo',
    url: logo.url,
    is_customizable: logo.is_customizable,
    placement_title: logo.placement_title
  })

  onObjectReady?.(obj, logo)

  canvas.add(obj)
  fixedLogoObjects.value.set(logoId, obj)
  if (applyClipPath) await Promise.resolve(applyClipPath(obj as unknown as FabricImage))
}

// ===== GEOMETRY FACTORY HELPERS =====

/**
 * 2D geometry: height and x/y/angle from scale ratios.
 */
export function create2DFixedLogoGeometry(
  calculateScaleRatios: () => { widthRatio: number; heightRatio: number }
): FixedLogoGeometry {
  return {
    calculateTargetHeight: logo => Number(logo.height ?? 0) * calculateScaleRatios().heightRatio,
    calculateTransform: logo => {
      const { widthRatio, heightRatio } = calculateScaleRatios()
      const angleRaw = Number(logo.rotation ?? 0)
      return {
        left: widthRatio * Number(logo.x_axis ?? 0),
        top: heightRatio * Number(logo.y_axis ?? 0),
        angle: angleRaw < 0 ? 360 - angleRaw : angleRaw
      }
    }
  }
}

/**
 * 3D geometry: UV mapping via findPositionOn3D + oppositeAngle; raster load uses flipX.
 */
export function create3DFixedLogoGeometry(options: {
  getCanvasWidthRatio: () => number
  getCanvasHeightRatio: () => number
  findPositionOn3D: (x: number, y: number, side: 'front' | 'back') => { x: number; y: number }
  oppositeAngle: (angle: number) => number
}): FixedLogo3DGeometry {
  const { getCanvasWidthRatio, getCanvasHeightRatio, findPositionOn3D, oppositeAngle } = options
  return {
    calculateTargetHeight: logo => Number(logo.height ?? 0) / (getCanvasHeightRatio() || 1),
    calculateTransform: logo => {
      const side: 'front' | 'back' = logo.side?.toLowerCase() === 'back' ? 'back' : 'front'
      const fabricPoint = findPositionOn3D(
        getCanvasWidthRatio() * Number(logo.x_axis ?? 0),
        getCanvasHeightRatio() * Number(logo.y_axis ?? 0),
        side
      )
      const rotation = Number(logo.rotation ?? 0)
      return {
        left: fabricPoint.x,
        top: fabricPoint.y,
        angle: rotation < 0 ? oppositeAngle(360 - rotation) : oppositeAngle(rotation),
        flipX: true
      }
    },
    getImageLoadExtras: () => ({ flipX: true })
  }
}

// ===== COMPOSABLE =====

/**
 * Owns the fixed-logo Fabric map. Scene calls:
 *   const { fixedLogoObjects, addFixedLogo, resetAndAddFixedLogos } = useFixedLogos({ canvas, ... })
 *
 * addFixedLogo — add one logo (useful if scene needs post-render between adds).
 * resetAndAddFixedLogos(logos) — clear map and re-add all; scene handles its own onAfterAll.
 */
export function useFixedLogos(config: UseFixedLogosConfig) {
  const fixedLogoObjects = shallowRef<Map<number, FabricObject>>(new Map())
  const fixedLogoInitialColors = shallowRef<Map<number, string>>(new Map())

  type FixedLogoMeta = FabricObject & {
    fixed_logo_group_id?: string
    fixed_logo_customizable?: boolean
    _objects?: Array<{ fill?: string }>
    fill?: string
  }

  function resolveGroupId(value: string | undefined): string {
    return (value || '').trim()
  }

  function readObjectBaseColor(obj: FixedLogoMeta): string {
    const grouped = obj._objects
    if (Array.isArray(grouped) && grouped.length > 0) {
      const firstFill = grouped.find(o => typeof o.fill === 'string')?.fill
      if (typeof firstFill === 'string' && firstFill) return firstFill
    }
    return typeof obj.fill === 'string' && obj.fill ? obj.fill : '#000000'
  }

  function upsertCustomizableGroup(groupId: string, color: string): void {
    if (!groupId) return
    if (!config.parts.value.includes(groupId)) {
      config.parts.value.push(groupId)
    }
    if (!config.svgGroups.value.some(g => g.id === groupId)) {
      config.svgGroups.value.push({
        id: groupId,
        color,
        pantone: '',
        name: '',
        count: 1
      })
    }
    if (!config.initialSvgGroups.value.some(g => g.id === groupId)) {
      config.initialSvgGroups.value.push({
        id: groupId,
        color,
        pantone: '',
        name: '',
        count: 1
      })
    }
    config.onSvgGroupsChanged?.(config.svgGroups.value)
  }

  function applyFixedLogoColorFromSvgGroup(obj: FixedLogoMeta): void {
    if (!obj.fixed_logo_customizable || !obj.fixed_logo_group_id) return
    const svgGroup = config.svgGroups.value.find(g => g.id === obj.fixed_logo_group_id)
    if (!svgGroup) return
    const color = svgGroup.gradient_colors?.[0]?.color || svgGroup.color
    if (!color) return
    if (Array.isArray(obj._objects) && obj._objects.length > 0) {
      obj._objects.forEach(item => {
        ;(item as unknown as { set?: (k: string, v: string) => void }).set?.('fill', color)
      })
    } else {
      obj.set('fill', color)
    }
  }

  function applyFixedLogoColorsFromSvgGroups(): void {
    fixedLogoObjects.value.forEach(obj => {
      applyFixedLogoColorFromSvgGroup(obj as FixedLogoMeta)
      ;(obj as FixedLogoMeta).setCoords?.()
    })
    config.canvas.value?.requestRenderAll()
  }

  watch(
    config.svgGroups,
    () => {
      applyFixedLogoColorsFromSvgGroups()
    },
    { deep: true }
  )

  async function addFixedLogo(logo: StyleLogoAsset): Promise<void> {
    await addFixedLogoToCanvas({
      logo,
      canvas: config.canvas.value,
      fixedLogoObjects,
      loadImageFromURL: config.loadImageFromURL,
      calculateTargetHeight: config.geometry.calculateTargetHeight,
      calculateTransform: config.geometry.calculateTransform,
      getImageLoadExtras: (config.geometry as FixedLogo3DGeometry).getImageLoadExtras,
      applyClipPath: config.applyClipPath,
      onObjectReady: obj => {
        const meta = obj as FixedLogoMeta
        const customizable = Boolean(logo.is_customizable)
        meta.fixed_logo_customizable = customizable
        meta.fixed_logo_group_id = resolveGroupId(logo.placement_title)
        const baseColor = readObjectBaseColor(meta)
        fixedLogoInitialColors.value.set(Number(logo.id ?? fixedLogoObjects.value.size), baseColor)
        if (customizable && meta.fixed_logo_group_id) {
          upsertCustomizableGroup(meta.fixed_logo_group_id, baseColor)
        }
      }
    })
  }

  async function resetAndAddFixedLogos(logos: StyleLogoAsset[]): Promise<void> {
    const cv = config.canvas.value
    if (!cv) return
    fixedLogoObjects.value.forEach(obj => cv.remove(obj))
    fixedLogoObjects.value.clear()
    fixedLogoInitialColors.value.clear()
    cv.requestRenderAll()
    for (const logo of logos) {
      if (!logo?.url) continue
      await addFixedLogo(logo)
    }
    applyFixedLogoColorsFromSvgGroups()
  }

  return {
    fixedLogoObjects,
    addFixedLogo,
    resetAndAddFixedLogos,
    applyFixedLogoColorsFromSvgGroups
  }
}
