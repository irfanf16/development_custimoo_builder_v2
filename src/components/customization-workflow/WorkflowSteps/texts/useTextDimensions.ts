import { ref, watch, type ComputedRef } from 'vue'
import type { OutputProductTextItem } from '@/services/products/types'
import { restrictDecimalInput, formatOnBlur, MAX_DECIMALS } from '../logo/useLogoUtils'

/**
 * Composable for handling text dimension inputs (width/height)
 */
export function useTextDimensions(
  currentItem: ComputedRef<OutputProductTextItem | null>,
  handleOriginalDimensionUpdate: (dimension: 'width' | 'height', value: string | number) => void
) {
  // Local input values for free typing
  const widthInputValue = ref<string>('')
  const heightInputValue = ref<string>('')
  const isWidthFocused = ref(false)
  const isHeightFocused = ref(false)

  // Sync input values from text item when not focused
  watch(
    () => {
      const item = currentItem.value as { originalWidth?: string | number } | null
      return item?.originalWidth
    },
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
    () => {
      const item = currentItem.value as { originalHeight?: string | number } | null
      return item?.originalHeight
    },
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
    const item = currentItem.value as { originalWidth?: string | number } | null
    const raw = item?.originalWidth
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
    const item = currentItem.value as { originalHeight?: string | number } | null
    const raw = item?.originalHeight
    const defaultValue =
      raw !== undefined && raw !== null && raw !== ''
        ? Number.isFinite(Number(raw))
          ? Number(raw).toFixed(MAX_DECIMALS)
          : String(raw)
        : '1.00'

    heightInputValue.value = formatOnBlur(heightInputValue.value, defaultValue, MAX_DECIMALS)
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
    handleBlurHeight,
    // Constants
    MAX_DECIMALS
  }
}
