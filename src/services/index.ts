import authenticationService from './authentication/authentication.service'
import companyService from './company/company.service'
import customerService from './customers/customer.service'
import dashboardService from './dashboard/dashboard.service'
import lockerRoomService from './lockers/lockers.service'
import logosService from './logos/logos.service'
import ordersService from './orders/orders.service'
import preferencesService from './preferences/preferences.service'
import productsService from './products/products.service'
import permissionsService from './permissions/permissions.service'

export const API = {
  authentication: authenticationService,
  company: companyService,
  products: productsService,
  logos: logosService,
  dashboard: dashboardService,
  orders: ordersService,
  customer: customerService,
  preferences: preferencesService,
  lockers: lockerRoomService
  permissions: permissionsService
}
