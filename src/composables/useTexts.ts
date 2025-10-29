import { computed } from 'vue'
import type { OutputProductText } from '../services/products/types'
import { useCustomizationStore } from '../stores/customization/customization.store'
import { useProductsStore } from '../stores/products/products.store'

export function useTexts() {
  const customAndPresetTexts = computed<OutputProductText[]>(() => {
    const customizationStore = useCustomizationStore()
    const productsStore = useProductsStore()
    const customProductTexts = customizationStore.activeProductTexts
    const productDetailsTexts = productsStore.activeProductDetails?.product_texts || []

    if (customProductTexts.length === 0) {
      // get the texts defaults from activeProduct details' texts
      return productDetailsTexts
    }

    // check productDetailsTexts ids, if the id is customProductTexts, add this OutputProductText to the response
    // if the id is not in customProductTexts, add the id of the text in the productDetailsTexts to the response
    const response: OutputProductText[] = []
    productDetailsTexts.forEach(text => {
      if (customProductTexts.some(customText => customText.id === text.id)) {
        const customText = customProductTexts.find(customText => customText.id === text.id)
        if (customText) {
          response.push(customText)
        }
      } else {
        response.push(text)
      }
    })
    return response
  })
  return { customAndPresetTexts }
}
