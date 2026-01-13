import { defineStore } from 'pinia'
import { ref } from 'vue'
type TwoDSceneRef = {
  getImageFromCanvas: () => string
} | null
type ThreeDSceneRef = {
  getImageFromCanvas: () => string
} | null
/**
 * Store for scene component references
 * Used to access mainPreview scene components globally
 */
export const useSceneStore = defineStore('sceneStore', () => {
  // Component references
  const threeDSceneRef = ref<ThreeDSceneRef | null>(null)
  const twoDSceneFrontRef = ref<TwoDSceneRef | null>(null)
  const twoDSceneBackRef = ref<TwoDSceneRef | null>(null)

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

  return {
    threeDSceneRef,
    twoDSceneFrontRef,
    twoDSceneBackRef,
    setThreeDSceneRef,
    setTwoDSceneRef,
    getTwoDSceneRef
  }
})
