import { computed, unref, type Ref, type MaybeRef } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'

/**
 * Composable for resolving colorGrouping from prop or design data
 * @param colorGroupingProp - Optional colorGrouping prop (can be ref, string JSON, or object)
 * @returns Computed ref of colorGrouping object or null
 */
export function useColorGrouping(
  colorGroupingProp?: MaybeRef<Record<string, string[]> | string | null | undefined>
): Ref<Record<string, string[]> | null> {
  const productsStore = useProductsStore()

  return computed<Record<string, string[]> | null>(() => {
    // Get prop value (unref handles both ref and direct value)
    const propValue = unref(colorGroupingProp)

    // Use prop if provided
    if (propValue) {
      if (typeof propValue === 'string') {
        try {
          return JSON.parse(propValue) as Record<string, string[]>
        } catch {
          return null
        }
      }
      return propValue
    }

    // Otherwise extract from active design details
    const designDetails = productsStore.activeDesignDetails
    if (!designDetails?.front_design?.color_group) return null

    try {
      return JSON.parse(designDetails.front_design.color_group) as Record<string, string[]>
    } catch {
      return null
    }
  })
}
