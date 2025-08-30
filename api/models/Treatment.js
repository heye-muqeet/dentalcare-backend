module.exports = {
  attributes: {
    appointment: {
      model: 'appointment',
      required: true,
    },
    doctor: {
      model: 'user',
      required: true,
    },
    patient: {
      model: 'patient',
      required: true,
    },
    diagnosis: {
      type: 'string',
      required: true,
    },
    prescribedMedications: {
      type: 'json',
      defaultsTo: [],
    },
    notes: {
      type: 'string',
      defaultsTo: '',
    },
    servicesUsed: {
      type: 'json',
      defaultsTo: [],
    },
    reports: {
      type: 'json',
      defaultsTo: [],
    },
    followUpRecommended: {
      type: 'boolean',
      defaultsTo: false,
    },
    followUpDate: {
      type: 'string',
      defaultsTo: '',
    },
    followUpTime: {
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
    // media: {
    //   collection: 'media',
    //   via: 'treatmentId',
    // },
    invoice: {
      model: 'invoice',
      unique: true,
    },
    // reports: {
    //   collection: 'report',
    //   via: 'treatmentId',
    // },
  },

  // Lifecycle callbacks
  afterCreate: async function(record, proceed) {
    // If follow-up is recommended, create a new appointment
    if (record.followUpRecommended && record.followUpDate) {
      try {
        const appointment = await Appointment.findOne({ id: record.appointment });
        if (appointment) {
          const appointmentDate = new Date(record.followUpDate);
          const [hours, minutes] = record.followUpTime.split(':').map(Number);
          appointmentDate.setHours(hours, minutes, 0, 0);

          await Appointment.create({
            patient: record.patient,
            doctor: record.doctor,
            addedBy: record.doctor,
            date: appointmentDate.toISOString(),
            time: record.followUpTime, // Use same time slot
            reason: 'Follow-up appointment',
            status: 'pending',
            followUpFor: record.appointment,
            organization: record.organization,
            location: record.location,
            fee: 0,
          });
        }
      } catch (err) {
        sails.log.error('Error creating follow-up appointment:', err);
      }
    }
    return proceed();
  },
}; 