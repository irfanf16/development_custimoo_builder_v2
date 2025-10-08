import axios, { type AxiosRequestHeaders } from 'axios'

const instance = axios.create({
  baseURL: `${import.meta.env.VITE_API_ENDPOINT}/api/v2`
})

// Attach CustomerToken header if access token is present
instance.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('jwtToken') : null

  if (token) {
    if (!config.headers) config.headers = {} as AxiosRequestHeaders
    ;(config.headers as Record<string, string>)['CustomerToken'] = token
  }
  return config
})

export default instance
