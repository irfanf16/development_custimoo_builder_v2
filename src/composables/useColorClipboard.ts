import { ref, readonly } from 'vue'

// Global state to allow copying between different components (e.g. from Locker/Design to Text)
const clipboardHex = ref<string | null>(null)

export function useColorClipboard() {
  const copyColor = (color: string | null | undefined) => {
    if (!color) return
    clipboardHex.value = color
  }

  const clipboardColor = readonly(clipboardHex)

  return {
    clipboardColor,
    copyColor
  }
}
