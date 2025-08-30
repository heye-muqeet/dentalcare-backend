module.exports = {
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    address: {
      type: 'string',
      required: true,
    },
    phone: {
      type: 'string',
      required: true,
    },
    email: {
      type: 'string',
      required: true,
      unique: true,
      isEmail: true,
    },
    logo: {
      type: 'string',
      defaultsTo: '',
    },
    taxId: {
      type: 'string',
      allowNull: true,
    },
    status: {
      type: 'string',
      isIn: ['active', 'inactive', 'suspended'],
      defaultsTo: 'active',
    },
    // Associations
    owner: {
      model: 'user',
      unique: true,
    },
    
  },
}; 