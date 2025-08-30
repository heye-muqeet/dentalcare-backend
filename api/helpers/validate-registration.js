const validator = require('validator');

module.exports = {
  friendlyName: 'Validate registration',

  description: 'Validates registration data and returns validation result',

  inputs: {
    email: {
      type: 'string',
      required: true
    },
    password: {
      type: 'string',
      required: true
    },
    name: {
      type: 'string',
      required: true
    },
    phone: {
      type: 'string',
      required: true
    },
    organizationName: {
      type: 'string',
      required: true
    },
    organizationAddress: {
      type: 'string'
    },
    organizationPhone: {
      type: 'string'
    },
    organizationEmail: {
      type: 'string'
    }
  },

  exits: {
    success: {
      description: 'Validation passed'
    }
  },

  fn: async function(inputs, exits) {
    const errors = [];
    const Errors = sails.config.responses;

    // Check required fields
    if (!inputs.email || !inputs.password || !inputs.name || !inputs.phone || !inputs.organizationName) {
      errors.push(Errors.AUTH.REQUIRED_FIELDS_MISSING);
    }

    // Validate email format
    if (!validator.isEmail(inputs.email)) {
      errors.push(Errors.AUTH.INVALID_EMAIL);
    }

    // Validate password length
    if (inputs.password.length < 8) {
      errors.push(Errors.AUTH.INVALID_PASSWORD);
    }

    // Validate phone number
    if (!validator.isMobilePhone(inputs.phone, 'any')) {
      errors.push(Errors.AUTH.INVALID_PHONE);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: inputs.email });
    if (existingUser) {
      errors.push(Errors.AUTH.EMAIL_EXISTS);
    }

    return exits.success({
      valid: errors.length === 0,
      errors
    });
  }
}; 