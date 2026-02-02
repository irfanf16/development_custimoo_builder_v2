import { ref } from 'vue'
import { useLogosStore } from '@/stores/logos/logos.store'
import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
import type { CustomLogo } from '@/services/logos/types'

export function useLogoUpload() {
  // ===== DEPENDENCIES =====
  const logosStore = useLogosStore()
  const { effectiveProductId } = useEffectiveSelectors()

  // ===== STATE =====
  const isDragOver = ref(false)
  const fileInputRef = ref<HTMLInputElement | null>(null)

  // ===== ACTIONS =====
  function onClickUpload() {
    fileInputRef.value?.click()
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    isDragOver.value = true
  }

  function onDragLeave() {
    isDragOver.value = false
  }

  async function onDrop(e: DragEvent) {
    e.preventDefault()
    isDragOver.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file) await doUpload(file)
  }

  async function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) await doUpload(file)
    if (input) input.value = ''
  }

  async function doUpload(file: File): Promise<CustomLogo | null> {
    if (!effectiveProductId.value) {
      console.error('Cannot upload logo: effectiveProductId is null')
      return null
    }

    try {
      const res = await logosStore.uploadLogo({
        file: file,
        product_id: effectiveProductId.value
      })

      if (res.success) {
        const uploaded = res?.content?.result?.customer_logo
        if (!uploaded) {
          console.error('Upload succeeded but no logo returned in response')
          return null
        }
        return uploaded
      } else {
        console.error('Upload failed:', res.axiosError?.message || 'Unknown error')
        return null
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      return null
    }
  }

  // ===== RETURN =====
  return {
    // State
    isDragOver,
    fileInputRef,
    // Actions
    onClickUpload,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
    doUpload
  }
}
