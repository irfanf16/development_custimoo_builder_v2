import { ref } from 'vue'
import { urlToBase64 } from '@/services/files/file.service'
import { toast } from 'vue-sonner'

export function useFileDownload() {
  const isLoading = ref(false)

  /**
   * Downloads multiple files from URLs
   * @param files - Array of file objects with url and name
   */
  async function downloadFiles(
    files: Array<{ url: string; name?: string; alt?: string }>
  ): Promise<void> {
    if (!files.length) {
      toast.error('No files to download', { position: 'top-right', richColors: true })
      return
    }

    isLoading.value = true

    try {
      const urls = files.map(file => file.url)
      const base64Files = await urlToBase64(urls)

      if (!base64Files.length) {
        toast.error('Failed to convert files for download', {
          position: 'top-right',
          richColors: true
        })
        return
      }

      // Download each file
      base64Files.forEach((base64File, index) => {
        const fileName = files[index]?.name || `download-${index + 1}`
        downloadBase64File(base64File, fileName)
      })

      toast.success('Files downloading...', {
        position: 'top-right',
        richColors: true,
        duration: 2000
      })
    } catch (error) {
      console.error('Error downloading files:', error)
      toast.error('Failed to download files', {
        position: 'top-right',
        richColors: true
      })
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Downloads a single base64 file
   * @param base64Data - Base64 encoded file data
   * @param fileName - Name for the downloaded file
   */
  function downloadBase64File(base64Data: string, fileName: string): void {
    if (typeof window === 'undefined') return

    const cleanBase64 = base64Data.includes(',') ? (base64Data.split(',')[1] ?? '') : base64Data

    if (!cleanBase64) {
      console.error('Invalid base64 data')
      return
    }

    const binaryString = window.atob(cleanBase64)
    const bytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const blob = new Blob([bytes])
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName || 'download'
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  return {
    isLoading,
    downloadFiles,
    downloadBase64File
  }
}
