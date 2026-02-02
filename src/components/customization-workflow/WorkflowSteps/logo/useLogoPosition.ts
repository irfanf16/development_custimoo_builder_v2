import { computed, watch } from 'vue'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useHistoryStore } from '@/stores/history/history.store'
import type { CustomLogo } from '@/services/logos/types'
import type { PlacementOption } from './useLogoPlacements'
import { useLogos } from './useLogos'

export function useLogoPosition(
  logo: { value: CustomLogo | null },
  positionForm: {
    placementOption: PlacementOption | null
    height: string
    angle: number[]
  },
  currentWidth: { value: number },
  previousPlacementOption: { value: PlacementOption | null },
  isSyncingAngle: { value: boolean },
  rotationChangeStart: { value: number | null },
  heightChangeStart: { value: number | null }
) {
  // ===== DEPENDENCIES =====
  const customizationStore = useCustomizationStore()
  const historyStore = useHistoryStore()
  const { productKey, getActiveLogoIndex } = useLogos()

  // ===== COMPUTED =====
  const activeLogoIndex = computed(() => {
    if (!logo.value) return -1
    return getActiveLogoIndex(logo.value.id)
  })

  const angleText = computed(() => `${Number(positionForm.angle[0]).toFixed(1)}°`)

  // ===== ACTIONS =====
  function applyDraftRotation(nextAngle: number) {
    if (!customizationStore.customization || !productKey.value) return
    const arr = customizationStore.customization.custom_logos?.[productKey.value]
    if (!arr) return
    const index = activeLogoIndex.value
    if (index === -1) return
    const current = arr[index]
    if (!current) return
    const normalized = Number(nextAngle)
    if (!Number.isFinite(normalized)) return
    if (rotationChangeStart.value === null) {
      rotationChangeStart.value = Number(current.rotation || 0)
    }
    if (Math.abs((current.rotation ?? 0) - normalized) < 0.0001) return
    const updated = { ...current, rotation: normalized }
    arr.splice(index, 1, updated)
  }

  function pushDraftTransform(transform: { height?: number; angle?: number }) {
    if (!customizationStore.customization || !productKey.value) return
    const arr = customizationStore.customization.custom_logos?.[productKey.value]
    if (!arr) return
    const index = activeLogoIndex.value
    if (index === -1) return
    const current = arr[index]
    if (!current) return
    const nextHeight = transform.height ?? current.height
    const nextAngle = transform.angle ?? current.rotation
    if (transform.height !== undefined && heightChangeStart.value === null) {
      heightChangeStart.value = Number(current.height || 0)
    }
    const width = Number(
      current.width ||
        currentWidth.value ||
        positionForm.placementOption?.width ||
        previousPlacementOption.value?.width ||
        0
    )
    if (
      Math.abs((current.height ?? 0) - (nextHeight ?? 0)) < 0.0001 &&
      Math.abs((current.rotation ?? 0) - (nextAngle ?? 0)) < 0.0001
    )
      return
    const updated = {
      ...current,
      height: nextHeight,
      rotation: nextAngle,
      width
    }
    arr.splice(index, 1, updated)
  }

  function commitHeightChange() {
    if (!logo.value || !productKey.value) return
    const index = activeLogoIndex.value
    if (index === -1) return
    const option = positionForm.placementOption || previousPlacementOption.value
    const heightValue = Number.parseFloat(positionForm.height)
    if (Number.isNaN(heightValue)) return
    const prevHeight = heightChangeStart.value ?? Number(logo.value.height || option?.height || 0)
    if (Math.abs(prevHeight - heightValue) < 0.001) {
      heightChangeStart.value = null
      return
    }
    const widthValue = Number(logo.value.width || currentWidth.value || option?.width || 0)
    currentWidth.value = widthValue
    void historyStore.execute('logo.update-size', {
      key: productKey.value,
      index,
      prevWidth: widthValue,
      prevHeight,
      nextWidth: widthValue,
      nextHeight: heightValue
    })
    heightChangeStart.value = null
  }

  function formatDimension(value: string): string {
    const numeric = Number.parseFloat(value)
    if (Number.isNaN(numeric)) return ''
    return numeric.toFixed(1)
  }

  function handleHeightInput(value: string | number) {
    const str = String(value)
    const sanitized = str.replace(/[^0-9.]/g, '')
    positionForm.height = sanitized
    const numeric = Number.parseFloat(sanitized)
    if (!Number.isNaN(numeric)) {
      pushDraftTransform({ height: numeric })
    }
  }

  function handleBlurHeight() {
    positionForm.height = formatDimension(positionForm.height)
    commitHeightChange()
  }

  function handleAngleCommit(value: number[]) {
    if (!logo.value || !productKey.value) {
      rotationChangeStart.value = null
      return
    }
    const index = activeLogoIndex.value
    if (index === -1) {
      rotationChangeStart.value = null
      return
    }
    const [rawNext] = value
    const nextRotation = Number(rawNext ?? 0)
    const prevRotation = rotationChangeStart.value ?? Number(logo.value.rotation || 0)
    rotationChangeStart.value = null
    if (Math.abs(prevRotation - nextRotation) < 0.1) return
    void historyStore.execute('logo.update-rotation', {
      key: productKey.value,
      index,
      prevRotation,
      nextRotation
    })
  }

  function resetPositionToCenter() {
    if (!logo.value || !customizationStore.customization?.product_id) return
    positionForm.angle = [0]
    // TODO: dispatch history action to reset logo coordinates once available
  }

  function pinLogo() {
    // TODO: Implement pin logo functionality (locks placement)
  }

  // ===== WATCHERS =====
  function setupAngleWatcher() {
    watch(
      () => positionForm.angle[0],
      (nextAngle, previousAngle) => {
        if (nextAngle === previousAngle) return
        if (isSyncingAngle.value) return
        if (!Number.isFinite(nextAngle)) return
        applyDraftRotation(Number(nextAngle))
      }
    )

    watch(
      () => positionForm.angle[0],
      (nextAngle, previousAngle) => {
        if (nextAngle === previousAngle) return
        if (!logo.value || !productKey.value) return
        const index = activeLogoIndex.value
        if (index === -1) return
        const prevRotation = Number(logo.value.rotation || 0)
        if (Math.abs(prevRotation - Number(nextAngle)) < 0.001) return
        void historyStore.execute('logo.update-rotation', {
          key: productKey.value,
          index,
          prevRotation,
          nextRotation: Number(nextAngle)
        })
      }
    )
  }

  // ===== RETURN =====
  return {
    // Computed
    activeLogoIndex,
    angleText,
    // Actions
    applyDraftRotation,
    pushDraftTransform,
    commitHeightChange,
    formatDimension,
    handleHeightInput,
    handleBlurHeight,
    handleAngleCommit,
    resetPositionToCenter,
    pinLogo,
    // Setup
    setupAngleWatcher
  }
}
