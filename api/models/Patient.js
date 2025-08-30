module.exports = {
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
    phone: {
      type: 'string',
      required: true,
    },
    gender: {
      type: 'string',
      isIn: ['male', 'female', 'other'],
      required: true,
    },
    dob: {
      type: 'string',
      required: true,
    },
    address: {
      type: 'string',
      required: true,
    },
    medicalHistory: {
      type: 'string',
      defaultsTo: '',
    },
    allergies: {
      type: 'string',
      defaultsTo: '',
    },
    balance: {
      type: 'number',
      defaultsTo: 0,
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
    addedBy: {
      model: 'user',
      required: true,
    },
    // Associations
    // appointments: {
    //   collection: 'appointment',
    //   via: 'patientId',
    // },
    // treatments: {
    //   collection: 'treatment',
    //   via: 'patientId',
    // },
    // reports: {
    //   collection: 'report',
    //   via: 'patientId',
    // },
    // tests: {
    //   collection: 'test',
    //   via: 'patientId',
    // },
    // media: {
    //   collection: 'media',
    //   via: 'patientId',
    // },
  },
}; 