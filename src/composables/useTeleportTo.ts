import { computed } from 'vue'
import { useUIStore } from '../stores/ui/ui.store'

export function useTeleportTo() {
  const uiStore = useUIStore()

  // Use computed to ensure we always have a valid target
  // Teleport to widgetRoot (inside Shadow DOM) like DialogContent does
  // This ensures the portal content stays within the Shadow DOM for proper styling
  const teleportTo = computed<string | HTMLElement>(() => {
    const root = uiStore.widgetRoot

    // Use widgetRoot if available and connected
    // This works for Shadow DOM contexts - the portal will append to widgetRoot
    // which is inside the Shadow DOM, keeping styles encapsulated
    if (root && root.isConnected) {
      return root
    }

    // Fallback to body if widgetRoot is not available
    return 'body'
  })

  return { teleportTo }
}
