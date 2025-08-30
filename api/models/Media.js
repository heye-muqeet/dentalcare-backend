module.exports = {
  attributes: {
    url: {
      type: 'string',
      required: true,
    },
    type: {
      type: 'string',
      isIn: ['image', 'document', 'xray', 'scan'],
      required: true,
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
    patient: {
      model: 'patient',
      required: true,
    },
    appointment: {
      model: 'appointment',
    },
    treatment: {
      model: 'treatment',
    },
  },

  // Lifecycle callbacks
  beforeCreate: async function(values, proceed) {
    // Validate that at least one association is provided
    if (!values.patient && !values.appointment && !values.treatment) {
      return proceed(new Error('Media must be associated with at least one entity'));
    }
    return proceed();
  },
}; 