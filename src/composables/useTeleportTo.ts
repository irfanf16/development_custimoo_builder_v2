import { onMounted, ref } from 'vue'
import { useUIStore } from '../stores/ui/ui.store'

export function useTeleportTo() {
  const uiStore = useUIStore()
  const teleportTo = ref<string | HTMLElement>('body')
  onMounted(() => {
    teleportTo.value = uiStore.widgetRoot || 'body'
  })
  return { teleportTo }
}
