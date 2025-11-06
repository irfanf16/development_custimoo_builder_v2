import http from '../api'
import { type OutputCompany, type OutputSettingsResponse } from './types'

async function getCompany() {
  return await http.get<OutputCompany>('company')
}

async function getSettings() {
  return await http.get<OutputSettingsResponse>('get-settings')
}

export default {
  getCompany,
  getSettings
}
