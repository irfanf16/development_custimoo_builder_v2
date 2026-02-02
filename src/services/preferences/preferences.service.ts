import http from '../api'
import type { UserPreferences } from './types'

async function getPreferences(): Promise<UserPreferences> {
  const response = await http.get<UserPreferences>('user/preferences')
  return response.data // ✅ return only the data
}

async function updatePreferences(data: UserPreferences): Promise<UserPreferences> {
  const response = await http.post<UserPreferences>('user/preferences', data)
  return response.data // ✅ return only the data
}

export default {
  getPreferences,
  updatePreferences
}
