import { ref, watch, type ComputedRef } from 'vue'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import type { CustomLogo } from '@/services/logos/types'
import { restrictDecimalInput, formatOnBlur, MAX_DECIMALS } from './useLogoUtils'

/**
 * Composable for handling logo dimension inputs (width/height)
 */
export function useLogoDimensions(
  customLogo: ComputedRef<CustomLogo | null>,
  productKey: ComputedRef<string | null>,
  positionForm: { height: string },
  getActiveLogoIndex: (id: string | number) => number
) {
  const customizationStore = useCustomizationStore()

  // Local input values for free typing
  const widthInputValue = ref<string>('')
  const heightInputValue = ref<string>('')
  const isWidthFocused = ref(false)
  const isHeightFocused = ref(false)

  // Sync input values from logo when not focused
  watch(
    () => customLogo.value?.originalWidth,
    newValue => {
      if (!isWidthFocused.value) {
        if (newValue === undefined || newValue === null || newValue === '') {
          widthInputValue.value = ''
        } else {
          const num = Number(newValue)
          widthInputValue.value = Number.isFinite(num)
            ? num.toFixed(MAX_DECIMALS)
            : String(newValue)
        }
      }
    },
    { immediate: true }
  )

  watch(
    () => customLogo.value?.originalHeight,
    newValue => {
      if (!isHeightFocused.value) {
        if (newValue === undefined || newValue === null || newValue === '') {
          heightInputValue.value = ''
        } else {
          const num = Number(newValue)
          heightInputValue.value = Number.isFinite(num)
            ? num.toFixed(MAX_DECIMALS)
            : String(newValue)
        }
      }
    },
    { immediate: true }
  )

  /**
   * Shared handler for originalWidth and originalHeight.
   * Both use the same scaleX/scaleY; changing either dimension applies the same ratio to both scales
   * and to the other stored dimension so width and height fields stay in sync.
   */
  function handleOriginalDimensionUpdate(dimension: 'width' | 'height', value: string | number) {
    const str = String(value).trim()
    if (!customLogo.value || !productKey.value) return

    // Skip update if value is empty or just a decimal point
    if (str === '' || str === '.') return

    const arr = customizationStore.customization?.custom_logos?.[productKey.value]
    if (!arr) return
    const index = getActiveLogoIndex(customLogo.value.id)
    if (index === -1 || !arr[index]) return

    // Parse the value
    const numeric = Number.parseFloat(str)
    if (!Number.isFinite(numeric) || numeric < 0) return

    const nextOriginal = Number(numeric.toFixed(MAX_DECIMALS))
    const logo = arr[index]

    let scaleX = logo.scaleX ?? 1
    let scaleY = logo.scaleY ?? 1
    const originalNum =
      dimension === 'width' ? Number(logo.originalWidth) : Number(logo.originalHeight)

    let ratio = 1
    if (
      Number.isFinite(numeric) &&
      numeric > 0 &&
      Number.isFinite(originalNum) &&
      originalNum > 0
    ) {
      ratio = numeric / originalNum
      scaleX = scaleX * ratio
      scaleY = scaleY * ratio
      const precision = 12
      scaleX = Number(scaleX.toFixed(precision))
      scaleY = Number(scaleY.toFixed(precision))
    }

    const updated = { ...logo, scaleX, scaleY }
    if (dimension === 'width') {
      updated.originalWidth = nextOriginal
      updated.width = nextOriginal
      const otherNum = Number(logo.originalHeight)
      if (Number.isFinite(otherNum) && otherNum > 0 && ratio !== 1) {
        const newOther = Number((otherNum * ratio).toFixed(MAX_DECIMALS))
        updated.originalHeight = newOther
        updated.height = newOther
      }
    } else {
      updated.originalHeight = nextOriginal
      updated.height = nextOriginal
      const otherNum = Number(logo.originalWidth)
      if (Number.isFinite(otherNum) && otherNum > 0 && ratio !== 1) {
        const newOther = Number((otherNum * ratio).toFixed(MAX_DECIMALS))
        updated.originalWidth = newOther
        updated.width = newOther
      }
    }

    arr.splice(index, 1, updated as CustomLogo)
    customizationStore.pushHistoryState('Changed logo dimensions')

    // Update position form height if dimension is height
    if (dimension === 'height') {
      positionForm.height = nextOriginal.toFixed(MAX_DECIMALS)
    }
  }

  /**
   * Handles width input event - restricts decimals in real-time
   */
  function handleWidthInputEvent(event: Event) {
    const target = event.target as HTMLInputElement
    const sanitized = restrictDecimalInput(target.value, MAX_DECIMALS)

    // Update the input value immediately to restrict decimals
    if (target.value !== sanitized) {
      target.value = sanitized
      widthInputValue.value = sanitized
    } else {
      widthInputValue.value = sanitized
    }

    // Update store in real-time if value is valid
    if (sanitized !== '' && sanitized !== '.') {
      const num = Number.parseFloat(sanitized)
      if (Number.isFinite(num) && num >= 0) {
        handleOriginalDimensionUpdate('width', sanitized)
      }
    }
  }

  /**
   * Handles height input event - restricts decimals in real-time
   */
  function handleHeightInputEvent(event: Event) {
    const target = event.target as HTMLInputElement
    const sanitized = restrictDecimalInput(target.value, MAX_DECIMALS)

    // Update the input value immediately to restrict decimals
    if (target.value !== sanitized) {
      target.value = sanitized
      heightInputValue.value = sanitized
    } else {
      heightInputValue.value = sanitized
    }

    // Update store in real-time if value is valid
    if (sanitized !== '' && sanitized !== '.') {
      const num = Number.parseFloat(sanitized)
      if (Number.isFinite(num) && num >= 0) {
        handleOriginalDimensionUpdate('height', sanitized)
      }
    }
  }

  /**
   * Handles width input from v-model
   */
  function handleWidthInput(value: string | number) {
    const sanitized = restrictDecimalInput(String(value), MAX_DECIMALS)
    widthInputValue.value = sanitized

    // Update store in real-time if value is valid
    if (sanitized !== '' && sanitized !== '.') {
      const num = Number.parseFloat(sanitized)
      if (Number.isFinite(num) && num >= 0) {
        handleOriginalDimensionUpdate('width', sanitized)
      }
    }
  }

  /**
   * Handles height input from v-model
   */
  function handleHeightInput(value: string | number) {
    const sanitized = restrictDecimalInput(String(value), MAX_DECIMALS)
    heightInputValue.value = sanitized

    // Update store in real-time if value is valid
    if (sanitized !== '' && sanitized !== '.') {
      const num = Number.parseFloat(sanitized)
      if (Number.isFinite(num) && num >= 0) {
        handleOriginalDimensionUpdate('height', sanitized)
      }
    }
  }

  /**
   * Handles width blur - formats and validates
   */
  function handleBlurWidth() {
    const raw = customLogo.value?.originalWidth
    const defaultValue =
      raw !== undefined && raw !== null && raw !== ''
        ? Number.isFinite(Number(raw))
          ? Number(raw).toFixed(MAX_DECIMALS)
          : String(raw)
        : '1.00'

    widthInputValue.value = formatOnBlur(widthInputValue.value, defaultValue, MAX_DECIMALS)
    isWidthFocused.value = false
  }

  /**
   * Handles height blur - formats and validates
   */
  function handleBlurHeight() {
    const raw = customLogo.value?.originalHeight
    const defaultValue =
      raw !== undefined && raw !== null && raw !== ''
        ? Number.isFinite(Number(raw))
          ? Number(raw).toFixed(MAX_DECIMALS)
          : '1.00'
        : '1.00'

    heightInputValue.value = formatOnBlur(heightInputValue.value, defaultValue, MAX_DECIMALS)
    if (heightInputValue.value) {
      positionForm.height = heightInputValue.value
    }
    isHeightFocused.value = false
  }

  return {
    // State
    widthInputValue,
    heightInputValue,
    isWidthFocused,
    isHeightFocused,
    // Handlers
    handleWidthInputEvent,
    handleHeightInputEvent,
    handleWidthInput,
    handleHeightInput,
    handleBlurWidth,
    handleBlurHeight
  }
}
