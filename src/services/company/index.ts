import http from '../api'
import { type OutputCompany, type OutputSettings } from './types'

async function getCompany() {
  return await http.get<OutputCompany>('company')
}

async function getSettings() {
  return await http.get<OutputSettings>('get-settings')
}

export default {
  getCompany,
  getSettings
}
