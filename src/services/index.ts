import authenticationService from './authentication/authentication.service'
import companyService from './company/company.service'
import productsService from './products/products.service'

export const API = {
  authentication: authenticationService,
  company: companyService,
  products: productsService
}
