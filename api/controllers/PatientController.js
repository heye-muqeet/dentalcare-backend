module.exports = {
  // Create a new patient
  create: async function(req, res) {
    try {
      const {
        name,
        email,
        phone,
        gender,
        dob,
        address,
        medicalHistory,
        allergies,
      } = req.body;

      // Create patient
      const patient = await Patient.create({
        name,
        email,
        phone,
        gender,
        dob,
        address,
        medicalHistory,
        allergies,
        organization: req.user.organization,
        location: req.user.location,
        addedBy: req.user.id
      }).fetch();

      return res.status(201).json({
        status: 'success',
        message: 'Patient created successfully',
        data: patient
      });
    } catch (err) {
      sails.log.error('Error creating patient:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Get all patients
  find: async function(req, res) {
    try {
      const patients = await Patient.find({
        where: {
          location: req.user.location,
          deletedAt: 0
        },
        sort: 'createdAt DESC'
      });

      return res.json({
        status: 'success',
        data: patients
      });
    } catch (err) {
      sails.log.error('Error fetching patients:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Get one patient
  findOne: async function(req, res) {
    try {
      const { id } = req.params;
      const patient = await Patient.findOne({
        id,
        location: req.user.location,
        deletedAt: 0
      });

      if (!patient) {
        return res.status(404).json({ 
          status: 'error',
          error: sails.config.responses.GENERIC.NOT_FOUND 
        });
      }

      return res.json({
        status: 'success',
        data: patient
      });
    } catch (err) {
      sails.log.error('Error fetching patient:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Update a patient
  update: async function(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        phone,
        gender,
        dob,
        address,
        medicalHistory,
        allergies,
      } = req.body;

      // Find the patient
      const patient = await Patient.findOne({
        id,
        location: req.user.location,
        deletedAt: 0
      });

      if (!patient) {
        return res.status(404).json({ 
          status: 'error',
          error: sails.config.responses.GENERIC.NOT_FOUND 
        });
      }

      // Update patient
      const updatedPatient = await Patient.updateOne({ id }).set({
        name,
        email,
        phone,
        gender,
        dob,
        address,
        medicalHistory,
        allergies,
      });

      return res.json({
        status: 'success',
        message: 'Patient updated successfully',
        data: updatedPatient
      });
    } catch (err) {
      sails.log.error('Error updating patient:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Delete a patient (soft delete)
  destroy: async function(req, res) {
    try {
      const { id } = req.params;
      const patient = await Patient.findOne({
        id,
        organization: req.user.organization,
        deletedAt: 0
      });

      if (!patient) {
        return res.status(404).json({ 
          status: 'error',
          error: sails.config.responses.GENERIC.NOT_FOUND 
        });
      }

      // Soft delete by setting deletedAt timestamp
      await Patient.updateOne({ id }).set({
        deletedAt: Date.now()
      });

      return res.json({
        status: 'success',
        message: 'Patient deleted successfully'
      });
    } catch (err) {
      sails.log.error('Error deleting patient:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Get comprehensive patient details for the patient detail page
  getPatientDetails: async function(req, res) {
    try {
      const { id } = req.params;

      // 1. Fetch Patient Details
      const patient = await Patient.findOne({
        id,
        location: req.user.location, // Assuming location context is important
        organization: req.user.organization,
        deletedAt: 0
      });

      if (!patient) {
        return res.status(404).json({
          status: 'error',
          error: sails.config.responses.GENERIC.NOT_FOUND
        });
      }

      // 2. Fetch Treatments (for Treatment History)
      // Populate appointment details directly here for efficiency
      const treatments = await Treatment.find({
        patient: id,
        organization: req.user.organization
      })
      .populate('doctor') // To get Dr. Name
      .populate('appointment') // To get appointment date
      .sort('createdAt DESC');

      // 3. Fetch Invoices (for calculating total spent and treatment totals)
      const invoices = await Invoice.find({
        patient: id,
        organization: req.user.organization
      });

      // 4. Calculate Statistics
      const totalVisits = treatments.length;
      const totalSpent = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);

      let lastVisitDate = null;
      if (treatments.length > 0 && treatments[0].appointment && treatments[0].appointment.date) {
        lastVisitDate = new Date(treatments[0].appointment.date).toLocaleDateString('en-GB');
      } else if (treatments.length > 0) {
        lastVisitDate = new Date(treatments[0].createdAt).toLocaleDateString('en-GB'); // Fallback
      }
      
      const patientStatus = 'Active'; // As per UI

      return res.json({
        status: 'success',
        data: {
          patientInfo: patient,
          treatmentHistory: treatments.map(t => {
            const relatedInvoice = invoices.find(inv => inv.treatment === t.id);
            let treatmentTotal = 0;
            let services = t.servicesUsed || [];
            // If servicesUsed is a string, try to parse it as JSON
            if (typeof t.servicesUsed === 'string') {
                try {
                    services = JSON.parse(t.servicesUsed);
                } catch (e) {
                    sails.log.warn(`Failed to parse servicesUsed for treatment ${t.id}: ${t.servicesUsed}`);
                    services = []; // Default to empty array on parse error
                }
            }
            
            if (relatedInvoice) {
              treatmentTotal = relatedInvoice.total;
            } else if (Array.isArray(services)) {
              // Fallback to summing servicesUsed if no direct invoice link or if it's preferred
              treatmentTotal = services.reduce((sum, service) => sum + (parseFloat(service.price) || 0), 0);
            }

            return {
              id: t.id,
              appointmentId: t.appointment ? t.appointment.id : null,
              diagnosis: t.diagnosis,
              servicesProvided: services, // Ensure services is an array
              doctorName: t.doctor ? t.doctor.name : 'N/A',
              date: t.appointment && t.appointment.date ? new Date(t.appointment.date).toLocaleDateString('en-GB') : new Date(t.createdAt).toLocaleDateString('en-GB'),
              total: treatmentTotal
            };
          }),
          statistics: {
            totalVisits,
            totalSpent,
            lastVisit: lastVisitDate,
            status: patientStatus
          }
        }
      });

    } catch (err) {
      sails.log.error('Error fetching patient details:', err);
      // Send a more specific error if it's a known type, otherwise generic
      if (err.name === 'UsageError') {
        return res.status(400).json({ status: 'error', error: err.message });
      }
      return res.status(500).json({
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR
      });
    }
  }
}; 