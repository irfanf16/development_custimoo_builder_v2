import axios from 'axios'

// Axios instance for serving static mock JSON from /public/mock
// Example: /public/mock/products-by-category/hockey.json -> GET /mock/products-by-category/hockey.json
const mockHttp = axios.create({
  baseURL: '/mock'
})

export default mockHttp
