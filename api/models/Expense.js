module.exports = {
  attributes: {
    expenseNumber: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
    },
    amount: {
      type: 'number',
      required: true,
    },
    date: {
      type: 'number',
      required: true,
    },
    category: {
      type: 'string',
      // isIn: ['rent', 'utilities', 'supplies', 'equipment', 'salary', 'maintenance', 'other'],
      required: true,
    },
    notes: {
      type: 'string',
      defaultsTo: '',
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
    addedBy: {
      model: 'user',
      required: true,
    },
    deletedAt: {
      type: 'number',
      defaultsTo: 0,
    },
  },

  // Lifecycle callbacks
  beforeCreate: async function(values, proceed) {
    // Set default date to current date if not provided
    if (!values.date) {
      values.date = new Date();
    }
    return proceed();
  },
}; 