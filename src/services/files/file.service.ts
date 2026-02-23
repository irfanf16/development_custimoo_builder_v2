import http from '../api'
export interface FileConversionResponse {
  result: {
    base64_files: string[]
  }
}

/**
 * Converts image URLs to base64 encoded strings
 * @param urls - Array of image URLs to convert
 * @returns Array of base64 encoded strings
 */
export async function urlToBase64(urls: string[]): Promise<string[]> {
  try {
    const response = await http.post<FileConversionResponse>('url_to_base64', {
      file_urls: urls
    })
    return response?.data?.result?.base64_files ?? []
  } catch (error) {
    console.error('Error while converting url to base64:', error)
    return []
  }
}
