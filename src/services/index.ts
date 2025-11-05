import authenticationService from './authentication/authentication.service'
import companyService from './company/company.service'
import productsService from './products/products.service'
import logosService from './logos/logos.service'
import ordersService from './orders/orders.service'
import dashboardService from './dashboard/dashboard.service'
import addressesService from './addresses/addresses.service'

export const API = {
  authentication: authenticationService,
  company: companyService,
  products: productsService,
  logos: logosService,
  dashboard: dashboardService,
  orders: ordersService,
  addresses: addressesService
}
