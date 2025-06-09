module.exports = {
  attributes: {
    patient: {
      model: 'patient',
      required: true,
    },
    doctor: {
      model: 'user',
      required: true,
    },
    treatment: {
      model: 'treatment',
    },
    appointment: {
      model: 'appointment',
    },
    reportType: {
      type: 'string',
      isIn: ['xray', 'scan', 'blood_test', 'other'],
      required: true,
    },
    title: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      defaultsTo: '',
    },
    date: {
      type: 'ref',
      columnType: 'datetime',
      required: true,
    },
    findings: {
      type: 'string',
      defaultsTo: '',
    },
    recommendations: {
      type: 'string',
      defaultsTo: '',
    },
    // Store Cloudinary URLs for different report formats
    mediaUrls: {
      type: 'json',
      defaultsTo: [],
      // Example structure:
      // [
      //   {
      //     url: "https://cloudinary.com/...",
      //     type: "image",
      //     format: "jpg",
      //     publicId: "cloudinary_public_id",
      //     thumbnailUrl: "https://cloudinary.com/..."
      //   }
      // ]
    },
    isPrivate: {
      type: 'boolean',
      defaultsTo: false,
    },
    status: {
      type: 'string',
      isIn: ['pending', 'completed', 'reviewed'],
      defaultsTo: 'pending',
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