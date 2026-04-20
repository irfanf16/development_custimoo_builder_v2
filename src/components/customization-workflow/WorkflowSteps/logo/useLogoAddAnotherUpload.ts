import type { CustomLogo } from '@/services/logos/types'

export function useLogoAddAnotherUpload(
  doUpload: (file: File) => Promise<CustomLogo | null>,
  onAfterUpload: (logo: CustomLogo) => void
) {
  async function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      const uploaded = await doUpload(file)
      if (uploaded) {
        onAfterUpload(uploaded)
      }
    }
    if (input) input.value = ''
  }

  return {
    handleFileChange
  }
}
