/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': { view: 'pages/homepage' },


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/

  // Auth routes
  'POST /api/auth/register': 'AuthController/register',
  'POST /api/auth/login': 'AuthController/login',
  'GET /api/auth/profile': 'AuthController/getProfile',
  'POST /api/auth/logout': 'AuthController/logout',

  // Dashboard routes
  'GET /api/dashboard': 'DashboardController/getDashboardData',

  // User routes
  'GET /api/users': 'UserController/find',
  'GET /api/users/doctors': 'UserController/getDoctors',
  'POST /api/users': 'UserController/create',
  'PUT /api/users/:id': 'userController/update',
  'DELETE /api/users/:id': 'UserController/destroy',
  'PUT /api/users/change-password': 'UserController/changePassword',

  // Patient routes
  'GET /api/patients': 'PatientController/find',
  'POST /api/patients': 'PatientController/create',
  'PUT /api/patients/:id': 'PatientController/update',
  'GET /api/patients/:id': 'PatientController/findOne',
  'GET /api/patients/:id/details': 'PatientController/getPatientDetails',
  // 'GET /api/patients/:id/balance': 'PatientController/getBalance',
  // 'PUT /api/patients/:id/balance': 'PatientController/updateBalance',

  // Appointment routes
  'GET /api/appointments': 'AppointmentController/find',
  'GET /api/appointments/available-slots': 'AppointmentController/getAvailableSlots',
  'POST /api/appointments': 'AppointmentController/create',
  'PUT /api/appointments/:id': 'AppointmentController/update',
  'GET /api/appointments/:id': 'AppointmentController/findOne',
  'PUT /api/appointments/:id/cancel': 'AppointmentController/cancel',

  // Treatment routes
  'GET /api/treatments': 'TreatmentController/find',
  'POST /api/treatments': 'TreatmentController/create',
  'PUT /api/treatments/:id': 'TreatmentController/update',
  'GET /api/treatments/:id': 'TreatmentController/findOne',

  // Invoice routes
  'GET /api/invoices': 'InvoiceController/find',
  'POST /api/invoices': 'InvoiceController/create',
  'PUT /api/invoices/:id': 'InvoiceController/update',
  'GET /api/invoices/:id': 'InvoiceController/findOne',
  'PUT /api/invoices/:id/mark-paid': 'InvoiceController/markAsPaid',

  // Payment routes
  'POST /api/payments': 'PaymentController/create',
  'GET /api/payments': 'PaymentController/find',

  // Expense routes
  'GET /api/expenses': 'ExpenseController/find',
  'POST /api/expenses': 'ExpenseController/create',
  'GET /api/expenses/summary': 'ExpenseController/summary',
  'GET /api/expenses/:id': 'ExpenseController/findOne',
  'PUT /api/expenses/:id': 'ExpenseController/update',
  'DELETE /api/expenses/:id': 'ExpenseController/delete',

  // Media routes
  'POST /api/media/upload': 'MediaController/upload',
  'GET /api/media/:id': 'MediaController/findOne',

  // Report routes
  'POST /api/reports': 'ReportController/create',
  'GET /api/reports/patient/:patientId': 'ReportController/getPatientReports',
  'GET /api/reports/treatment/:treatmentId': 'ReportController/getTreatmentReports',
  'PUT /api/reports/:id': 'ReportController/update',
  'DELETE /api/reports/:id': 'ReportController/destroy',

  // Service routes
  'GET /api/services': 'ServiceController/find',
  'POST /api/services': 'ServiceController/create',
  'GET /api/services/:id': 'ServiceController/findOne',
  'PUT /api/services/:id': 'ServiceController/update',
  'DELETE /api/services/:id': 'ServiceController/delete'
};
