/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
  // Default policy for all controllers and actions
  '*': false, // Deny access to all routes by default

  // Auth routes
  'AuthController': {
    'register': true, // Public access
    'login': true,    // Public access
    '*': 'isAuthenticated' // All other auth routes require authentication
  },

  // Dashboard routes
  'DashboardController': {
    '*': ['isAuthenticated'] // All dashboard routes require authentication
  },

  // User routes
  'UserController': {
    '*': ['isAuthenticated', 'isOwner'], // All user routes require authentication and owner role,
    'getDoctors':['isAuthenticated', 'isOwnerorReceptionist'],
    'update':['isAuthenticated', 'canUpdateUser'],
    'changePassword': ['isAuthenticated'] // Any authenticated user can change their own password
  },

  // Patient routes
  'PatientController': {
    '*': ['isAuthenticated'],
    'create': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'update': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'destroy': ['isAuthenticated', 'isOwner'],
    'findOne': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'find': ['isAuthenticated', 'isOwnerOrReceptionistOrDoctor'],
    'getPatientDetails': ['isAuthenticated', 'isOwnerOrReceptionistOrDoctor']
  },

  // Appointment routes
  'AppointmentController': {
    '*': ['isAuthenticated'],
    'create': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'update': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'destroy': ['isAuthenticated', 'isOwner'],
    'findOne': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'find': ['isAuthenticated', 'isOwnerOrReceptionistOrDoctor'],
    'getAvailableSlots': ['isAuthenticated', 'isOwnerOrReceptionistOrDoctor'],
    'cancel': ['isAuthenticated', 'isOwnerOrReceptionistOrDoctor']
  },

  // Treatment routes
  'TreatmentController': {
    'create': ['isAuthenticated', 'isOwnerOrDoctor'],
    'update': ['isAuthenticated', 'isOwnerOrDoctor'],
    'find': ['isAuthenticated', 'isOwnerOrReceptionistOrDoctor'],
    'findOne': ['isAuthenticated', 'isOwnerOrReceptionistOrDoctor']
  },

  // Invoice routes
  'InvoiceController': {
    '*': ['isAuthenticated'],
    'find': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'findOne': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'create': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'update': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'markAsPaid': ['isAuthenticated', 'isOwnerOrReceptionist']
  },

  // Payment routes
  'PaymentController': {
    '*': ['isAuthenticated']
  },

  // Expense routes
  'ExpenseController': {
    'find': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'findOne': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'create': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'update': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'delete': ['isAuthenticated', 'isOwner'],
    'summary': ['isAuthenticated', 'isOwnerOrReceptionist']
  },

  // Media routes
  'MediaController': {
    '*': 'isAuthenticated'
  },

  // Report routes
  'ReportController': {
    '*': ['isAuthenticated']
  },

  // Service routes
  'ServiceController': {
    'create': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'update': ['isAuthenticated', 'isOwnerOrReceptionist'],
    'find': ['isAuthenticated', 'isOwnerOrReceptionistOrDoctor'],
    'findOne': ['isAuthenticated', 'isOwnerOrReceptionistOrDoctor'],
    'delete': ['isAuthenticated', 'isOwner']
  }
};
