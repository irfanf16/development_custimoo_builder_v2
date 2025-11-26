import appService from './app/app.service'
import authenticationService from './authentication/authentication.service'
import companyService from './company/company.service'
import productsService from './products/products.service'
import logosService from './logos/logos.service'
import ordersService from './orders/orders.service'
import dashboardService from './dashboard/dashboard.service'
import customerService from './customers/customer.service'
import preferencesService from './preferences/preferences.service'

export const API = {
  app: appService,
  authentication: authenticationService,
  company: companyService,
  products: productsService,
  logos: logosService,
  dashboard: dashboardService,
  orders: ordersService,
  customer: customerService,
  preferences: preferencesService
}
