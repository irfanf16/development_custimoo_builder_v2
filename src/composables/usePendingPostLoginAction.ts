import { ref } from 'vue'
import type { CollectionProductWithLockerRoom } from '@/services/lockers/types'

export type PendingPostLoginAction = 'addToCart' | 'updateCart' | 'saveToLocker' | null

const pendingAction = ref<PendingPostLoginAction>(null)

/** When pending is 'saveToLocker', the collection product to save after login. */
const pendingSaveToLockerProduct = ref<CollectionProductWithLockerRoom | null>(null)

/**
 * Use when opening the sign-in dialog in response to "Add to cart", "Update cart", or "Save to Locker"
 * so that after login success the action can be run (e.g. from CustomizerTopbar or CollectionView).
 */
export function usePendingPostLoginAction() {
  function setPending(action: PendingPostLoginAction, product?: CollectionProductWithLockerRoom) {
    pendingAction.value = action
    pendingSaveToLockerProduct.value = action === 'saveToLocker' && product ? product : null
  }

  function getPending(): PendingPostLoginAction {
    return pendingAction.value
  }

  function getPendingSaveToLockerProduct(): CollectionProductWithLockerRoom | null {
    return pendingSaveToLockerProduct.value
  }

  function clearPending() {
    pendingAction.value = null
    pendingSaveToLockerProduct.value = null
  }

  return { setPending, getPending, getPendingSaveToLockerProduct, clearPending }
}
