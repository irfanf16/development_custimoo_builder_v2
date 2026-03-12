// the axios instance and types
import http from '../api'
import {
  type InputLogin,
  type OutputLogin,
  type InputSignup,
  type OutputSignup,
  type SalesReps,
  type InputForgotPassword,
  type OutputForgotPassword,
  type InputResetPassword,
  type OutputResetPassword
} from './types'

async function postLogin(data: InputLogin) {
  return await http.post<OutputLogin>('customer/login', data)
}

async function postRegister(data: InputSignup) {
  return await http.post<OutputSignup>('customer/signup', data)
}

async function refreshToken(refreshToken: string) {
  return await http.get<OutputLogin>('customer/from/token', {
    params: { token: refreshToken },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0'
    }
  })
}

async function getSalesReps() {
  return await http.get<SalesReps[]>('get-admin-salesrep')
}

async function postResetPassword(data: InputResetPassword) {
  return await http.post<OutputResetPassword>('customer/reset-password', data)
}

async function postForgotPassword(data: InputForgotPassword) {
  return await http.post<OutputForgotPassword>('customer/forgot-password', data)
}

export default {
  postLogin,
  postRegister,
  refreshToken,
  getSalesReps,
  postForgotPassword,
  postResetPassword
}
