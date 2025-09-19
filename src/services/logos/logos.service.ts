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
  console.log('uploadLogoParams', uploadLogoParams)
  const form = new FormData()
  form.append('file', uploadLogoParams.file)
  form.append('product_id', String(uploadLogoParams.product_id))

  return await http.post<OutputUploadLogo>('customer/upload/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export default {
  getRecentLogos,
  uploadLogo
}
