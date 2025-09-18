import http from '../api'
import type { OutputRecentLogos } from './types'

async function getRecentLogos() {
  return await http.get<OutputRecentLogos>('logos/recent')
}

export default {
  getRecentLogos
}
