import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CanvasSide } from '@/stores/workflow/workflow.store.types'
import type { GetImageFromCanvasOptions } from '@/composables/scene/useCanvasImage'

type TwoDSceneRef = {
  getImageFromCanvas: () => Promise<string>
} | null
type ThreeDSceneRef = {
  getImageFromCanvas: (side?: CanvasSide, options?: GetImageFromCanvasOptions) => Promise<string>
} | null
export type OtherSideLogo = {
  logo_index: number
  url: string
  side: 'front' | 'back'
  left: number
  top: number
  flipX?: boolean
  flipY?: boolean
  scaleX?: number
  scaleY?: number
  rotation?: number
  excluded_clip_id?: string
}

export type OtherSideText = {
  customTextIndex: number
  itemIndex: number
  side: 'front' | 'back'
  left: number
  top: number
  rotation?: number
  scaleX?: number
  scaleY?: number
}
/**
 * Store for scene component references
 * Used to access mainPreview scene components globally
 */
export const useSceneStore = defineStore('sceneStore', () => {
  // Component references
  const threeDSceneRef = ref<ThreeDSceneRef | null>(null)
  const twoDSceneFrontRef = ref<TwoDSceneRef | null>(null)
  const twoDSceneBackRef = ref<TwoDSceneRef | null>(null)
  // Mirrored logos per side, keyed by logo_index
  const otherSideFront = ref<Record<number, OtherSideLogo>>({})
  const otherSideBack = ref<Record<number, OtherSideLogo>>({})
  // Mirrored texts per side, keyed by `${customTextIndex}_${itemIndex}`
  const otherSideFrontTexts = ref<Record<string, OtherSideText>>({})
  const otherSideBackTexts = ref<Record<string, OtherSideText>>({})

  /**
   * Set 3D scene reference
   */
  function setThreeDSceneRef(ref: ThreeDSceneRef | null) {
    threeDSceneRef.value = ref
  }

  /**
   * Set 2D scene reference (front or back)
   */
  function setTwoDSceneRef(ref: TwoDSceneRef | null, side: 'front' | 'back') {
    if (side === 'front') {
      twoDSceneFrontRef.value = ref
    } else {
      twoDSceneBackRef.value = ref
    }
  }

  /**
   * Get 2D scene reference by side
   */
  function getTwoDSceneRef(side: 'front' | 'back'): TwoDSceneRef | null {
    return side === 'front' ? twoDSceneFrontRef.value : twoDSceneBackRef.value
  }

  /**
   * Store a mirrored logo for the opposite side.
   */
  function addOtherSideLogo(logo: OtherSideLogo) {
    const target = logo.side === 'front' ? otherSideFront : otherSideBack
    target.value[logo.logo_index] = logo
  }

  function getOtherSideLogos(side: 'front' | 'back'): OtherSideLogo[] {
    const source = side === 'front' ? otherSideFront.value : otherSideBack.value
    return Object.values(source)
  }

  function removeOtherSideLogo(side: 'front' | 'back', logoIndex: number) {
    const target = side === 'front' ? otherSideFront : otherSideBack
    delete target.value[logoIndex]
  }

  function clearOtherSideLogos(side: 'front' | 'back') {
    if (side === 'front') {
      otherSideFront.value = {}
    } else {
      otherSideBack.value = {}
    }
  }
  function resetSceneStore() {
    threeDSceneRef.value = null
    twoDSceneFrontRef.value = null
    twoDSceneBackRef.value = null
    otherSideFront.value = {}
    otherSideBack.value = {}
  }

  function getOtherSideTextKey(customTextIndex: number, itemIndex: number): string {
    return `${customTextIndex}_${itemIndex}`
  }

  function addOtherSideText(text: OtherSideText) {
    const key = getOtherSideTextKey(text.customTextIndex, text.itemIndex)
    const target = text.side === 'front' ? otherSideFrontTexts : otherSideBackTexts
    target.value[key] = text
  }

  function getOtherSideTexts(side: 'front' | 'back'): OtherSideText[] {
    const source = side === 'front' ? otherSideFrontTexts.value : otherSideBackTexts.value
    return Object.values(source)
  }

  function removeOtherSideText(side: 'front' | 'back', customTextIndex: number, itemIndex: number) {
    const key = getOtherSideTextKey(customTextIndex, itemIndex)
    const target = side === 'front' ? otherSideFrontTexts : otherSideBackTexts
    delete target.value[key]
  }

  function clearOtherSideTexts(side: 'front' | 'back') {
    if (side === 'front') {
      otherSideFrontTexts.value = {}
    } else {
      otherSideBackTexts.value = {}
    }
  }

  return {
    threeDSceneRef,
    twoDSceneFrontRef,
    twoDSceneBackRef,
    otherSideFront,
    otherSideBack,
    setThreeDSceneRef,
    setTwoDSceneRef,
    getTwoDSceneRef,
    addOtherSideLogo,
    removeOtherSideLogo,
    getOtherSideLogos,
    clearOtherSideLogos,
    addOtherSideText,
    getOtherSideTexts,
    removeOtherSideText,
    clearOtherSideTexts,
    getOtherSideTextKey,
    resetSceneStore
  }
})
