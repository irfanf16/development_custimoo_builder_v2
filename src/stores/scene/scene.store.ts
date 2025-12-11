import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'

/**
 * Store for scene component references
 * Used to access mainPreview scene components globally
 */
export const useSceneStore = defineStore('sceneStore', () => {
  // Component references
  const threeDSceneRef = ref<ComponentPublicInstance | null>(null)
  const twoDSceneFrontRef = ref<ComponentPublicInstance | null>(null)
  const twoDSceneBackRef = ref<ComponentPublicInstance | null>(null)

  /**
   * Set 3D scene reference
   */
  function setThreeDSceneRef(ref: ComponentPublicInstance | null) {
    threeDSceneRef.value = ref
  }

  /**
   * Set 2D scene reference (front or back)
   */
  function setTwoDSceneRef(ref: ComponentPublicInstance | null, side: 'front' | 'back') {
    if (side === 'front') {
      twoDSceneFrontRef.value = ref
    } else {
      twoDSceneBackRef.value = ref
    }
  }

  /**
   * Get 2D scene reference by side
   */
  function getTwoDSceneRef(side: 'front' | 'back'): ComponentPublicInstance | null {
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
