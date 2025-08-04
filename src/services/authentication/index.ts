// the axios instance and types
import http from '../api'
import { type InputLogin, type OutputLogin } from './types'

async function postLogin(data: InputLogin) {
  return await http.post<OutputLogin>('customer/login', data)
}

export default {
  postLogin
}
