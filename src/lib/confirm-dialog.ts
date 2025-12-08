import { ref } from 'vue'

export interface ConfirmDialogOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

const isOpen = ref(false)
const options = ref<ConfirmDialogOptions>({})
let resolver: ((value: boolean) => void) | null = null

export function useConfirmDialogState() {
  return { isOpen, options }
}

export function confirmDialog(opts: ConfirmDialogOptions): Promise<boolean> {
  options.value = {
    title: opts.title ?? 'Are you sure?',
    description: opts.description ?? '',
    confirmText: opts.confirmText ?? 'Confirm',
    cancelText: opts.cancelText ?? 'Cancel'
  }

  isOpen.value = true

  return new Promise<boolean>(resolve => {
    resolver = resolve
  })
}

export function resolveDialog(value: boolean) {
  isOpen.value = false
  if (resolver) {
    resolver(value)
    resolver = null
  }
}
