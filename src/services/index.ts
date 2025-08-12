import authenticationController from './authentication'
import companyController from './company'
import productsController from './products'

export const API = {
  authentication: authenticationController,
  company: companyController,
  products: productsController
}
