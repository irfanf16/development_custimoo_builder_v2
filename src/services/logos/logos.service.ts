import http from '../api'
import type {
  OutputRecentLogos,
  OutputUploadLogo,
  UploadLogoParams
} from './types'

async function getRecentLogos() {
  return await http.get<OutputRecentLogos>('logos/recent')
}

async function uploadLogo(uploadLogoParams: UploadLogoParams) {
  return await http.post<OutputUploadLogo>(
    'customer/upload/logo',
    uploadLogoParams
  )
}

export default {
  getRecentLogos,
  uploadLogo
}
