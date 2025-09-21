module.exports = {
  attributes: {
    amount: {
      type: 'number',
      required: true,
    },
    paymentMethod: {
      type: 'string',
      isIn: ['cash', 'card', 'bank_transfer', 'other'],
      required: true,
    },
    paymentDate: {
      type: 'ref',
      columnType: 'datetime',
      required: true,
    },
    transactionId: {
      type: 'string',
      allowNull: true,
    },
    notes: {
      type: 'string',
      defaultsTo: '',
    },
    // Organization and Location references
    organizationId: {
      model: 'organization',
      required: true,
    },
    locationId: {
      model: 'location',
      required: true,
    },
    // Associations
    invoiceId: {
      model: 'invoice',
      required: true,
    },
    patientId: {
      model: 'patient',
      required: true,
    },
  },

  // Lifecycle callbacks
  afterCreate: async function(newlyCreatedRecord, proceed) {
    try {
      // Update invoice status
      const invoice = await Invoice.findOne({ id: newlyCreatedRecord.invoiceId });
      if (invoice) {
        const totalPaid = await Payment.sum('amount')
          .where({ invoiceId: invoice.id });
        
        if (totalPaid >= invoice.total) {
          await Invoice.updateOne({ id: invoice.id })
            .set({ status: 'paid' });
        }
      }

      // Update patient balance
      await Patient.updateOne({ id: newlyCreatedRecord.patientId })
        .set({ balance: { '-=': newlyCreatedRecord.amount } });
    } catch (err) {
      sails.log.error('Error updating payment records:', err);
    }
    return proceed();
  },
}; 