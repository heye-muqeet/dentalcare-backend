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
      isEmail: true,
    },
    status: {
      type: 'string',
      isIn: ['active', 'inactive', 'maintenance'],
      defaultsTo: 'active',
    },
    openingHours: {
      type: 'json',
      defaultsTo: {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: { open: '09:00', close: '13:00' },
        sunday: { open: null, close: null },
      },
    },
    // Associations
    organization: {
      model: 'organization',
      required: true,
    },
   
    
   
    
   
    
   
  },
}; 