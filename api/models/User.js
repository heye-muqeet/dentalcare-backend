module.exports = {
  schema: true,
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    email: {
      type: 'string',
      required: true,
      unique: true,
      isEmail: true,
    },
    password: {
      type: 'string',
      required: true,
      minLength: 6,
    },
    phone: {
      type: 'string',
      required: true,
    },
    role: {
      type: 'string',
      isIn: ['owner', 'receptionist', 'doctor'],
      required: true,
    },
    gender: {
      type: 'string',
      allowNull: true,
    },
    age: {
      type: 'number',   
      allowNull: true,
    },

    profileImage: {
      type: 'string',
      defaultsTo: '',
    },
    // Doctor-specific fields
    specialization: {
      type: 'string',
      allowNull: true,
    },
    licenseNumber: {
      type: 'string',
      allowNull: true,
    },
    licenseDocumentUrl: {
      type: 'string',
      allowNull: true,
    },
    experience: {
      type: 'number',
      allowNull: true,
    },
    education: {
      type: 'string',
      allowNull: true,
    },
    availability: {
      type: 'json',
      defaultsTo: [],
    },
    status: {
      type: 'string',
      isIn: ['active', 'inactive', 'suspended'],
      defaultsTo: 'active',
    },
    deletedAt: {
      type: 'number',
      defaultsTo: 0,
    },
    // Organization and Location references
    organization: {
      model: 'organization',
      required: true,
    },
    location: {
      model: 'location',
      required: true,
    },
    // Associations
    
  },

  // Lifecycle callbacks
  beforeCreate: async function(values, proceed) {
    // Hash password before creating user
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    values.password = await bcrypt.hash(values.password, salt);
    return proceed();
  },

  // Custom methods
  verifyPassword: async function(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, this.password);
  },
}; 