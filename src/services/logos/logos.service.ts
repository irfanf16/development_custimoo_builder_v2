import http from '../api'
import type {
  OutputRecentLogos,
  OutputUpdateAndPostNewLogo,
  OutputUploadLogo,
  UpdateAndPostNewLogoParams,
  UploadLogoParams
} from './types'

async function getRecentLogos() {
  return await http.get<OutputRecentLogos>('logos/recent')
}

async function uploadLogo(uploadLogoParams: UploadLogoParams) {
  const form = new FormData()
  // Backend expects the field name 'logo'
  form.append('file', uploadLogoParams.file)
  form.append('product_id', String(uploadLogoParams.product_id))

  // Let Axios set the correct multipart Content-Type with boundary
  return await http.post<OutputUploadLogo>('customer/upload/logo', form)
}

async function updateAndPostNewLogo(uploadLogoParams: UpdateAndPostNewLogoParams) {
  const form = new FormData()
  // Backend expects the field name 'logo'
  form.append('logo_id', String(uploadLogoParams.logo_id))
  form.append('logo', uploadLogoParams.logo)
  form.append('product_id', String(uploadLogoParams.product_id))

  return await http.post<OutputUpdateAndPostNewLogo>('customer/update/logo', form)
}

async function deleteRecentLogo(logoId: string) {
  return await http.delete(`logos/recent/${logoId}`)
}

export default {
  getRecentLogos,
  uploadLogo,
  deleteRecentLogo,
  updateAndPostNewLogo
}
