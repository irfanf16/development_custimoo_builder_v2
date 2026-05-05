import type { CustomLogo } from '@/services/logos/types'

/**
 * Turn AI output into a `CustomLogo` the customizer can use: API logos are ready;
 * mock `Blob` goes through the normal upload pipeline.
 */
export async function materializeAiLogoResult(
  result: CustomLogo | Blob,
  doUpload: (file: File) => Promise<CustomLogo | null>
): Promise<CustomLogo | null> {
  if (!(result instanceof Blob)) {
    return result
  }
  const file = new File([result], 'ai-logo.png', { type: 'image/png' })
  return doUpload(file)
}
