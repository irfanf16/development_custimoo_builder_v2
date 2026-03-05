import { ref } from 'vue'
import type { CollectionProductWithLockerRoom } from '@/services/lockers/types'

export type PendingPostLoginAction =
  | 'addToCart'
  | 'updateCart'
  | 'saveToLocker'
  | 'openOrderDetail'
  | null

const pendingAction = ref<PendingPostLoginAction>(null)

/** When pending is 'saveToLocker', the collection product to save after login. */
const pendingSaveToLockerProduct = ref<CollectionProductWithLockerRoom | null>(null)

/** When pending is 'openOrderDetail', the order id to open in profile after login. */
const pendingOrderId = ref<string | number | null>(null)

/**
 * Use when opening the sign-in dialog in response to "Add to cart", "Update cart", "Save to Locker",
 * or "Open order detail" so that after login success the action can be run.
 */
export function usePendingPostLoginAction() {
  function setPending(
    action: PendingPostLoginAction,
    productOrOrderId?: CollectionProductWithLockerRoom | string | number
  ) {
    pendingAction.value = action
    pendingSaveToLockerProduct.value =
      action === 'saveToLocker' && productOrOrderId && typeof productOrOrderId === 'object'
        ? productOrOrderId
        : null
    pendingOrderId.value =
      action === 'openOrderDetail' &&
      productOrOrderId != null &&
      (typeof productOrOrderId === 'string' || typeof productOrOrderId === 'number')
        ? productOrOrderId
        : null
  }

  function getPending(): PendingPostLoginAction {
    return pendingAction.value
  }

  function getPendingSaveToLockerProduct(): CollectionProductWithLockerRoom | null {
    return pendingSaveToLockerProduct.value
  }

  function getPendingOrderId(): string | number | null {
    return pendingOrderId.value
  }

  function clearPending() {
    pendingAction.value = null
    pendingSaveToLockerProduct.value = null
    pendingOrderId.value = null
  }

  return {
    setPending,
    getPending,
    getPendingSaveToLockerProduct,
    getPendingOrderId,
    clearPending
  }
}
