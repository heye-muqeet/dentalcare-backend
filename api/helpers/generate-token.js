/**
 * generate-token.js
 *
 * Helper function to generate JWT tokens for authenticated users
 */

const jwt = require('jsonwebtoken');

module.exports = {
  friendlyName: 'Generate token',

  description: 'Generate a JWT token for the given user',

  inputs: {
    user: {
      type: 'ref',
      required: true,
      description: 'The user object to generate token for'
    }
  },

  exits: {
    success: {
      description: 'Token generated successfully'
    }
  },

  fn: async function(inputs, exits) {
    const user = inputs.user;
    
    // Create token payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      locationId: user.locationId
    };

    // Generate token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key', // Use environment variable for secret
      { expiresIn: '24h' } // Token expires in 24 hours
    );

    return exits.success(token);
  }
}; 