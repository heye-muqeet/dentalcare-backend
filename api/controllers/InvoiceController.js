module.exports = {
  // Get all invoices
  find: async function(req, res) {
    try {
      const invoices = await Invoice.find({
        where: {
          location: req.user.location,
        },
        sort: 'createdAt DESC'
      }).populate('patient').populate('treatment');

      return res.json({
        status: 'success',
        data: invoices
      });
    } catch (err) {
      sails.log.error('Error fetching invoices:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Get one invoice
  findOne: async function(req, res) {
    try {
      const { id } = req.params;
      const invoice = await Invoice.findOne({
        id,
        location: req.user.location,
        organization: req.user.organization
      }).populate('patient').populate('treatment');

      if (!invoice) {
        return res.status(404).json({ 
          status: 'error',
          error: sails.config.responses.GENERIC.NOT_FOUND 
        });
      }

      return res.json({
        status: 'success',
        data: invoice
      });
    } catch (err) {
      sails.log.error('Error fetching invoice:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Create a new invoice
  create: async function(req, res) {
    try {
      const {
        date,
        dueDate,
        subtotal,
        tax,
        total,
        notes,
        patient,
        treatment
      } = req.body;

      // Create invoice
      const invoice = await Invoice.create({
        date,
        dueDate,
        subtotal,
        tax,
        total,
        notes,
        patient,
        treatment,
        organization: req.user.organization,
        location: req.user.location
      }).fetch();

      return res.status(201).json({
        status: 'success',
        message: 'Invoice created successfully',
        data: invoice
      });
    } catch (err) {
      sails.log.error('Error creating invoice:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Update an invoice
  update: async function(req, res) {
    try {
      const { id } = req.params;
      const {
        date,
        dueDate,
        subtotal,
        tax,
        total,
        status,
        notes,
        patient,
        treatment
      } = req.body;

      // Find the invoice
      const invoice = await Invoice.findOne({
        id,
        location: req.user.location,
        organization: req.user.organization
      });

      if (!invoice) {
        return res.status(404).json({ 
          status: 'error',
          error: sails.config.responses.GENERIC.NOT_FOUND 
        });
      }

      // Update invoice
      const updatedInvoice = await Invoice.updateOne({ id }).set({
        date,
        dueDate,
        subtotal,
        tax,
        total,
        status,
        notes,
        patient,
        treatment
      });

      return res.json({
        status: 'success',
        message: 'Invoice updated successfully',
        data: updatedInvoice
      });
    } catch (err) {
      sails.log.error('Error updating invoice:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Mark invoice as paid
  markAsPaid: async function(req, res) {
    try {
      const { id } = req.params;

      // Find the invoice
      const invoice = await Invoice.findOne({
        id,
        location: req.user.location,
        organization: req.user.organization
      });

      if (!invoice) {
        return res.status(404).json({ 
          status: 'error',
          error: sails.config.responses.GENERIC.NOT_FOUND 
        });
      }

      // Check if invoice is already paid
      if (invoice.status === 'paid') {
        return res.status(400).json({
          status: 'error',
          error: 'Invoice is already marked as paid'
        });
      }

      // Update invoice status to paid
      const updatedInvoice = await Invoice.updateOne({ id }).set({
        status: 'paid'
      });

      // Update patient balance by subtracting the invoice total
      const patient = await Patient.findOne({ id: invoice.patient });
      if (patient) {
        await Patient.updateOne({ id: invoice.patient }).set({
          balance: Math.max(0, patient.balance - invoice.total) // Ensure balance doesn't go negative
        });
      }

      return res.json({
        status: 'success',
        message: 'Invoice marked as paid successfully',
        data: updatedInvoice
      });
    } catch (err) {
      sails.log.error('Error marking invoice as paid:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  }
}; 