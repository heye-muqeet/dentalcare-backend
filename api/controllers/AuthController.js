const jwt = require('jsonwebtoken');
const sails = require('sails');

module.exports = {
  // Register a new user
  register: async function(req, res) {
    try {
      const { 
        email, 
        password, 
        name, 
        phone, 
        organizationName, 
        organizationAddress, 
        organizationPhone, 
        organizationEmail 
      } = req.body;

      // Validate registration data
      const validationResult = await sails.helpers.validateRegistration.with({
        email,
        password,
        name,
        phone,
        organizationName,
        organizationAddress,
        organizationPhone,
        organizationEmail
      });

      if (!validationResult.valid) {
        return res.status(400).json({
          status: 'error',
          errors: validationResult.errors
        });
      }

      // Create organization first
      const organization = await Organization.create({
        name: organizationName,
        address: organizationAddress,
        phone: organizationPhone || phone, // Use user's phone if org phone not provided
        email: organizationEmail || email, // Use user's email if org email not provided
      }).fetch();

      // Create default location for the organization
      const location = await Location.create({
        name: 'Main Branch',
        address: organizationAddress,
        phone: organizationPhone || phone, // Use user's phone if org phone not provided
        email: organizationEmail || email, // Use user's email if org email not provided
        organization: organization.id,
      }).fetch();

      // Create owner user
      const user = await User.create({
        email,
        password,
        name,
        phone,
        role: "owner",
        organization: organization.id,
        location: location.id,
      }).fetch();

      // Update organization with owner reference
      await Organization.updateOne({ id: organization.id }).set({ owner: user.id });

      // Generate JWT token
      const token = await sails.helpers.generateToken(user);

      return res.status(201).json({
        status: 'success',
        message: 'Registration successful',
        data: {
          user,
          organization,
          location,
          token,
        }
      });
    } catch (err) {
      sails.log.error('Error in registration:', err);
      return res.status(500).json({
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR
      });
    }
  },

  // Login user
  login: async function(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).populateAll();
      if (!user) {
        return res.status(401).json({ 
          status: 'error',
          error: sails.config.responses.AUTH.INVALID_CREDENTIALS 
        });
      }

      const isValidPassword = await User.verifyPassword.call(user, password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          status: 'error',
          error: sails.config.responses.AUTH.INVALID_CREDENTIALS 
        });
      }

      // Generate JWT token
      const token = await sails.helpers.generateToken(user);
      // Set JWT as HttpOnly, Secure cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: true , // true in production (HTTPS)
        sameSite: 'None', // 'Lax' or even 'Strict' for local dev
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      return res.json({
        status: 'success',
        message: 'Login successful',
        data: user
      });
    } catch (err) {
      sails.log.error('Error in login:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Logout user
  logout: async function(req, res) {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      });
      return res.json({
        status: 'success',
        message: 'Logout successful'
      });
    } catch (err) {
      sails.log.error('Error in logout:', err);
      return res.status(500).json({
        status: 'error',
        error: 'An error occurred during logout. Please try again.'
      });
    }
  },

  // Get current user profile
  getProfile: async function(req, res) {
    try {
      const user = await User.findOne({ id: req.user.id }).populateAll();
      if (!user) {
        return res.status(404).json({ 
          status: 'error',
          error: sails.config.responses.GENERIC.NOT_FOUND 
        });
      }

      return res.json({
        status: 'success',
        data: user
      });
    } catch (err) {
      sails.log.error('Error fetching profile:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },
}; 