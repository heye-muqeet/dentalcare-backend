/**
 * config/responses.js
 *
 * Centralized custom responses and error codes/messages for the app
 */

module.exports.responses = {
  // Authentication Errors
  AUTH: {
    NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    EMAIL_EXISTS: {
      code: 'AUTH_001',
      message: 'Email already exists'
    },
    REQUIRED_FIELDS_MISSING: {
      code: 'AUTH_002',
      message: 'Required fields missing'
    },
    INVALID_EMAIL: {
      code: 'AUTH_003',
      message: 'Invalid email format'
    },
    INVALID_PASSWORD: {
      code: 'AUTH_004',
      message: 'Password must be at least 8 characters long'
    },
    INVALID_PHONE: {
      code: 'AUTH_005',
      message: 'Invalid phone number format'
    },
    INSUFFICIENT_PERMISSIONS: {
      code: 'AUTH_009',
      message: 'Insufficient permissions'
    },
    INVALID_CREDENTIALS: {
      code: 'AUTH_010',
      message: 'Invalid email or password'
    }
  },

  // Generic Errors
  GENERIC: {
    SERVER_ERROR: 'SERVER_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
  }
}; 