import http from '../api'
import { type AppInfo } from './types'

async function getAppInfo() {
  return await http.get<AppInfo>('get_app_version')
}

export default {
  getAppInfo
}
