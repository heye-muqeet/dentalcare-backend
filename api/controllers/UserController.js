/**
 * UserController.js
 *
 * Controller for user management
 */

module.exports = {
  create: async function (req, res) {
    try {
      // Only owner can create users
      if (req.user.role !== 'owner') {
        return res.status(403).json({ 
          status: 'error',
          error: sails.config.responses.AUTH.UNAUTHORIZED 
        });
      }

      const { email, name, phone, role, gender, age, experience, specialization,licenseNumber } = req.body;
      if (!email || !name || !phone || !role) {
        return res.status(400).json({ 
          status: 'error',
          error: sails.config.responses.AUTH.REQUIRED_FIELDS_MISSING 
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ 
          status: 'error',
          error: sails.config.responses.AUTH.EMAIL_EXISTS 
        });
      }

      // Generate password
      const password = await sails.helpers.generatePassword();

      // Build user data
      const userData = {
        email,
        password,
        name,
        phone,
        role,
        organization: req.user.organization,
        location: req.user.location
      };
      if (gender) userData.gender = gender;
      if (age) userData.age = age;
      if (experience) userData.experience = experience;
      if (specialization) userData.specialization = specialization;
      if (licenseNumber) userData.licenseNumber = licenseNumber;

      // Create user
      const user = await User.create(userData).fetch();

      // Send email with password
      await sails.helpers.sendEmail.with({
        to: email,
        subject: 'Your Account Credentials',
        text: `Hello ${name},\n\nYour account has been created.\nEmail: ${email}\nPassword: ${password}\n\nPlease log in and change your password.`
      });

      return res.status(201).json({
        status: 'success',
        message: 'User created and credentials sent via email.',
        data: user
      });
    } catch (err) {
      sails.log.error('Error creating user:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  getDoctors: async function (req, res) {
    try {
      // Check if user has permission to view users
      if (req.user.role !== 'owner' && req.user.role !== 'receptionist') {
        return res.status(403).json({ 
          status: 'error',
          error: sails.config.responses.AUTH.UNAUTHORIZED 
        });
      }

      // Build query based on user role
      const query = {
        location: req.user.location,
        role: { in: ['doctor', 'owner'] },
        status: 'active',
        deletedAt: 0
      };

      // If receptionist, only show doctors
      // if (req.user.role === 'receptionist') {
      //   query.role = 'doctor';
      // }

      // Fetch users
      const users = await User.find(query).omit(['password']);

      return res.status(200).json({
        status: 'success',
        data: users
      });
    } catch (err) {
      sails.log.error('Error fetching users:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  update: async function (req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        phone,
        gender,
        age,
        experience,
        specialization,
        licenseNumber,
        education,
        email,
        profileImage,
        role,
      } = req.body;

      // Find the user
      const user = await User.findOne({
        id,
        location: req.user.location,
        deletedAt: 0
      });

      if (!user) {
        return res.status(404).json({ 
          status: 'error',
          error: sails.config.responses.GENERIC.NOT_FOUND 
        });
      }

      // Build update data based on role and provided fields
      const updateData = {};

      // Common fields that all users can update
      if (name) updateData.name = name;
      if (profileImage) updateData.profileImage = profileImage;
      if (phone) updateData.phone = phone;
      if (gender) updateData.gender = gender;
      if (age) updateData.age = age;
      if (education) updateData.education = education;

      // Role-specific fields
      if (req.user.role === 'owner') {
        // Owner can update all fields
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (experience) updateData.experience = experience;
        if (specialization) updateData.specialization = specialization;
        if (licenseNumber) updateData.licenseNumber = licenseNumber;
      } else if (user.role === 'doctor') {
        // Doctor-specific fields
        if (experience) updateData.experience = experience;
        if (specialization) updateData.specialization = specialization;
        if (licenseNumber) updateData.licenseNumber = licenseNumber;
      }

      // Update user
      const updatedUser = await User.updateOne({ id }).set(updateData);

      return res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (err) {
      sails.log.error('Error updating user:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  changePassword: async function (req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          status: 'error',
          error: 'Current password, new password, and confirm password are required'
        });
      }

      // Validate new password length
      if (newPassword.length < 6) {
        return res.status(400).json({
          status: 'error',
          error: sails.config.responses.AUTH.INVALID_PASSWORD
        });
      }

      // Check if new password and confirm password match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          status: 'error',
          error: 'New password and confirm password do not match'
        });
      }

      // Find the current user with password
      const user = await User.findOne({
        id: req.user.id,
        deletedAt: 0
      });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          error: sails.config.responses.AUTH.USER_NOT_FOUND
        });
      }

      // Verify current password
      const bcrypt = require('bcryptjs');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          status: 'error',
          error: 'Current password is incorrect'
        });
      }

      // Check if new password is different from current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          status: 'error',
          error: 'New password must be different from current password'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      // Update user password
      await User.updateOne({ id: req.user.id }).set({
        password: hashedNewPassword
      });

      return res.status(200).json({
        status: 'success',
        message: 'Password changed successfully'
      });

    } catch (err) {
      sails.log.error('Error changing password:', err);
      return res.status(500).json({
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR
      });
    }
  }
}; 