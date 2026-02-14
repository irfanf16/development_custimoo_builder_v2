import { ref } from 'vue'

export type PendingPostLoginAction = 'addToCart' | 'updateCart' | null

const pendingAction = ref<PendingPostLoginAction>(null)

/**
 * Use when opening the sign-in dialog in response to "Add to cart" or "Update cart"
 * so that after login success the action can be run (e.g. from CustomizerTopbar).
 */
export function usePendingPostLoginAction() {
  function setPending(action: PendingPostLoginAction) {
    pendingAction.value = action
  }

  function getPending(): PendingPostLoginAction {
    return pendingAction.value
  }

  function clearPending() {
    pendingAction.value = null
  }

  return { setPending, getPending, clearPending }
}
